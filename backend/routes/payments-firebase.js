const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authMiddleware } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { initializePayment, verifyPayment } = require('../services/flutterwave');
const crypto = require('crypto');

const db = admin.firestore();

// Process payment for an order
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const userId = req.user.uid;
    
    // Validate payment method
    const validMethods = ['balance', 'payfast', 'flutterwave'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
    
    // Get order details
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Verify user is the buyer
    if (order.buyerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Check order status
    if (order.status !== 'pending_payment') {
      return res.status(400).json({ error: 'Order already processed or cancelled' });
    }
    
    // Get user details
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();
    
    if (paymentMethod === 'balance') {
      // Process balance payment
      if (user.balance < order.amount) {
        return res.status(400).json({ 
          error: `Insufficient balance. Required: R${order.amount}, Available: R${user.balance}` 
        });
      }
      
      // Use transaction for balance payment
      await db.runTransaction(async (transaction) => {
        // Deduct from buyer's balance
        transaction.update(userDoc.ref, {
          balance: admin.firestore.FieldValue.increment(-order.amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update order status
        transaction.update(orderDoc.ref, {
          status: 'paid',
          paymentStatus: 'completed',
          paymentMethod: 'balance',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update product status to sold
        const productRef = db.collection('products').doc(order.productId);
        transaction.update(productRef, {
          status: 'sold',
          soldTo: userId,
          soldAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create transaction record
        const transactionRef = db.collection('transactions').doc();
        transaction.set(transactionRef, {
          userId,
          orderId,
          type: 'purchase',
          amount: -order.amount,
          status: 'completed',
          description: `Purchase: ${order.productTitle}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update seller's pending balance to available balance
        const sellerRef = db.collection('users').doc(order.sellerId);
        const platformFee = order.amount * 0.1; // 10% platform fee
        const sellerAmount = order.amount - platformFee;
        
        transaction.update(sellerRef, {
          balance: admin.firestore.FieldValue.increment(sellerAmount),
          pendingBalance: admin.firestore.FieldValue.increment(-sellerAmount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create seller transaction record
        const sellerTransactionRef = db.collection('transactions').doc();
        transaction.set(sellerTransactionRef, {
          userId: order.sellerId,
          orderId,
          type: 'sale',
          amount: sellerAmount,
          status: 'completed',
          description: `Sale: ${order.productTitle}`,
          platformFee,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      // Send confirmation emails
      try {
        await emailService.sendPaymentConfirmation(user, order);
        const sellerDoc = await db.collection('users').doc(order.sellerId).get();
        if (sellerDoc.exists) {
          await emailService.sendSaleNotification(sellerDoc.data(), order);
        }
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
      }
      
      return res.json({
        success: true,
        message: 'Payment processed successfully',
        redirectUrl: `/orders/${orderId}`
      });
      
    } else if (paymentMethod === 'payfast') {
      // Generate PayFast payment form data
      const payfastData = {
        merchant_id: process.env.PAYFAST_MERCHANT_ID || '10035072',
        merchant_key: process.env.PAYFAST_MERCHANT_KEY || 'f5w1rn93xkhih',
        return_url: `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?orderId=${orderId}`,
        notify_url: `${process.env.API_URL}/api/payments/payfast/notify`,
        name_first: user.firstName || '',
        name_last: user.lastName || '',
        email_address: user.email,
        m_payment_id: orderId,
        amount: order.amount.toFixed(2),
        item_name: order.productTitle,
        item_description: `Purchase: ${order.productTitle}`,
        custom_str1: userId,
        custom_str2: order.sellerId
      };
      
      // Generate signature
      const dataString = Object.entries(payfastData)
        .filter(([key, value]) => value !== '')
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      const passphrase = process.env.PAYFAST_PASSPHRASE || 'QuicksellTest2024';
      const signature = crypto
        .createHash('md5')
        .update(dataString + '&passphrase=' + encodeURIComponent(passphrase))
        .digest('hex');
      
      payfastData.signature = signature;
      
      // Update order with payment pending
      await orderDoc.ref.update({
        paymentMethod: 'payfast',
        paymentStatus: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.json({
        success: true,
        paymentMethod: 'payfast',
        paymentData: payfastData,
        paymentUrl: process.env.PAYFAST_SANDBOX === 'true' 
          ? 'https://sandbox.payfast.co.za/eng/process'
          : 'https://www.payfast.co.za/eng/process'
      });
      
    } else if (paymentMethod === 'flutterwave') {
      // Initialize Flutterwave payment
      const paymentData = await initializePayment({
        tx_ref: `order_${orderId}_${Date.now()}`,
        amount: order.amount,
        currency: 'ZAR',
        redirect_url: `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`,
        customer: {
          email: user.email,
          phonenumber: user.phone || '',
          name: `${user.firstName} ${user.lastName}`
        },
        customizations: {
          title: 'Quicksell Auction',
          description: `Payment for ${order.productTitle}`,
          logo: `${process.env.FRONTEND_URL}/logo.png`
        },
        meta: {
          orderId,
          userId,
          sellerId: order.sellerId
        }
      });
      
      if (paymentData.status === 'success') {
        // Update order with payment reference
        await orderDoc.ref.update({
          paymentMethod: 'flutterwave',
          paymentStatus: 'processing',
          paymentReference: paymentData.data.tx_ref,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return res.json({
          success: true,
          paymentMethod: 'flutterwave',
          paymentUrl: paymentData.data.link
        });
      } else {
        return res.status(500).json({ error: 'Failed to initialize payment' });
      }
    }
    
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// PayFast payment notification
router.post('/payfast/notify', async (req, res) => {
  try {
    const data = req.body;
    const orderId = data.m_payment_id;
    
    // Verify PayFast signature
    const testingMode = process.env.PAYFAST_SANDBOX === 'true';
    const pfData = { ...data };
    delete pfData.signature;
    
    const dataString = Object.entries(pfData)
      .filter(([key, value]) => value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const passphrase = process.env.PAYFAST_PASSPHRASE || 'QuicksellTest2024';
    const signature = crypto
      .createHash('md5')
      .update(dataString + '&passphrase=' + encodeURIComponent(passphrase))
      .digest('hex');
    
    if (signature !== data.signature && !testingMode) {
      console.error('Invalid PayFast signature');
      return res.status(400).send('Invalid signature');
    }
    
    // Get order
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).send('Order not found');
    }
    
    const order = orderDoc.data();
    
    if (data.payment_status === 'COMPLETE') {
      // Payment successful
      await db.runTransaction(async (transaction) => {
        // Update order
        transaction.update(orderDoc.ref, {
          status: 'paid',
          paymentStatus: 'completed',
          paymentReference: data.pf_payment_id,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update product status
        const productRef = db.collection('products').doc(order.productId);
        transaction.update(productRef, {
          status: 'sold',
          soldTo: order.buyerId,
          soldAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update seller balance
        const sellerRef = db.collection('users').doc(order.sellerId);
        const platformFee = order.amount * 0.1;
        const sellerAmount = order.amount - platformFee;
        
        transaction.update(sellerRef, {
          balance: admin.firestore.FieldValue.increment(sellerAmount),
          pendingBalance: admin.firestore.FieldValue.increment(-sellerAmount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create transaction records
        const buyerTransactionRef = db.collection('transactions').doc();
        transaction.set(buyerTransactionRef, {
          userId: order.buyerId,
          orderId,
          type: 'purchase',
          amount: -order.amount,
          status: 'completed',
          paymentMethod: 'payfast',
          reference: data.pf_payment_id,
          description: `Purchase: ${order.productTitle}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        const sellerTransactionRef = db.collection('transactions').doc();
        transaction.set(sellerTransactionRef, {
          userId: order.sellerId,
          orderId,
          type: 'sale',
          amount: sellerAmount,
          status: 'completed',
          platformFee,
          description: `Sale: ${order.productTitle}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      // Send confirmation emails
      try {
        const buyerDoc = await db.collection('users').doc(order.buyerId).get();
        const sellerDoc = await db.collection('users').doc(order.sellerId).get();
        
        if (buyerDoc.exists) {
          await emailService.sendPaymentConfirmation(buyerDoc.data(), order);
        }
        if (sellerDoc.exists) {
          await emailService.sendSaleNotification(sellerDoc.data(), order);
        }
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
      }
    } else {
      // Payment failed or cancelled
      await orderDoc.ref.update({
        paymentStatus: 'failed',
        paymentError: data.reason || 'Payment failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('PayFast notification error:', error);
    res.status(500).send('Internal error');
  }
});

// Flutterwave payment verification
router.post('/flutterwave/verify', authMiddleware, async (req, res) => {
  try {
    const { transaction_id, orderId } = req.body;
    
    // Verify payment with Flutterwave
    const verification = await verifyPayment(transaction_id);
    
    if (verification.status === 'success' && verification.data.status === 'successful') {
      // Get order
      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      const order = orderDoc.data();
      
      // Process successful payment
      await db.runTransaction(async (transaction) => {
        // Update order
        transaction.update(orderDoc.ref, {
          status: 'paid',
          paymentStatus: 'completed',
          paymentReference: transaction_id,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update product status
        const productRef = db.collection('products').doc(order.productId);
        transaction.update(productRef, {
          status: 'sold',
          soldTo: order.buyerId,
          soldAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update seller balance
        const sellerRef = db.collection('users').doc(order.sellerId);
        const platformFee = order.amount * 0.1;
        const sellerAmount = order.amount - platformFee;
        
        transaction.update(sellerRef, {
          balance: admin.firestore.FieldValue.increment(sellerAmount),
          pendingBalance: admin.firestore.FieldValue.increment(-sellerAmount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create transaction records
        const buyerTransactionRef = db.collection('transactions').doc();
        transaction.set(buyerTransactionRef, {
          userId: order.buyerId,
          orderId,
          type: 'purchase',
          amount: -order.amount,
          status: 'completed',
          paymentMethod: 'flutterwave',
          reference: transaction_id,
          description: `Purchase: ${order.productTitle}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        const sellerTransactionRef = db.collection('transactions').doc();
        transaction.set(sellerTransactionRef, {
          userId: order.sellerId,
          orderId,
          type: 'sale',
          amount: sellerAmount,
          status: 'completed',
          platformFee,
          description: `Sale: ${order.productTitle}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      return res.json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      return res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Flutterwave verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

module.exports = router;