const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const flutterwaveService = require('../services/flutterwave');
const payfastService = require('../services/payfast');
const admin = require('firebase-admin');

const db = admin.firestore();

// Initialize Flutterwave payment
router.post('/flutterwave/initialize', auth, async (req, res) => {
  try {
    const { amount, description, productId } = req.body;
    const user = req.user;

    const paymentData = {
      amount,
      email: user.email,
      name: user.displayName || user.username || user.email,
      phone: user.phone || '',
      description: description || 'Quicksell Payment',
      userId: user.uid,
      productId,
      orderId: `ORDER-${Date.now()}`
    };

    const result = await flutterwaveService.initializePayment(paymentData);
    
    if (result.success) {
      // Store payment intent in Firestore
      await db.collection('paymentIntents').add({
        userId: user.uid,
        transactionRef: result.data.data.tx_ref,
        amount,
        productId,
        status: 'pending',
        paymentMethod: 'flutterwave',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        success: true,
        paymentLink: result.data.data.link,
        transactionRef: result.data.data.tx_ref
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// Verify Flutterwave payment
router.post('/flutterwave/verify/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const result = await flutterwaveService.verifyPayment(transactionId);
    
    if (result.success) {
      // Update payment status in Firestore
      const paymentQuery = await db.collection('paymentIntents')
        .where('transactionRef', '==', result.data.txRef)
        .limit(1)
        .get();
      
      if (!paymentQuery.empty) {
        const paymentDoc = paymentQuery.docs[0];
        await paymentDoc.ref.update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          transactionId: result.data.transactionId
        });

        // Add funds to user wallet
        const userRef = db.collection('users').doc(req.user.uid);
        const userDoc = await userRef.get();
        const currentBalance = userDoc.data().balance || 0;
        
        await userRef.update({
          balance: currentBalance + result.data.amount
        });
      }
      
      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: result.data
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Flutterwave webhook endpoint
router.post('/webhook/flutterwave', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    
    if (!signature || !flutterwaveService.validateWebhook(signature, req.body)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const { event, data } = req.body;
    console.log('Flutterwave webhook event:', event);

    switch(event) {
      case 'charge.completed':
        // Handle successful payment
        if (data.status === 'successful') {
          // Update payment intent
          const paymentQuery = await db.collection('paymentIntents')
            .where('transactionRef', '==', data.tx_ref)
            .limit(1)
            .get();
          
          if (!paymentQuery.empty) {
            const paymentDoc = paymentQuery.docs[0];
            const paymentData = paymentDoc.data();
            
            // Update payment status
            await paymentDoc.ref.update({
              status: 'completed',
              webhookData: data,
              completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // Add funds to user wallet
            const userRef = db.collection('users').doc(paymentData.userId);
            const userDoc = await userRef.get();
            const currentBalance = userDoc.data().balance || 0;
            
            await userRef.update({
              balance: currentBalance + data.amount
            });
            
            // Create transaction record
            await db.collection('transactions').add({
              userId: paymentData.userId,
              type: 'wallet_topup',
              amount: data.amount,
              currency: data.currency,
              reference: data.tx_ref,
              paymentMethod: 'flutterwave',
              status: 'completed',
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Payment successful:', data.tx_ref, data.amount);
          }
        }
        break;
      
      case 'transfer.completed':
        // Handle successful payout to seller
        console.log('Transfer successful:', data);
        break;
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get user payment history
router.get('/history', auth, async (req, res) => {
  try {
    const transactions = await db.collection('transactions')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const history = [];
    transactions.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      });
    });
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Payment routes working',
    flutterwave: {
      configured: !!(process.env.FLUTTERWAVE_PUBLIC_KEY && process.env.FLUTTERWAVE_SECRET_KEY),
      testMode: process.env.FLUTTERWAVE_TEST_MODE === 'true'
    },
    payfast: {
      configured: !!(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY)
    }
  });
});

module.exports = router;