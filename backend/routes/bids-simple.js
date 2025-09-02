const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');
const { authMiddleware } = require('../middleware/auth');

// Simple bid placement without complex transactions
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Check if Firebase is available
    if (!db) {
      console.error('Firebase Firestore is not initialized!');
      console.error('Please set FIREBASE_SERVICE_ACCOUNT environment variable in Railway');
      return res.status(503).json({ 
        error: 'Database service is not configured. Please contact administrator.',
        hint: 'Firebase credentials are missing in Railway environment variables'
      });
    }
    
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
    
    // Get user details
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userDoc.data();
    
    // Create bid data
    const bidData = {
      productId,
      userId,
      userName: `${userData.firstName || 'Unknown'} ${userData.lastName || 'User'}`,
      amount,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Simple approach: Just add the bid and update the product
    try {
      // Add the bid
      const bidRef = await db.collection('bids').add(bidData);
      
      // Update product
      await productDoc.ref.update({
        currentPrice: amount,
        totalBids: (product.totalBids || 0) + 1,
        lastBidAt: new Date(),
        updatedAt: new Date()
      });
      
      // Mark previous bids as outbid (simple approach, no transaction)
      // Note: Firebase doesn't support != in compound queries, so we get all active bids
      const previousBids = await db.collection('bids')
        .where('productId', '==', productId)
        .where('status', '==', 'active')
        .get();
      
      // Filter out the current user's bid and update others
      const updatePromises = previousBids.docs
        .filter(doc => doc.data().userId !== userId)
        .map(doc => 
          doc.ref.update({ 
            status: 'outbid', 
            updatedAt: new Date() 
          })
        );
      
      await Promise.all(updatePromises);
      
      res.status(201).json({
        success: true,
        message: 'Bid placed successfully',
        data: { id: bidRef.id, ...bidData }
      });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        error: 'Failed to save bid. Please try again.' 
      });
    }
    
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ 
      error: 'Failed to place bid',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get bids for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    let bids = [];
    try {
      const bidsSnapshot = await db.collection('bids')
        .where('productId', '==', productId)
        .get();
      
      bids = bidsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by amount in memory
      bids.sort((a, b) => (b.amount || 0) - (a.amount || 0));
      bids = bids.slice(0, 20); // Limit to 20
      
    } catch (queryError) {
      console.error('Error fetching bids:', queryError);
      bids = [];
    }
    
    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Get user's bids
router.get('/my-bids', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const status = req.query.status || 'active';
    
    let query = db.collection('bids').where('userId', '==', userId);
    
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    const bidsSnapshot = await query.get();
    
    const bids = [];
    for (const doc of bidsSnapshot.docs) {
      const bid = { id: doc.id, ...doc.data() };
      
      // Get product details
      try {
        const productDoc = await db.collection('products').doc(bid.productId).get();
        if (productDoc.exists) {
          bid.product = {
            id: productDoc.id,
            ...productDoc.data()
          };
        }
      } catch (err) {
        console.error('Error fetching product for bid:', err);
      }
      
      bids.push(bid);
    }
    
    // Sort by date in memory
    bids.sort((a, b) => {
      const dateA = a.createdAt?._seconds ? a.createdAt._seconds : 0;
      const dateB = b.createdAt?._seconds ? b.createdAt._seconds : 0;
      return dateB - dateA;
    });
    
    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('Error fetching user bids:', error);
    res.status(500).json({ error: 'Failed to fetch your bids' });
  }
});

module.exports = router;