const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

// Process wallet payment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const userId = req.user.uid;

    // Validate input
    if (!orderId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment details'
      });
    }

    // Start a Firestore transaction
    const result = await db.runTransaction(async (transaction) => {
      // Get user document
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const currentBalance = userData.balance || 0;

      // Check if user has sufficient balance
      if (currentBalance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Get order document
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await transaction.get(orderRef);
      
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      
      // Verify order belongs to user
      if (orderData.userId !== userId) {
        throw new Error('Unauthorized access to order');
      }

      // Verify order amount matches
      if (Math.abs(orderData.amount - amount) > 0.01) {
        throw new Error('Amount mismatch');
      }

      // Check if order is already paid
      if (orderData.paymentStatus === 'paid') {
        throw new Error('Order already paid');
      }

      // Create payment record
      const paymentRef = db.collection('payments').doc();
      const paymentId = paymentRef.id;
      
      const paymentData = {
        id: paymentId,
        orderId,
        userId,
        amount,
        method: 'wallet',
        status: 'completed',
        transactionType: 'order_payment',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Create wallet transaction record
      const transactionRef = db.collection('walletTransactions').doc();
      const walletTransaction = {
        id: transactionRef.id,
        userId,
        type: 'debit',
        amount,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance - amount,
        description: `Payment for order #${orderId}`,
        relatedOrderId: orderId,
        relatedPaymentId: paymentId,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Update user balance
      transaction.update(userRef, {
        balance: currentBalance - amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update order status
      transaction.update(orderRef, {
        paymentStatus: 'paid',
        paymentMethod: 'wallet',
        paymentId,
        paidAmount: amount,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create payment record
      transaction.set(paymentRef, paymentData);

      // Create wallet transaction record
      transaction.set(transactionRef, walletTransaction);

      // If it's a product purchase, update product status
      if (orderData.productId) {
        const productRef = db.collection('products').doc(orderData.productId);
        const productDoc = await transaction.get(productRef);
        
        if (productDoc.exists) {
          const productData = productDoc.data();
          
          // Update product status to sold
          if (orderData.type === 'buy_now' || orderData.type === 'auction_win') {
            transaction.update(productRef, {
              status: 'sold',
              soldTo: userId,
              soldPrice: amount,
              soldAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }

          // Transfer funds to seller (minus platform fee)
          if (productData.sellerId && productData.sellerId !== userId) {
            const sellerRef = db.collection('users').doc(productData.sellerId);
            const sellerDoc = await transaction.get(sellerRef);
            
            if (sellerDoc.exists) {
              const sellerData = sellerDoc.data();
              const platformFee = amount * 0.05; // 5% platform fee
              const sellerAmount = amount - platformFee;
              const sellerBalance = sellerData.balance || 0;

              // Update seller balance
              transaction.update(sellerRef, {
                balance: sellerBalance + sellerAmount,
                totalEarnings: (sellerData.totalEarnings || 0) + sellerAmount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });

              // Create seller wallet transaction
              const sellerTransactionRef = db.collection('walletTransactions').doc();
              transaction.set(sellerTransactionRef, {
                id: sellerTransactionRef.id,
                userId: productData.sellerId,
                type: 'credit',
                amount: sellerAmount,
                balanceBefore: sellerBalance,
                balanceAfter: sellerBalance + sellerAmount,
                description: `Payment received for ${productData.title}`,
                relatedOrderId: orderId,
                platformFee,
                status: 'completed',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          }
        }
      }

      return {
        paymentId,
        newBalance: currentBalance - amount
      };
    });

    res.json({
      success: true,
      message: 'Payment successful',
      data: {
        paymentId: result.paymentId,
        newBalance: result.newBalance,
        orderId
      }
    });

  } catch (error) {
    console.error('Wallet payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Payment failed'
    });
  }
});

// Check wallet balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    
    res.json({
      success: true,
      data: {
        balance: userData.balance || 0,
        currency: 'ZAR'
      }
    });

  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance'
    });
  }
});

// Get wallet transaction history
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 20, startAfter } = req.query;

    let query = db.collection('walletTransactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (startAfter) {
      const startDoc = await db.collection('walletTransactions').doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.get();
    const transactions = [];

    snapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

module.exports = router;