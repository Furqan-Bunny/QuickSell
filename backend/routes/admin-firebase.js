const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authMiddleware } = require('../middleware/auth');

const db = admin.firestore();

// Admin middleware - check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    if (userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Get admin dashboard stats
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get all collections counts
    const usersSnapshot = await db.collection('users').get();
    const productsSnapshot = await db.collection('products').get();
    const ordersSnapshot = await db.collection('orders').get();
    const bidsSnapshot = await db.collection('bids').get();
    const categoriesSnapshot = await db.collection('categories').get();
    
    // Calculate user stats
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const userStats = {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      sellers: users.filter(u => u.role === 'seller').length,
      buyers: users.filter(u => u.role === 'user' || !u.role).length,
      verified: users.filter(u => u.verified).length,
      activeToday: users.filter(u => {
        const lastActive = u.lastActiveAt?._seconds ? 
          new Date(u.lastActiveAt._seconds * 1000) : null;
        return lastActive && (Date.now() - lastActive.getTime()) < 24 * 60 * 60 * 1000;
      }).length
    };
    
    // Calculate product stats
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const productStats = {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      ended: products.filter(p => p.status === 'ended').length,
      sold: products.filter(p => p.status === 'sold').length,
      totalValue: products.reduce((sum, p) => sum + (p.currentPrice || 0), 0),
      avgPrice: products.length > 0 ? 
        products.reduce((sum, p) => sum + (p.currentPrice || 0), 0) / products.length : 0
    };
    
    // Calculate order stats
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const orderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending_payment').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders
        .filter(o => o.paymentStatus === 'completed')
        .reduce((sum, o) => sum + (o.amount || 0), 0),
      platformFees: orders
        .filter(o => o.paymentStatus === 'completed')
        .reduce((sum, o) => sum + ((o.amount || 0) * 0.1), 0) // 10% platform fee
    };
    
    // Calculate bid stats
    const bids = bidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const bidStats = {
      total: bids.length,
      active: bids.filter(b => b.status === 'active').length,
      totalValue: bids.reduce((sum, b) => sum + (b.amount || 0), 0),
      uniqueBidders: new Set(bids.map(b => b.userId)).size
    };
    
    // Get recent activities
    const recentActivities = [];
    
    // Recent users
    const recentUsers = users
      .sort((a, b) => {
        const aTime = a.createdAt?._seconds || 0;
        const bTime = b.createdAt?._seconds || 0;
        return bTime - aTime;
      })
      .slice(0, 5)
      .map(u => ({
        type: 'user_joined',
        userName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        timestamp: u.createdAt
      }));
    
    // Recent products
    const recentProducts = products
      .sort((a, b) => {
        const aTime = a.createdAt?._seconds || 0;
        const bTime = b.createdAt?._seconds || 0;
        return bTime - aTime;
      })
      .slice(0, 5)
      .map(p => ({
        type: 'product_listed',
        productTitle: p.title,
        price: p.startingPrice,
        sellerId: p.sellerId,
        timestamp: p.createdAt
      }));
    
    // Recent orders
    const recentOrders = orders
      .sort((a, b) => {
        const aTime = a.createdAt?._seconds || 0;
        const bTime = b.createdAt?._seconds || 0;
        return bTime - aTime;
      })
      .slice(0, 5)
      .map(o => ({
        type: 'order_placed',
        productTitle: o.productTitle,
        amount: o.amount,
        buyerName: o.buyerName,
        timestamp: o.createdAt
      }));
    
    // Merge and sort all activities
    recentActivities.push(...recentUsers, ...recentProducts, ...recentOrders);
    recentActivities.sort((a, b) => {
      const aTime = a.timestamp?._seconds || 0;
      const bTime = b.timestamp?._seconds || 0;
      return bTime - aTime;
    });
    
    res.json({
      success: true,
      data: {
        stats: {
          users: userStats,
          products: productStats,
          orders: orderStats,
          bids: bidStats,
          categories: categoriesSnapshot.size
        },
        recentActivities: recentActivities.slice(0, 15),
        topProducts: products
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 5),
        topSellers: await getTopSellers()
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Helper function to get top sellers
async function getTopSellers() {
  const ordersSnapshot = await db.collection('orders')
    .where('paymentStatus', '==', 'completed')
    .get();
  
  const sellerRevenue = {};
  ordersSnapshot.docs.forEach(doc => {
    const order = doc.data();
    if (order.sellerId) {
      sellerRevenue[order.sellerId] = (sellerRevenue[order.sellerId] || 0) + (order.amount || 0);
    }
  });
  
  const topSellerIds = Object.entries(sellerRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);
  
  const sellers = [];
  for (const sellerId of topSellerIds) {
    const userDoc = await db.collection('users').doc(sellerId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      sellers.push({
        id: sellerId,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        revenue: sellerRevenue[sellerId]
      });
    }
  }
  
  return sellers;
}

// Get all users with pagination
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = db.collection('users');
    
    if (role && role !== 'all') {
      query = query.where('role', '==', role);
    }
    
    const snapshot = await query.get();
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.email?.toLowerCase().includes(searchLower) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by creation date
    users.sort((a, b) => {
      const aTime = a.createdAt?._seconds || 0;
      const bTime = b.createdAt?._seconds || 0;
      return bTime - aTime;
    });
    
    // Paginate
    const paginatedUsers = users.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        total: users.length,
        page: parseInt(page),
        totalPages: Math.ceil(users.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role or status
router.put('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, verified, suspended } = req.body;
    
    const updates = {};
    if (role !== undefined) updates.role = role;
    if (verified !== undefined) updates.verified = verified;
    if (suspended !== undefined) updates.suspended = suspended;
    
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    updates.updatedBy = req.user.uid;
    
    await db.collection('users').doc(userId).update(updates);
    
    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user account
router.delete('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Don't allow deleting admin accounts
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists && userDoc.data().role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin accounts' });
    }
    
    // Delete user document
    await db.collection('users').doc(userId).delete();
    
    // Also delete from Firebase Auth
    try {
      await admin.auth().deleteUser(userId);
    } catch (authError) {
      console.error('Error deleting from Auth:', authError);
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all products for moderation
router.get('/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = db.collection('products');
    
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.get();
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by creation date
    products.sort((a, b) => {
      const aTime = a.createdAt?._seconds || 0;
      const bTime = b.createdAt?._seconds || 0;
      return bTime - aTime;
    });
    
    // Get seller info for each product
    for (const product of products) {
      if (product.sellerId) {
        const sellerDoc = await db.collection('users').doc(product.sellerId).get();
        if (sellerDoc.exists) {
          const seller = sellerDoc.data();
          product.sellerName = `${seller.firstName} ${seller.lastName}`;
          product.sellerEmail = seller.email;
        }
      }
    }
    
    // Paginate
    const paginatedProducts = products.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      data: {
        products: paginatedProducts,
        total: products.length,
        page: parseInt(page),
        totalPages: Math.ceil(products.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Approve/reject product
router.put('/products/:productId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { status, reason } = req.body;
    
    const updates = {
      status,
      moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
      moderatedBy: req.user.uid
    };
    
    if (reason) {
      updates.moderationReason = reason;
    }
    
    await db.collection('products').doc(productId).update(updates);
    
    res.json({
      success: true,
      message: 'Product status updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:productId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Delete product
    await db.collection('products').doc(productId).delete();
    
    // Delete associated bids
    const bidsSnapshot = await db.collection('bids')
      .where('productId', '==', productId)
      .get();
    
    const batch = db.batch();
    bidsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get all categories
router.get('/categories', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const categoriesSnapshot = await db.collection('categories')
      .orderBy('order', 'asc')
      .get();
    
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/categories', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, icon, description, order } = req.body;
    
    const categoryData = {
      name,
      icon,
      description,
      order: order || 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid
    };
    
    const docRef = await db.collection('categories').add(categoryData);
    
    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...categoryData
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/categories/:categoryId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, icon, description, order } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (icon !== undefined) updates.icon = icon;
    if (description !== undefined) updates.description = description;
    if (order !== undefined) updates.order = order;
    
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    updates.updatedBy = req.user.uid;
    
    await db.collection('categories').doc(categoryId).update(updates);
    
    res.json({
      success: true,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/categories/:categoryId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Check if any products use this category
    const productsSnapshot = await db.collection('products')
      .where('categoryId', '==', categoryId)
      .limit(1)
      .get();
    
    if (!productsSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing products' 
      });
    }
    
    await db.collection('categories').doc(categoryId).delete();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get system settings
router.get('/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const settingsDoc = await db.collection('settings').doc('general').get();
    
    const defaultSettings = {
      platformFeePercentage: 10,
      minBidIncrement: 100,
      maxAuctionDuration: 30,
      emailNotifications: true,
      autoEndAuctions: true,
      requireVerification: false
    };
    
    const settings = settingsDoc.exists ? settingsDoc.data() : defaultSettings;
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update system settings
router.put('/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updates = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid
    };
    
    await db.collection('settings').doc('general').set(updates, { merge: true });
    
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;