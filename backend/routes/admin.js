const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get dashboard stats
router.get('/stats', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const [users, products, orders, revenue] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount.total' } } }
      ])
    ]);
    
    res.json({
      users,
      products,
      orders,
      revenue: revenue[0]?.total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const users = await User.find()
      .select('-password')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments();
    
    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user status
router.put('/users/:id/status', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User status updated', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product status
router.put('/products/:id/status', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { status, featured } = req.body;
    
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (featured !== undefined) updates.featured = featured;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product updated', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;