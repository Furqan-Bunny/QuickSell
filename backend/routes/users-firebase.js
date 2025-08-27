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
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
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
    
    // Get user's orders
    const ordersSnapshot = await db.collection('orders')
      .where('buyerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    // Get user's watchlist
    const watchlistSnapshot = await db.collection('watchlist')
      .where('userId', '==', userId)
      .get();
    
    // Process recent activity
    const recentActivity = [];
    
    // Add recent bids to activity
    const recentBidsSnapshot = await db.collection('bids')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
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
    
    // Get recent products for recommendations
    const recommendedProducts = await db.collection('products')
      .where('status', '==', 'active')
      .orderBy('views', 'desc')
      .limit(4)
      .get();
    
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

module.exports = router;