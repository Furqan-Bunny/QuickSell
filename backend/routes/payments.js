const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const flutterwaveService = require('../services/flutterwave');
const payfastService = require('../services/payfast');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { db } = require('../config/firebase');

// Initialize payment - supports both Flutterwave and Payfast
router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    
    // Get order details
    const order = await Order.findById(orderId)
      .populate('product')
      .populate('buyer');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const paymentData = {
      orderId: order._id.toString(),
      productId: order.product._id.toString(),
      userId: req.user._id.toString(),
      amount: order.totalAmount,
      email: req.user.email,
      phone: req.user.phone || '',
      name: `${req.user.firstName} ${req.user.lastName}`,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      itemName: order.product.title,
      description: `Payment for ${order.product.title}`,
      bidId: order.bid
    };

    let result;
    
    if (paymentMethod === 'flutterwave') {
      result = await flutterwaveService.initializePayment(paymentData);
    } else if (paymentMethod === 'payfast') {
      result = await payfastService.initializePayment(paymentData);
    } else {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    if (result.success) {
      // Save payment initialization to Firebase
      if (db) {
        await db.collection('payment_intents').add({
          orderId: orderId,
          userId: req.user._id.toString(),
          paymentMethod: paymentMethod,
          amount: order.totalAmount,
          status: 'pending',
          createdAt: new Date(),
          metadata: result.data
        });
      }

      // Update order with payment method
      order.paymentMethod = paymentMethod;
      order.paymentStatus = 'pending';
      await order.save();

      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// Flutterwave webhook
router.post('/flutterwave/webhook', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    
    if (!signature || !flutterwaveService.validateWebhook(signature, req.body)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { data } = req.body;
    
    if (data.status === 'successful') {
      // Verify payment with Flutterwave
      const verification = await flutterwaveService.verifyPayment(data.id);
      
      if (verification.success) {
        // Update order
        const order = await Order.findById(verification.data.meta.orderId);
        if (order) {
          order.paymentStatus = 'completed';
          order.paymentDetails = {
            transactionId: verification.data.transactionId,
            txRef: verification.data.txRef,
            paymentType: verification.data.paymentType,
            paidAt: new Date()
          };
          await order.save();

          // Update Firebase
          if (db) {
            const snapshot = await db.collection('payment_intents')
              .where('orderId', '==', order._id.toString())
              .where('status', '==', 'pending')
              .get();
            
            snapshot.forEach(async (doc) => {
              await doc.ref.update({
                status: 'completed',
                completedAt: new Date(),
                transactionDetails: verification.data
              });
            });
          }

          // Update product status
          const product = await Product.findById(order.product);
          if (product) {
            product.status = 'sold';
            await product.save();
          }

          // Send notification to seller
          const io = req.app.get('io');
          io.to(`user-${order.seller}`).emit('payment-received', {
            orderId: order._id,
            amount: order.totalAmount
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Payfast webhook (ITN - Instant Transaction Notification)
router.post('/payfast/webhook', async (req, res) => {
  try {
    const pfData = req.body;
    const pfParamString = Object.keys(pfData)
      .map(key => `${key}=${encodeURIComponent(pfData[key])}`)
      .join('&');

    // Validate the payment notification
    const isValid = await payfastService.validateWebhook(pfData, pfParamString);
    
    if (!isValid) {
      return res.status(400).send('Invalid notification');
    }

    if (pfData.payment_status === 'COMPLETE') {
      // Update order
      const order = await Order.findById(pfData.m_payment_id);
      if (order) {
        order.paymentStatus = 'completed';
        order.paymentDetails = {
          paymentId: pfData.pf_payment_id,
          amount: parseFloat(pfData.amount_gross),
          fee: parseFloat(pfData.amount_fee),
          net: parseFloat(pfData.amount_net),
          paymentMethod: pfData.payment_method,
          paidAt: new Date()
        };
        await order.save();

        // Update Firebase
        if (db) {
          const snapshot = await db.collection('payment_intents')
            .where('orderId', '==', order._id.toString())
            .where('status', '==', 'pending')
            .get();
          
          snapshot.forEach(async (doc) => {
            await doc.ref.update({
              status: 'completed',
              completedAt: new Date(),
              transactionDetails: pfData
            });
          });
        }

        // Update product status
        const product = await Product.findById(order.product);
        if (product) {
          product.status = 'sold';
          await product.save();
        }

        // Send notification to seller
        const io = req.app.get('io');
        io.to(`user-${order.seller}`).emit('payment-received', {
          orderId: order._id,
          amount: order.totalAmount
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Payfast webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Verify payment status
router.get('/verify/:orderId', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyer.toString() !== req.user._id.toString() && 
        order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentDetails: order.paymentDetails
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Process refund
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const { orderId, reason, amount } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({ error: 'Order not paid' });
    }

    const refundAmount = amount || order.totalAmount;
    let result;

    if (order.paymentMethod === 'flutterwave') {
      result = await flutterwaveService.refundPayment(
        order.paymentDetails.transactionId,
        refundAmount
      );
    } else if (order.paymentMethod === 'payfast') {
      result = await payfastService.refundPayment(
        order.paymentDetails.paymentId,
        refundAmount,
        reason
      );
    } else {
      return res.status(400).json({ error: 'Unsupported payment method for refund' });
    }

    if (result.success) {
      order.paymentStatus = 'refunded';
      order.refundDetails = {
        amount: refundAmount,
        reason: reason,
        refundedAt: new Date(),
        refundId: result.data.id || result.data.refund_id
      };
      await order.save();

      // Update Firebase
      if (db) {
        await db.collection('refunds').add({
          orderId: orderId,
          amount: refundAmount,
          reason: reason,
          status: 'completed',
          createdAt: new Date(),
          processedBy: req.user._id.toString()
        });
      }

      res.json({ message: 'Refund processed successfully', data: result.data });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Refund processing failed' });
  }
});

// Get payment methods
router.get('/methods', (req, res) => {
  const methods = [
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      description: 'Pay with card, mobile money, or bank transfer',
      countries: ['ZA', 'NG', 'KE', 'GH', 'UG', 'TZ'],
      currencies: ['ZAR', 'NGN', 'KES', 'GHS', 'UGX', 'TZS'],
      logo: '/images/flutterwave-logo.png'
    },
    {
      id: 'payfast',
      name: 'PayFast',
      description: 'South Africa\'s leading payment gateway',
      countries: ['ZA'],
      currencies: ['ZAR'],
      logo: '/images/payfast-logo.png'
    }
  ];

  res.json(methods);
});

// Add funds to wallet
router.post('/add-funds', authMiddleware, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    
    const paymentData = {
      userId: req.user._id.toString(),
      amount: amount,
      email: req.user.email,
      phone: req.user.phone || '',
      name: `${req.user.firstName} ${req.user.lastName}`,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      description: 'Wallet top-up',
      orderId: `wallet-${req.user._id}-${Date.now()}`
    };

    let result;
    
    if (paymentMethod === 'flutterwave') {
      result = await flutterwaveService.initializePayment(paymentData);
    } else if (paymentMethod === 'payfast') {
      result = await payfastService.initializePayment(paymentData);
    } else {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    if (result.success) {
      // Save to Firebase
      if (db) {
        await db.collection('wallet_topups').add({
          userId: req.user._id.toString(),
          amount: amount,
          paymentMethod: paymentMethod,
          status: 'pending',
          createdAt: new Date(),
          metadata: result.data
        });
      }

      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({ error: 'Failed to initialize wallet top-up' });
  }
});

module.exports = router;