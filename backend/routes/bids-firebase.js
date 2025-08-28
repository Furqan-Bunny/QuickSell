const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authMiddleware } = require('../middleware/auth');
const emailService = require('../services/emailService');

const db = admin.firestore();

// Place a bid
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, amount } = req.body;
    const userId = req.user.uid;
    
    // Validate input
    if (!productId || !amount) {
      return res.status(400).json({ error: 'Product ID and amount are required' });
    }
    
    // Get product details
    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productDoc.data();
    
    // Check if auction is still active
    if (product.status !== 'active') {
      return res.status(400).json({ error: 'This auction has ended' });
    }
    
    // Check if auction end time has passed
    const now = new Date();
    const endDate = product.endDate?._seconds ? 
      new Date(product.endDate._seconds * 1000) : 
      new Date(product.endDate);
    
    if (now >= endDate) {
      // Update product status
      await productDoc.ref.update({ status: 'ended' });
      return res.status(400).json({ error: 'This auction has ended' });
    }
    
    // Check if user is the seller
    if (product.sellerId === userId) {
      return res.status(400).json({ error: 'You cannot bid on your own item' });
    }
    
    // Validate bid amount
    const minimumBid = product.currentPrice + (product.incrementAmount || 100);
    if (amount < minimumBid) {
      return res.status(400).json({ 
        error: `Minimum bid amount is R${minimumBid}` 
      });
    }
    
    // Check if it exceeds buy now price
    if (product.buyNowPrice && amount >= product.buyNowPrice) {
      return res.status(400).json({ 
        error: `Bid exceeds Buy Now price. Please use Buy Now option instead.` 
      });
    }
    
    // Get user details
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    // Check user balance
    if (userData.balance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance. Please add funds to your account.' 
      });
    }
    
    // Use transaction to ensure consistency
    const result = await db.runTransaction(async (transaction) => {
      // Get current highest bid
      const highestBidSnapshot = await transaction.get(
        db.collection('bids')
          .where('productId', '==', productId)
          .where('status', '==', 'active')
          .orderBy('amount', 'desc')
          .limit(1)
      );
      
      // Create new bid
      const bidRef = db.collection('bids').doc();
      const bidData = {
        productId,
        userId,
        userName: `${userData.firstName} ${userData.lastName}`,
        amount,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      transaction.set(bidRef, bidData);
      
      // Update previous highest bid to outbid status
      let previousBidderData = null;
      if (!highestBidSnapshot.empty) {
        const previousBid = highestBidSnapshot.docs[0];
        previousBidderData = previousBid.data();
        transaction.update(previousBid.ref, { 
          status: 'outbid',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Update product with new current price and bid count
      const updates = {
        currentPrice: amount,
        totalBids: admin.firestore.FieldValue.increment(1),
        lastBidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Track unique bidders
      const existingUserBid = await transaction.get(
        db.collection('bids')
          .where('productId', '==', productId)
          .where('userId', '==', userId)
          .limit(1)
      );
      
      if (existingUserBid.empty) {
        updates.uniqueBidders = admin.firestore.FieldValue.increment(1);
      }
      
      transaction.update(productDoc.ref, updates);
      
      return { bidId: bidRef.id, ...bidData, previousBidderData };
    });
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`auction-${productId}`).emit('new-bid', {
        productId,
        amount,
        userName: result.userName,
        timestamp: new Date()
      });
    }
    
    // Send email notifications
    try {
      // Send bid confirmation to current bidder
      await emailService.sendBidConfirmation(userData, result, product);
      
      // Send outbid notification to previous highest bidder
      if (result.previousBidderData) {
        const previousUserDoc = await db.collection('users').doc(result.previousBidderData.userId).get();
        if (previousUserDoc.exists) {
          const previousUser = previousUserDoc.data();
          await emailService.sendOutbidNotification(previousUser, product, amount);
        }
      }
    } catch (emailError) {
      console.error('Error sending email notifications:', emailError);
      // Don't fail the bid if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ error: 'Failed to place bid' });
  }
});

// Get bids for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const bidsSnapshot = await db.collection('bids')
      .where('productId', '==', productId)
      .orderBy('amount', 'desc')
      .limit(20)
      .get();
    
    const bids = bidsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Get user's active bids
router.get('/my-bids', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const status = req.query.status || 'active';
    console.log('Fetching bids for user:', userId, 'with status:', status);
    
    let bidsSnapshot;
    try {
      let query = db.collection('bids')
        .where('userId', '==', userId);
      
      if (status !== 'all') {
        query = query.where('status', '==', status);
      }
      
      bidsSnapshot = await query
        .orderBy('createdAt', 'desc')
        .get();
    } catch (queryError) {
      console.log('Bids query with orderBy failed, trying without:', queryError.message);
      // Fallback without ordering if index is missing
      let query = db.collection('bids')
        .where('userId', '==', userId);
      
      if (status !== 'all') {
        query = query.where('status', '==', status);
      }
      
      bidsSnapshot = await query.get();
    }
    
    const bids = [];
    for (const doc of bidsSnapshot.docs) {
      const bid = { id: doc.id, ...doc.data() };
      
      // Get product details
      const productDoc = await db.collection('products').doc(bid.productId).get();
      if (productDoc.exists) {
        bid.product = {
          id: productDoc.id,
          ...productDoc.data()
        };
      }
      
      bids.push(bid);
    }
    
    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('Error fetching user bids:', error);
    res.status(500).json({ error: 'Failed to fetch your bids' });
  }
});

// Check if user is highest bidder
router.get('/highest/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.uid;
    
    const highestBidSnapshot = await db.collection('bids')
      .where('productId', '==', productId)
      .where('status', '==', 'active')
      .orderBy('amount', 'desc')
      .limit(1)
      .get();
    
    if (highestBidSnapshot.empty) {
      return res.json({
        success: true,
        isHighestBidder: false,
        highestBid: null
      });
    }
    
    const highestBid = highestBidSnapshot.docs[0].data();
    
    res.json({
      success: true,
      isHighestBidder: highestBid.userId === userId,
      highestBid: {
        amount: highestBid.amount,
        userName: highestBid.userName,
        timestamp: highestBid.createdAt
      }
    });
  } catch (error) {
    console.error('Error checking highest bid:', error);
    res.status(500).json({ error: 'Failed to check bid status' });
  }
});

// Cancel/retract a bid (if allowed by rules)
router.delete('/:bidId', authMiddleware, async (req, res) => {
  try {
    const { bidId } = req.params;
    const userId = req.user.uid;
    
    const bidDoc = await db.collection('bids').doc(bidId).get();
    
    if (!bidDoc.exists) {
      return res.status(404).json({ error: 'Bid not found' });
    }
    
    const bid = bidDoc.data();
    
    // Check if user owns this bid
    if (bid.userId !== userId) {
      return res.status(403).json({ error: 'You can only cancel your own bids' });
    }
    
    // Check if bid is still active
    if (bid.status !== 'active') {
      return res.status(400).json({ error: 'Only active bids can be cancelled' });
    }
    
    // Check if there are higher bids (can't cancel if you're not the highest bidder)
    const higherBidsSnapshot = await db.collection('bids')
      .where('productId', '==', bid.productId)
      .where('amount', '>', bid.amount)
      .where('status', '==', 'active')
      .get();
    
    if (!higherBidsSnapshot.empty) {
      return res.status(400).json({ 
        error: 'You have been outbid. This bid cannot be cancelled.' 
      });
    }
    
    // Update bid status
    await bidDoc.ref.update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Find the next highest bid and make it active
    const nextBidSnapshot = await db.collection('bids')
      .where('productId', '==', bid.productId)
      .where('status', '==', 'outbid')
      .orderBy('amount', 'desc')
      .limit(1)
      .get();
    
    if (!nextBidSnapshot.empty) {
      const nextBid = nextBidSnapshot.docs[0];
      const nextBidData = nextBid.data();
      
      // Update next bid to active
      await nextBid.ref.update({
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update product current price
      await db.collection('products').doc(bid.productId).update({
        currentPrice: nextBidData.amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // No other bids, reset to starting price
      const productDoc = await db.collection('products').doc(bid.productId).get();
      const product = productDoc.data();
      
      await productDoc.ref.update({
        currentPrice: product.startingPrice,
        totalBids: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({
      success: true,
      message: 'Bid cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling bid:', error);
    res.status(500).json({ error: 'Failed to cancel bid' });
  }
});

module.exports = router;