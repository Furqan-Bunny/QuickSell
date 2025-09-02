const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');
const { authMiddleware } = require('../middleware/auth');

// Helper function to convert Firebase timestamps to ISO strings
const convertTimestamp = (timestamp) => {
  try {
    if (!timestamp) return new Date().toISOString(); // Return current date if null
    
    // If it's already a valid ISO string, return it
    if (typeof timestamp === 'string') {
      // Check if it's a valid date string
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return timestamp;
      }
      return new Date().toISOString(); // Invalid string, return current date
    }
    
    // If it's a Firebase Timestamp object
    if (timestamp && typeof timestamp === 'object' && timestamp._seconds !== undefined) {
      const seconds = parseInt(timestamp._seconds) || 0;
      const nanoseconds = parseInt(timestamp._nanoseconds) || 0;
      return new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
    }
    
    // If it's a Date object
    if (timestamp instanceof Date) {
      if (!isNaN(timestamp.getTime())) {
        return timestamp.toISOString();
      }
      return new Date().toISOString(); // Invalid date, return current date
    }
    
    // If it's a number (milliseconds or seconds)
    if (typeof timestamp === 'number') {
      // If it's likely seconds (smaller number)
      if (timestamp < 10000000000) {
        return new Date(timestamp * 1000).toISOString();
      }
      // Otherwise treat as milliseconds
      return new Date(timestamp).toISOString();
    }
    
    // If it's an object with toDate method (Firestore Timestamp)
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    
    // Default to current date for any other case
    return new Date().toISOString();
  } catch (error) {
    console.error('Error converting timestamp:', error, timestamp);
    return new Date().toISOString(); // Return current date on any error
  }
};

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
    
    // Create bid data with ISO string dates for consistency
    const now = new Date();
    const bidData = {
      productId,
      userId,
      userName: `${userData.firstName || 'Unknown'} ${userData.lastName || 'User'}`,
      amount,
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    // Simple approach: Just add the bid and update the product
    try {
      // Add the bid
      const bidRef = await db.collection('bids').add(bidData);
      
      // Update product
      await productDoc.ref.update({
        currentPrice: amount,
        totalBids: (product.totalBids || 0) + 1,
        lastBidAt: now.toISOString(),
        updatedAt: now.toISOString()
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
            updatedAt: now.toISOString() 
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
    console.log('Fetching bids for product:', productId);
    
    let bids = [];
    try {
      const bidsSnapshot = await db.collection('bids')
        .where('productId', '==', productId)
        .get();
      
      console.log(`Found ${bidsSnapshot.size} bids for product ${productId}`);
      
      bids = bidsSnapshot.docs.map((doc, index) => {
        const data = doc.data();
        console.log(`Processing bid ${index + 1}:`, { 
          id: doc.id, 
          createdAt: data.createdAt,
          userName: data.userName,
          amount: data.amount 
        });
        
        const createdAt = convertTimestamp(data.createdAt);
        const processedBid = {
          id: doc.id,
          ...data,
          createdAt: createdAt,
          updatedAt: convertTimestamp(data.updatedAt),
          timestamp: createdAt, // Frontend expects timestamp field
          bidder: {
            username: data.userName || data.userId || 'Unknown User'
          }
        };
        
        console.log(`Processed bid ${index + 1} timestamp:`, processedBid.timestamp);
        return processedBid;
      });
      
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
      const bidData = doc.data();
      const createdAt = convertTimestamp(bidData.createdAt);
      const bid = { 
        id: doc.id, 
        ...bidData,
        createdAt: createdAt,
        updatedAt: convertTimestamp(bidData.updatedAt),
        timestamp: createdAt || new Date().toISOString(), // Frontend expects timestamp field
        bidder: {
          username: bidData.userName || 'Unknown User'
        }
      };
      
      // Get product details
      try {
        const productDoc = await db.collection('products').doc(bid.productId).get();
        if (productDoc.exists) {
          const productData = productDoc.data();
          bid.product = {
            id: productDoc.id,
            ...productData,
            endDate: convertTimestamp(productData.endDate),
            createdAt: convertTimestamp(productData.createdAt),
            updatedAt: convertTimestamp(productData.updatedAt),
            lastBidAt: convertTimestamp(productData.lastBidAt)
          };
        }
      } catch (err) {
        console.error('Error fetching product for bid:', err);
      }
      
      bids.push(bid);
    }
    
    // Sort by date in memory (now using ISO strings)
    bids.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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