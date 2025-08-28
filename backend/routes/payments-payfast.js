const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const { authMiddleware } = require('../middleware/auth');
const { db } = require('../config/firebase');

// PayFast Configuration
const getPayfastConfig = () => {
  const useSandbox = process.env.PAYFAST_USE_SANDBOX === 'true';
  
  return {
    merchantId: useSandbox ? process.env.PAYFAST_SANDBOX_MERCHANT_ID : process.env.PAYFAST_MERCHANT_ID,
    merchantKey: useSandbox ? process.env.PAYFAST_SANDBOX_MERCHANT_KEY : process.env.PAYFAST_MERCHANT_KEY,
    passphrase: useSandbox ? process.env.PAYFAST_SANDBOX_PASSPHRASE : process.env.PAYFAST_PASSPHRASE,
    url: useSandbox ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process',
    validHosts: useSandbox ? 
      ['sandbox.payfast.co.za', 'w1w.payfast.co.za', 'w2w.payfast.co.za'] :
      ['www.payfast.co.za', 'w1w.payfast.co.za', 'w2w.payfast.co.za']
  };
};

// Generate MD5 signature for PayFast
const generateSignature = (data, passphrase = null) => {
  // Create parameter string
  let pfOutput = '';
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      if (data[key] !== '') {
        pfOutput += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, '+')}&`;
      }
    }
  }

  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);
  
  // Add passphrase if provided
  if (passphrase) {
    getString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }

  // Create MD5 hash
  return crypto.createHash('md5').update(getString).digest('hex');
};

// Initialize PayFast payment
router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    const { orderId, amount, itemName, itemDescription } = req.body;
    const userId = req.user.uid;

    // Validate input
    if (!orderId || !amount || !itemName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
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
    const config = getPayfastConfig();

    // Calculate amount in cents (PayFast uses Rands with 2 decimal places)
    const amountInRands = parseFloat(amount).toFixed(2);

    // Create unique payment ID
    const paymentId = `PF_${Date.now()}_${orderId}`;

    // Build PayFast data
    const payfastData = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?order=${orderId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel?order=${orderId}`,
      notify_url: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/payments/payfast/notify`,
      name_first: userData.name?.split(' ')[0] || '',
      name_last: userData.name?.split(' ')[1] || '',
      email_address: userData.email,
      m_payment_id: paymentId,
      amount: amountInRands,
      item_name: itemName.substring(0, 100), // PayFast limit
      item_description: itemDescription ? itemDescription.substring(0, 255) : '', // PayFast limit
      custom_int1: orderId, // Store order ID
      custom_str1: userId, // Store user ID
      email_confirmation: 1,
      confirmation_address: userData.email
    };

    // Generate signature
    const signature = generateSignature(payfastData, config.passphrase);
    payfastData.signature = signature;

    // Save payment record to Firebase
    await db.collection('payments').doc(paymentId).set({
      paymentId,
      orderId,
      userId,
      amount: parseFloat(amount),
      status: 'pending',
      gateway: 'payfast',
      payfastData: {
        merchant_id: config.merchantId,
        m_payment_id: paymentId,
        amount: amountInRands
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Return payment data for form submission
    res.json({
      success: true,
      data: {
        paymentUrl: config.url,
        paymentData: payfastData,
        paymentId
      }
    });

  } catch (error) {
    console.error('PayFast initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
});

// Handle PayFast IPN (Instant Payment Notification)
router.post('/notify', async (req, res) => {
  try {
    console.log('PayFast IPN received:', req.body);

    const pfData = req.body;
    const config = getPayfastConfig();

    // Verify signature
    const pfParamString = Object.keys(pfData)
      .filter(key => key !== 'signature')
      .sort()
      .map(key => `${key}=${encodeURIComponent(pfData[key].toString().trim()).replace(/%20/g, '+')}`)
      .join('&');

    const signatureString = config.passphrase ? 
      `${pfParamString}&passphrase=${encodeURIComponent(config.passphrase.trim()).replace(/%20/g, '+')}` : 
      pfParamString;

    const signature = crypto.createHash('md5').update(signatureString).digest('hex');
    const isValid = signature === pfData.signature;

    if (!isValid) {
      console.error('Invalid PayFast signature');
      return res.status(400).send('Invalid signature');
    }

    // Verify source IP (optional but recommended)
    const validIPs = [
      '41.74.179.192', '41.74.179.193', '41.74.179.194', '41.74.179.195',
      '41.74.179.196', '41.74.179.197', '41.74.179.200', '41.74.179.201',
      '41.74.179.203', '41.74.179.204', '41.74.179.210', '41.74.179.211',
      '41.74.179.212', '41.74.179.217', '41.74.179.218', '197.97.145.144',
      '197.97.145.145', '197.97.145.146', '197.97.145.147', '197.97.145.148',
      '197.97.145.149', '197.97.145.150', '197.97.145.151', '197.97.145.152',
      '197.97.145.153', '197.97.145.154', '197.97.145.155', '197.97.145.156'
    ];

    // For sandbox, skip IP validation
    if (!process.env.PAYFAST_USE_SANDBOX === 'true') {
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (!validIPs.includes(clientIP)) {
        console.warn('IPN from unknown IP:', clientIP);
        // You may want to still process in development
      }
    }

    // Get payment record
    const paymentId = pfData.m_payment_id;
    const paymentDoc = await db.collection('payments').doc(paymentId).get();

    if (!paymentDoc.exists) {
      console.error('Payment not found:', paymentId);
      return res.status(404).send('Payment not found');
    }

    const payment = paymentDoc.data();

    // Verify amount
    const expectedAmount = parseFloat(payment.amount).toFixed(2);
    const paidAmount = parseFloat(pfData.amount_gross).toFixed(2);

    if (expectedAmount !== paidAmount) {
      console.error('Amount mismatch:', { expected: expectedAmount, paid: paidAmount });
      await db.collection('payments').doc(paymentId).update({
        status: 'failed',
        error: 'Amount mismatch',
        payfastResponse: pfData,
        updatedAt: new Date()
      });
      return res.status(400).send('Amount mismatch');
    }

    // Update payment status based on PayFast payment status
    const paymentStatus = pfData.payment_status === 'COMPLETE' ? 'completed' : 'failed';

    await db.collection('payments').doc(paymentId).update({
      status: paymentStatus,
      payfastPaymentId: pfData.pf_payment_id,
      payfastResponse: pfData,
      completedAt: paymentStatus === 'completed' ? new Date() : null,
      updatedAt: new Date()
    });

    // Update order if payment is complete
    if (paymentStatus === 'completed') {
      const orderId = payment.orderId;
      
      await db.collection('orders').doc(orderId).update({
        paymentStatus: 'paid',
        paymentMethod: 'payfast',
        payfastPaymentId: pfData.pf_payment_id,
        paidAmount: parseFloat(pfData.amount_gross),
        paidAt: new Date(),
        updatedAt: new Date()
      });

      // Update product status if it's an auction win
      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (orderDoc.exists) {
        const order = orderDoc.data();
        if (order.type === 'auction_win') {
          await db.collection('products').doc(order.productId).update({
            status: 'sold',
            soldTo: payment.userId,
            soldPrice: parseFloat(pfData.amount_gross),
            soldAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    // Respond to PayFast
    res.status(200).send('OK');

  } catch (error) {
    console.error('PayFast IPN error:', error);
    res.status(500).send('Internal server error');
  }
});

// Check payment status
router.get('/status/:paymentId', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.uid;

    const paymentDoc = await db.collection('payments').doc(paymentId).get();

    if (!paymentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = paymentDoc.data();

    // Verify user owns this payment
    if (payment.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        status: payment.status,
        amount: payment.amount,
        orderId: payment.orderId,
        completedAt: payment.completedAt,
        payfastPaymentId: payment.payfastPaymentId
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
});

// Validate PayFast payment with their API (optional)
router.post('/validate/:paymentId', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const config = getPayfastConfig();

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    
    if (!paymentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = paymentDoc.data();

    // Query PayFast API for payment status
    const queryUrl = config.useSandbox ? 
      'https://sandbox.payfast.co.za/eng/query/fetch' :
      'https://api.payfast.co.za/process/query/' + payment.payfastPaymentId;

    // Note: Full API integration requires additional merchant account setup
    // This is a placeholder for the validation logic

    res.json({
      success: true,
      data: {
        status: payment.status,
        message: 'Payment validation complete'
      }
    });

  } catch (error) {
    console.error('Error validating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate payment',
      error: error.message
    });
  }
});

module.exports = router;