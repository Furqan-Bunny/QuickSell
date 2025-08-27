const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { userUtils } = require('../utils/firestore');
const { firebaseAuthMiddleware } = require('../middleware/firebaseAuth');
const crypto = require('crypto');
const { sendTemplatedEmail } = require('../utils/brevoEmail');

// Register
router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName, referralCode } = req.body;

    // Check if user exists
    const existingUser = await userUtils.findByEmailOrUsername(email, username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user - Always as buyer (user role), only admin can be seller
    const user = await userUtils.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'user', // All registrations are buyers
      verificationToken,
      emailVerified: false,
      isActive: true,
      balance: 0,
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        categories: []
      },
      wishlist: [],
      following: [],
      followers: [],
      ratings: {
        average: 0,
        count: 0
      }
    });

    // Send verification email using Brevo
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await sendTemplatedEmail('verifyEmail', {
      to: email,
      name: `${firstName} ${lastName}`,
      firstName,
      verificationUrl
    });

    // Process referral if code is provided
    if (referralCode) {
      try {
        const axios = require('axios');
        await axios.post(`http://localhost:${process.env.PORT || 5000}/api/affiliate/process-referral`, {
          referralCode,
          newUserId: user.id
        });
      } catch (error) {
        console.error('Error processing referral:', error);
        // Don't fail registration if referral processing fails
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await userUtils.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await userUtils.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    // Update last login
    await userUtils.update(user.id, { lastLogin: new Date() });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify email - TODO: Implement with Firestore
router.post('/verify-email', async (req, res) => {
  try {
    res.status(501).json({ error: 'Email verification not yet implemented with Firestore' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Request password reset - TODO: Implement with Firestore
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    res.status(501).json({ error: 'Password reset not yet implemented with Firestore' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password - TODO: Implement with Firestore
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    res.status(501).json({ error: 'Password reset not yet implemented with Firestore' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', firebaseAuthMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      avatar: req.user.avatar,
      balance: req.user.balance,
      emailVerified: req.user.emailVerified,
      address: req.user.address,
      phone: req.user.phone,
      preferences: req.user.preferences
    }
  });
});

// Logout (client-side token removal, but we can track it server-side if needed)
router.post('/logout', firebaseAuthMiddleware, async (req, res) => {
  try {
    // Here you could implement token blacklisting if needed
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;