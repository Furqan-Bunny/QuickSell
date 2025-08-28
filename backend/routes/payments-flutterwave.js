const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const flutterwaveService = require('../services/flutterwave');
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

// Initialize Flutterwave payment
router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'ZAR',
      redirectUrl,
      cancelUrl,
      customerDetails,
      metadata
    } = req.body;
    const userId = req.user.uid;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Get user details
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Prepare payment data
    const paymentData = {
      amount,
      currency,
      email: customerDetails?.email || userData.email,
      phone: customerDetails?.phoneNumber || userData.phone || '',
      name: customerDetails?.name || userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      description: metadata?.productTitle ? `Payment for ${metadata.productTitle}` : 'Quicksell Purchase',
      orderId: metadata?.orderId,
      productId: metadata?.productId,
      userId
    };

    // Initialize payment with Flutterwave
    const result = await flutterwaveService.initializePayment(paymentData);

    if (result.success) {
      // Save payment record
      const paymentRef = db.collection('payments').doc();
      await paymentRef.set({
        id: paymentRef.id,
        orderId: metadata?.orderId,
        userId,
        amount,
        currency,
        method: 'flutterwave',
        status: 'pending',
        tx_ref: result.data.data.tx_ref,
        paymentLink: result.data.data.link,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        success: true,
        status: 'success',
        data: {
          link: result.data.data.link,
          tx_ref: result.data.data.tx_ref
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Payment initialization failed'
      });
    }

  } catch (error) {
    console.error('Flutterwave initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
});

// Verify Flutterwave payment
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const userId = req.user.uid;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    // Verify payment with Flutterwave
    const result = await flutterwaveService.verifyPayment(transactionId);

    if (result.success) {
      // Update payment record
      const paymentSnapshot = await db.collection('payments')
        .where('tx_ref', '==', result.data.txRef)
        .limit(1)
        .get();

      if (!paymentSnapshot.empty) {
        const paymentDoc = paymentSnapshot.docs[0];
        await paymentDoc.ref.update({
          status: 'completed',
          transactionId: result.data.transactionId,
          paymentType: result.data.paymentType,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Get order and update status
        const payment = paymentDoc.data();
        if (payment.orderId) {
          const orderRef = db.collection('orders').doc(payment.orderId);
          const orderDoc = await orderRef.get();
          
          if (orderDoc.exists) {
            await orderRef.update({
              paymentStatus: 'completed',
              paymentMethod: 'flutterwave',
              flutterwaveTransactionId: result.data.transactionId,
              status: 'processing',
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }

      res.json({
        success: true,
        status: 'success',
        message: 'Payment verified successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        status: 'failed',
        message: result.error || 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Flutterwave verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// Flutterwave webhook handler
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    
    // Validate webhook signature
    if (!flutterwaveService.validateWebhook(signature, req.body)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    
    const { event, data } = req.body;
    console.log('Flutterwave webhook received:', event);
    
    if (event === 'charge.completed' && data.status === 'successful') {
      const { tx_ref, id: transactionId, meta } = data;
      
      // Update payment record
      const paymentSnapshot = await db.collection('payments')
        .where('tx_ref', '==', tx_ref)
        .limit(1)
        .get();

      if (!paymentSnapshot.empty) {
        const paymentDoc = paymentSnapshot.docs[0];
        await paymentDoc.ref.update({
          status: 'completed',
          transactionId,
          webhookProcessedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Get payment data and update order
        const payment = paymentDoc.data();
        if (payment.orderId) {
          const orderRef = db.collection('orders').doc(payment.orderId);
          await orderRef.update({
            paymentStatus: 'completed',
            paymentMethod: 'flutterwave',
            flutterwaveTransactionId: transactionId,
            flutterwaveTxRef: tx_ref,
            status: 'processing',
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`Order ${payment.orderId} payment confirmed via webhook`);
        }
      }
    }
    
    res.status(200).json({ status: 'success' });
    
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;