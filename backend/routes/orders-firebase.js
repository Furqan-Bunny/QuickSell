const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authMiddleware } = require('../middleware/auth');
const { initializePayment, verifyPayment } = require('../services/flutterwave');

const db = admin.firestore();

// Create order after auction win or buy now
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, type, amount, shippingInfo, paymentMethod } = req.body;
    const buyerId = req.user.uid;
    
    // Validate input
    if (!productId || !type || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get product details
    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productDoc.data();
    
    // Log product details for debugging
    console.log('Product details:', {
      id: productId,
      status: product.status,
      buyNowPrice: product.buyNowPrice,
      currentPrice: product.currentPrice,
      title: product.title
    });
    
    // Verify product is available for purchase
    if (type === 'buy_now') {
      // Only block if product is explicitly sold or ended
      const blockedStatuses = ['sold', 'ended', 'cancelled', 'deleted'];
      if (product.status && blockedStatuses.includes(product.status)) {
        console.log('Product status check failed:', product.status);
        return res.status(400).json({ 
          error: 'Product is no longer available',
          debug: `Product status: ${product.status}, Cannot purchase if: ${blockedStatuses.join(', ')}`
        });
      }
      if (!product.buyNowPrice && !product.currentPrice) {
        return res.status(400).json({ error: 'Buy Now not available for this product' });
      }
      // Check amount matches either buyNowPrice or currentPrice
      const expectedPrice = product.buyNowPrice || product.currentPrice;
      if (Math.abs(amount - expectedPrice) > 0.01) {
        return res.status(400).json({ error: `Invalid purchase amount. Expected: ${expectedPrice}, Got: ${amount}` });
      }
    } else if (type === 'auction_win') {
      if (product.status !== 'ended') {
        return res.status(400).json({ error: 'Auction has not ended yet' });
      }
      if (product.winnerId !== buyerId) {
        return res.status(403).json({ error: 'You are not the auction winner' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid order type' });
    }
    
    // Get buyer details
    const buyerDoc = await db.collection('users').doc(buyerId).get();
    const buyer = buyerDoc.data();
    
    // Get seller details
    const sellerDoc = await db.collection('users').doc(product.sellerId).get();
    const seller = sellerDoc.data();
    
    // Create order
    const orderData = {
      productId,
      productTitle: product.title,
      productImage: product.images?.[0] || '',
      buyerId,
      buyerName: shippingInfo?.fullName || `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || buyer.name || 'Unknown',
      buyerEmail: shippingInfo?.email || buyer.email,
      sellerId: product.sellerId,
      sellerName: seller ? (`${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.name || 'Unknown') : 'Unknown',
      type, // 'buy_now' or 'auction_win'
      amount,
      status: 'pending_payment',
      paymentStatus: 'pending',
      paymentMethod: paymentMethod || 'pending',
      shippingInfo: shippingInfo || {
        fullName: buyer.name || `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim(),
        email: buyer.email,
        phone: buyer.phone || '',
        address: buyer.address || '',
        city: buyer.city || '',
        province: buyer.province || '',
        postalCode: buyer.postalCode || '',
        country: buyer.country || 'South Africa'
      },
      shippingAddress: buyer.address || {}, // Keep for backward compatibility
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Use transaction to ensure consistency
    const result = await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('orders').doc();
      
      // Create order
      transaction.set(orderRef, orderData);
      
      // Don't update product status to 'sold' immediately - wait for payment confirmation
      // This prevents blocking subsequent purchase attempts if payment fails
      if (type === 'buy_now' && false) { // Disabled for now
        transaction.update(productDoc.ref, {
          status: 'sold',
          soldTo: buyerId,
          soldAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Update seller's pending balance
      if (seller) {
        transaction.update(sellerDoc.ref, {
          pendingBalance: admin.firestore.FieldValue.increment(amount * 0.9), // 10% platform fee
          totalSales: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return { id: orderRef.id, orderId: orderRef.id, ...orderData };
    });
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: result.id,
        orderId: result.orderId,
        ...result
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user's orders
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status, type } = req.query;
    
    let query = db.collection('orders')
      .where('buyerId', '==', userId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (type) {
      query = query.where('type', '==', type);
    }
    
    const ordersSnapshot = await query
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get seller's orders
router.get('/my-sales', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status } = req.query;
    
    let query = db.collection('orders')
      .where('sellerId', '==', userId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const ordersSnapshot = await query
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Get single order details
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.uid;
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Check if user is buyer or seller
    if (order.buyerId !== userId && order.sellerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      success: true,
      data: { id: orderDoc.id, ...order }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (for sellers)
router.put('/:orderId/status', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const userId = req.user.uid;
    
    // Validate status
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Check if user is the seller
    if (order.sellerId !== userId) {
      return res.status(403).json({ error: 'Only seller can update order status' });
    }
    
    // Update order
    await orderDoc.ref.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If delivered, update seller's balance
    if (status === 'delivered' && order.paymentStatus === 'completed') {
      const sellerDoc = await db.collection('users').doc(order.sellerId).get();
      
      await sellerDoc.ref.update({
        balance: admin.firestore.FieldValue.increment(order.amount * 0.9), // 10% platform fee
        pendingBalance: admin.firestore.FieldValue.increment(-order.amount * 0.9),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Process payment for order
router.post('/:orderId/pay', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.uid;
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Check if user is buyer
    if (order.buyerId !== userId) {
      return res.status(403).json({ error: 'Only buyer can pay for order' });
    }
    
    // Check if already paid
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ error: 'Order already paid' });
    }
    
    // Get user details
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();
    
    // Initialize payment with Flutterwave
    const paymentData = await initializePayment({
      amount: order.amount,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone || '',
      reference: `order_${orderId}_${Date.now()}`,
      description: `Payment for order #${orderId}`,
      metadata: {
        orderId,
        userId,
        productId: order.productId
      }
    });
    
    // Update order with payment reference
    await orderDoc.ref.update({
      paymentReference: paymentData.tx_ref,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      data: {
        paymentUrl: paymentData.link,
        reference: paymentData.tx_ref
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Verify payment and update order
router.post('/:orderId/verify-payment', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reference } = req.body;
    
    if (!reference) {
      return res.status(400).json({ error: 'Payment reference required' });
    }
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Verify payment with Flutterwave
    const paymentStatus = await verifyPayment(reference);
    
    if (paymentStatus.status === 'successful') {
      // Update order
      await orderDoc.ref.update({
        paymentStatus: 'completed',
        status: 'processing',
        paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update buyer's total spent
      const buyerDoc = await db.collection('users').doc(order.buyerId).get();
      await buyerDoc.ref.update({
        totalSpent: admin.firestore.FieldValue.increment(order.amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Get all orders (admin only)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status, paymentStatus, limit = 50, startAfter } = req.query;
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    let query = db.collection('orders');
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      query = query.where('paymentStatus', '==', paymentStatus);
    }
    
    // Order by creation date
    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));
    
    // Pagination
    if (startAfter) {
      const startDoc = await db.collection('orders').doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }
    
    const ordersSnapshot = await query.get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get order statistics
    const statsSnapshot = await db.collection('orders').get();
    const allOrders = statsSnapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending_payment').length,
      processing: allOrders.filter(o => o.status === 'processing').length,
      shipped: allOrders.filter(o => o.status === 'shipped').length,
      delivered: allOrders.filter(o => o.status === 'delivered').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length,
      totalRevenue: allOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
      totalCommission: allOrders.reduce((sum, o) => sum + ((o.amount || 0) * 0.05), 0) // 5% commission
    };
    
    res.json({
      success: true,
      data: orders,
      stats,
      hasMore: orders.length === parseInt(limit)
    });
    
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders' 
    });
  }
});

// Update order details (admin only)
router.put('/admin/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.uid;
    const { 
      status, 
      trackingNumber, 
      shippingCarrier, 
      notes,
      expectedDelivery 
    } = req.body;
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Get the order
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    const order = orderDoc.data();
    
    // Build update object
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId
    };
    
    if (status !== undefined) {
      updateData.status = status;
      
      // Send notification to buyer
      const notificationRef = db.collection('notifications').doc();
      await notificationRef.set({
        id: notificationRef.id,
        userId: order.buyerId,
        type: 'order_update',
        title: 'Order Status Updated',
        message: `Your order #${orderId.slice(-8)} status changed to ${status}`,
        orderId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (shippingCarrier !== undefined) updateData.shippingCarrier = shippingCarrier;
    if (notes !== undefined) updateData.notes = notes;
    if (expectedDelivery !== undefined) {
      updateData.expectedDelivery = admin.firestore.Timestamp.fromDate(new Date(expectedDelivery));
    }
    
    // Update the order
    await db.collection('orders').doc(orderId).update(updateData);
    
    res.json({
      success: true,
      message: 'Order updated successfully',
      data: {
        id: orderId,
        ...updateData
      }
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }
});

// Cancel order (PUT endpoint for frontend compatibility)
router.put('/:orderId/cancel', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.uid;
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Check if user is buyer or admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (order.buyerId !== userId && userData?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if order can be cancelled
    if (order.status === 'shipped' || order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot cancel this order' });
    }
    
    // Update order status
    await orderDoc.ref.update({
      status: 'cancelled',
      cancelledBy: userId,
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancellationReason: req.body.reason || 'Cancelled by user',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If product was marked as sold, revert it
    if (order.type === 'buy_now') {
      const productDoc = await db.collection('products').doc(order.productId).get();
      if (productDoc.exists && productDoc.data().status === 'sold') {
        await productDoc.ref.update({
          status: 'active',
          soldTo: null,
          soldAt: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      error: 'Failed to cancel order',
      details: error.message
    });
  }
});

// Cancel order (DELETE endpoint - kept for backward compatibility)
router.delete('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.uid;
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Check if user is buyer or seller
    if (order.buyerId !== userId && order.sellerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if order can be cancelled
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ error: 'Cannot cancel shipped or delivered orders' });
    }
    
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel paid orders. Please request a refund.' });
    }
    
    // Update order status
    await orderDoc.ref.update({
      status: 'cancelled',
      cancelledBy: userId,
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If product was marked as sold, revert it
    if (order.type === 'buy_now') {
      const productDoc = await db.collection('products').doc(order.productId).get();
      if (productDoc.exists && productDoc.data().status === 'sold') {
        await productDoc.ref.update({
          status: 'active',
          soldTo: null,
          soldAt: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;