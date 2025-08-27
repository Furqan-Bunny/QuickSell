const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const admin = require('firebase-admin');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const db = admin.firestore();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -verificationToken')
      .populate('wishlist', 'title images currentPrice endDate');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's active listings
    const activeListings = await Product.countDocuments({
      seller: user._id,
      status: 'active'
    });

    // Get user's completed sales
    const completedSales = await Order.countDocuments({
      seller: user._id,
      status: 'completed'
    });

    res.json({
      user,
      stats: {
        activeListings,
        completedSales,
        rating: user.ratings.average,
        totalRatings: user.ratings.count
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, upload.single('avatar'), [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional().trim(),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.country').optional().trim(),
  body('address.zipCode').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'address'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle avatar upload
    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update password
router.put('/password', authMiddleware, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { notifications, categories } = req.body;

    const updates = {};
    if (notifications) updates['preferences.notifications'] = notifications;
    if (categories) updates['preferences.categories'] = categories;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select('preferences');

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add/remove from wishlist
router.post('/wishlist/:productId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    const index = user.wishlist.indexOf(productId);
    
    if (index === -1) {
      user.wishlist.push(productId);
      await user.save();
      res.json({ message: 'Added to wishlist', added: true });
    } else {
      user.wishlist.splice(index, 1);
      await user.save();
      res.json({ message: 'Removed from wishlist', added: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get wishlist
router.get('/wishlist/items', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'wishlist',
        select: 'title images currentPrice endDate status seller',
        populate: {
          path: 'seller',
          select: 'username'
        }
      });

    res.json(user.wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow/unfollow user
router.post('/follow/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.userId);
    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);
    
    const isFollowing = currentUser.following.includes(req.params.userId);
    
    if (!isFollowing) {
      currentUser.following.push(req.params.userId);
      userToFollow.followers.push(req.user._id);
      
      await currentUser.save();
      await userToFollow.save();
      
      res.json({ message: 'User followed successfully', following: true });
    } else {
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== req.params.userId
      );
      userToFollow.followers = userToFollow.followers.filter(
        id => id.toString() !== req.user._id.toString()
      );
      
      await currentUser.save();
      await userToFollow.save();
      
      res.json({ message: 'User unfollowed successfully', following: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'username firstName lastName avatar');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.followers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get following
router.get('/:userId/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'username firstName lastName avatar');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.following);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's dashboard stats
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get various stats
    const [
      activeAuctions,
      wonAuctions,
      activeBids,
      watchingCount,
      ordersCount,
      totalSpent
    ] = await Promise.all([
      Product.countDocuments({ seller: userId, status: 'active' }),
      Product.countDocuments({ winner: userId }),
      Product.countDocuments({
        'bids.bidder': userId,
        status: 'active'
      }),
      Product.countDocuments({ watchers: userId }),
      Order.countDocuments({ buyer: userId }),
      Order.aggregate([
        { $match: { buyer: userId, 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount.total' } } }
      ])
    ]);

    res.json({
      activeAuctions,
      wonAuctions,
      activeBids,
      watchingCount,
      ordersCount,
      totalSpent: totalSpent[0]?.total || 0,
      balance: req.user.balance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;