const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authMiddleware } = require('../middleware/auth');

const db = admin.firestore();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    delete userData.password; // Never send password
    
    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user dashboard stats
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log('Fetching dashboard for user:', userId);
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('User not found in Firestore:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userDoc.data();
    
    // Get user's active bids
    const activeBidsSnapshot = await db.collection('bids')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();
    
    // Get user's won auctions
    const wonAuctionsSnapshot = await db.collection('products')
      .where('winnerId', '==', userId)
      .where('status', '==', 'sold')
      .get();
    
    // Get user's orders - handle potential missing index
    let ordersSnapshot;
    try {
      ordersSnapshot = await db.collection('orders')
        .where('buyerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
    } catch (orderError) {
      console.log('Order query failed, trying without orderBy:', orderError.message);
      // Fallback without ordering if index is missing
      ordersSnapshot = await db.collection('orders')
        .where('buyerId', '==', userId)
        .limit(5)
        .get();
    
    // Get user's watchlist
    const watchlistSnapshot = await db.collection('watchlist')
      .where('userId', '==', userId)
      .get();
    
    // Process recent activity
    const recentActivity = [];
    
    // Add recent bids to activity - handle potential missing index
    let recentBidsSnapshot;
    try {
      recentBidsSnapshot = await db.collection('bids')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
    } catch (bidError) {
      console.log('Bids query failed, trying without orderBy:', bidError.message);
      // Fallback without ordering if index is missing
      recentBidsSnapshot = await db.collection('bids')
        .where('userId', '==', userId)
        .limit(10)
        .get();
    }
    
    for (const doc of recentBidsSnapshot.docs) {
      const bid = doc.data();
      const productDoc = await db.collection('products').doc(bid.productId).get();
      if (productDoc.exists) {
        recentActivity.push({
          id: doc.id,
          type: 'bid',
          description: `Placed bid on ${productDoc.data().title}`,
          amount: bid.amount,
          timestamp: bid.createdAt,
          status: bid.status
        });
      }
    }
    
    // Sort activity by timestamp
    recentActivity.sort((a, b) => {
      const timeA = a.timestamp?._seconds || 0;
      const timeB = b.timestamp?._seconds || 0;
      return timeB - timeA;
    });
    
    // Calculate stats
    const stats = {
      totalBids: activeBidsSnapshot.size,
      wonAuctions: wonAuctionsSnapshot.size,
      totalSpent: userData.totalSpent || 0,
      watchlistCount: watchlistSnapshot.size,
      balance: userData.balance || 0,
      pendingOrders: ordersSnapshot.docs.filter(doc => 
        doc.data().status === 'pending' || doc.data().status === 'processing'
      ).length
    };
    
    // Get recent products for recommendations - handle potential missing index
    let recommendedProducts;
    try {
      recommendedProducts = await db.collection('products')
        .where('status', '==', 'active')
        .orderBy('views', 'desc')
        .limit(4)
        .get();
    } catch (productError) {
      console.log('Products query failed, trying without orderBy:', productError.message);
      // Fallback without ordering if index is missing
      recommendedProducts = await db.collection('products')
        .where('status', '==', 'active')
        .limit(4)
        .get();
    }
    
    const recommendations = recommendedProducts.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: {
        user: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          avatar: userData.avatar,
          memberSince: userData.createdAt
        },
        stats,
        recentActivity: recentActivity.slice(0, 5),
        recommendations
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'bio'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('users').doc(req.user.uid).update(updates);
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user's bids
router.get('/bids', authMiddleware, async (req, res) => {
  try {
    const bidsSnapshot = await db.collection('bids')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
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
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Get user's orders
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders')
      .where('buyerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Add to watchlist
router.post('/watchlist/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.uid;
    
    // Check if already in watchlist
    const existingSnapshot = await db.collection('watchlist')
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .get();
    
    if (!existingSnapshot.empty) {
      // Remove from watchlist
      await existingSnapshot.docs[0].ref.delete();
      
      res.json({
        success: true,
        message: 'Removed from watchlist',
        added: false
      });
    } else {
      // Add to watchlist
      await db.collection('watchlist').add({
        userId,
        productId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({
        success: true,
        message: 'Added to watchlist',
        added: true
      });
    }
  } catch (error) {
    console.error('Error updating watchlist:', error);
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

// Get watchlist
router.get('/watchlist', authMiddleware, async (req, res) => {
  try {
    const watchlistSnapshot = await db.collection('watchlist')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const watchlist = [];
    for (const doc of watchlistSnapshot.docs) {
      const item = doc.data();
      
      // Get product details
      const productDoc = await db.collection('products').doc(item.productId).get();
      if (productDoc.exists) {
        watchlist.push({
          id: doc.id,
          product: {
            id: productDoc.id,
            ...productDoc.data()
          },
          addedAt: item.createdAt
        });
      }
    }
    
    res.json({
      success: true,
      data: watchlist
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// Get seller dashboard stats
router.get('/seller-dashboard', authMiddleware, async (req, res) => {
  try {
    const sellerId = req.user.uid;
    
    // Get seller's products
    const productsSnapshot = await db.collection('products')
      .where('sellerId', '==', sellerId)
      .get();
    
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get seller's sales (orders where they are the seller)
    const salesSnapshot = await db.collection('orders')
      .where('sellerId', '==', sellerId)
      .get();
    
    const sales = salesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calculate stats
    const stats = {
      totalListings: products.length,
      activeListings: products.filter(p => p.status === 'active').length,
      soldItems: products.filter(p => p.status === 'sold').length,
      endedAuctions: products.filter(p => p.status === 'ended').length,
      totalSales: sales.filter(s => s.paymentStatus === 'completed').length,
      pendingPayments: sales.filter(s => s.paymentStatus === 'pending').length,
      totalRevenue: sales
        .filter(s => s.paymentStatus === 'completed')
        .reduce((sum, s) => sum + (s.amount || 0), 0),
      totalBids: products.reduce((sum, p) => sum + (p.totalBids || 0), 0),
      totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0),
      averagePrice: products.length > 0 
        ? products.reduce((sum, p) => sum + (p.currentPrice || 0), 0) / products.length 
        : 0
    };
    
    // Get recent activity
    const recentActivity = [];
    
    // Add recent bids on seller's products
    for (const product of products.slice(0, 5)) {
      const bidsSnapshot = await db.collection('bids')
        .where('productId', '==', product.id)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (!bidsSnapshot.empty) {
        const bid = bidsSnapshot.docs[0].data();
        recentActivity.push({
          type: 'bid',
          productTitle: product.title,
          amount: bid.amount,
          userName: bid.userName,
          timestamp: bid.createdAt
        });
      }
    }
    
    // Sort activity by timestamp
    recentActivity.sort((a, b) => {
      const timeA = a.timestamp?._seconds || 0;
      const timeB = b.timestamp?._seconds || 0;
      return timeB - timeA;
    });
    
    res.json({
      success: true,
      data: {
        stats,
        recentProducts: products.slice(0, 5),
        recentSales: sales.slice(0, 5),
        recentActivity: recentActivity.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch seller dashboard' });
  }
});

module.exports = router;