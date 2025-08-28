const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authMiddleware } = require('../middleware/auth');
const flutterwaveService = require('../services/flutterwave');
const crypto = require('crypto');

const db = admin.firestore();

// Verify payment and update order status
router.post('/verify/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, transactionId, paymentReference } = req.body;
    const userId = req.user.uid;
    
    // Get order details
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Verify order belongs to user
    if (order.buyerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Check if already paid
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ error: 'Order already paid' });
    }
    
    let paymentVerified = false;
    let paymentDetails = {};
    
    // Verify payment based on method
    switch (paymentMethod) {
      case 'wallet':
        // Wallet payments are already verified in payments-wallet.js
        // Just check if payment record exists
        const walletPaymentSnapshot = await db.collection('payments')
          .where('orderId', '==', orderId)
          .where('method', '==', 'wallet')
          .where('status', '==', 'completed')
          .limit(1)
          .get();
        
        if (!walletPaymentSnapshot.empty) {
          paymentVerified = true;
          paymentDetails = walletPaymentSnapshot.docs[0].data();
        }
        break;
        
      case 'flutterwave':
        // Verify with Flutterwave
        if (!transactionId) {
          return res.status(400).json({ error: 'Transaction ID required for Flutterwave verification' });
        }
        
        const flwVerification = await flutterwaveService.verifyPayment(transactionId);
        
        if (flwVerification.success) {
          paymentVerified = true;
          paymentDetails = {
            transactionId: flwVerification.data.transactionId,
            amount: flwVerification.data.amount,
            currency: flwVerification.data.currency,
            paymentType: flwVerification.data.paymentType
          };
        }
        break;
        
      case 'payfast':
        // Verify with PayFast
        if (!paymentReference) {
          return res.status(400).json({ error: 'Payment reference required for PayFast verification' });
        }
        
        // Check if PayFast IPN has already confirmed the payment
        const payfastPaymentSnapshot = await db.collection('payments')
          .where('orderId', '==', orderId)
          .where('method', '==', 'payfast')
          .where('paymentId', '==', paymentReference)
          .limit(1)
          .get();
        
        if (!payfastPaymentSnapshot.empty) {
          const payfastPayment = payfastPaymentSnapshot.docs[0].data();
          if (payfastPayment.status === 'COMPLETE') {
            paymentVerified = true;
            paymentDetails = payfastPayment;
          }
        }
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid payment method' });
    }
    
    if (!paymentVerified) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }
    
    // Update order and product status in a transaction
    const result = await db.runTransaction(async (transaction) => {
      // Update order status
      transaction.update(orderDoc.ref, {
        paymentStatus: 'completed',
        paymentMethod,
        paymentDetails,
        status: 'processing',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Get product
      const productRef = db.collection('products').doc(order.productId);
      const productDoc = await transaction.get(productRef);
      
      if (productDoc.exists) {
        const product = productDoc.data();
        
        // Update product status to sold
        transaction.update(productRef, {
          status: 'sold',
          soldTo: userId,
          soldPrice: order.amount,
          soldAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // If it's not a wallet payment, transfer funds to seller
        // (Wallet payments already handle this in the payment transaction)
        if (paymentMethod !== 'wallet' && product.sellerId) {
          const sellerRef = db.collection('users').doc(product.sellerId);
          const sellerDoc = await transaction.get(sellerRef);
          
          if (sellerDoc.exists) {
            const seller = sellerDoc.data();
            const platformFee = order.amount * 0.05; // 5% platform fee
            const sellerAmount = order.amount - platformFee;
            
            // Update seller's pending balance (not actual balance until withdrawal)
            transaction.update(sellerRef, {
              pendingBalance: admin.firestore.FieldValue.increment(sellerAmount),
              totalSales: admin.firestore.FieldValue.increment(1),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // Create transaction record for seller
            const sellerTransactionRef = db.collection('transactions').doc();
            transaction.set(sellerTransactionRef, {
              id: sellerTransactionRef.id,
              userId: product.sellerId,
              type: 'sale',
              amount: sellerAmount,
              grossAmount: order.amount,
              platformFee,
              description: `Sale of ${product.title}`,
              orderId,
              status: 'pending',
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }
      
      // Create payment record if not wallet (wallet creates its own)
      if (paymentMethod !== 'wallet') {
        const paymentRef = db.collection('payments').doc();
        transaction.set(paymentRef, {
          id: paymentRef.id,
          orderId,
          userId,
          amount: order.amount,
          method: paymentMethod,
          status: 'completed',
          paymentDetails,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Send notification to seller
      if (order.sellerId) {
        const notificationRef = db.collection('notifications').doc();
        transaction.set(notificationRef, {
          id: notificationRef.id,
          userId: order.sellerId,
          type: 'sale',
          title: 'New Sale!',
          message: `Your item "${order.productTitle}" has been sold for R${order.amount}`,
          orderId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return { success: true };
    });
    
    res.json({
      success: true,
      message: 'Payment verified and order updated successfully',
      data: {
        orderId,
        status: 'processing',
        paymentStatus: 'completed'
      }
    });
    
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Get payment status for an order
router.get('/status/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.uid;
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Verify access
    if (order.buyerId !== userId && order.sellerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    res.json({
      success: true,
      data: {
        orderId,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        status: order.status,
        amount: order.amount
      }
    });
    
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// Flutterwave webhook handler
router.post('/webhook/flutterwave', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    
    // Validate webhook signature
    if (!flutterwaveService.validateWebhook(signature, req.body)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    
    const { event, data } = req.body;
    
    if (event === 'charge.completed' && data.status === 'successful') {
      const { tx_ref, id: transactionId, meta } = data;
      
      if (meta && meta.orderId) {
        // Update order payment status
        const orderRef = db.collection('orders').doc(meta.orderId);
        const orderDoc = await orderRef.get();
        
        if (orderDoc.exists) {
          await orderRef.update({
            paymentStatus: 'completed',
            paymentMethod: 'flutterwave',
            flutterwaveTransactionId: transactionId,
            flutterwaveTxRef: tx_ref,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }
    
    res.status(200).json({ status: 'success' });
    
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// PayFast IPN handler (already exists in payments-payfast.js)
// This is just a reference for completeness

module.exports = router;