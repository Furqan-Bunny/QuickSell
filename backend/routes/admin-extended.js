const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authMiddleware } = require('../middleware/auth');

const db = admin.firestore();

// Admin middleware - check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    if (userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// ==================== PAYMENT MANAGEMENT APIs ====================

// Get all payment transactions
router.get('/payments/transactions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, gateway, startDate, endDate, limit = 50 } = req.query;
    
    let query = db.collection('payment_transactions');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    if (gateway) {
      query = query.where('gateway', '==', gateway);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();
    
    const transactions = [];
    for (const doc of snapshot.docs) {
      const transaction = { id: doc.id, ...doc.data() };
      
      // Get user details
      if (transaction.userId) {
        const userDoc = await db.collection('users').doc(transaction.userId).get();
        if (userDoc.exists) {
          transaction.user = {
            id: userDoc.id,
            name: `${userDoc.data().firstName} ${userDoc.data().lastName}`,
            email: userDoc.data().email
          };
        }
      }
      
      // Get order details
      if (transaction.orderId) {
        const orderDoc = await db.collection('orders').doc(transaction.orderId).get();
        if (orderDoc.exists) {
          transaction.order = {
            id: orderDoc.id,
            productTitle: orderDoc.data().productTitle,
            status: orderDoc.data().status
          };
        }
      }
      
      transactions.push(transaction);
    }
    
    // Calculate statistics
    const stats = {
      totalTransactions: transactions.length,
      successfulTransactions: transactions.filter(t => t.status === 'completed').length,
      failedTransactions: transactions.filter(t => t.status === 'failed').length,
      totalAmount: transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      totalFees: transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.fee || 0), 0)
    };
    
    res.json({
      success: true,
      data: transactions,
      stats
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get seller payouts
router.get('/payments/payouts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, sellerId, limit = 50 } = req.query;
    
    let query = db.collection('payouts');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    if (sellerId) {
      query = query.where('sellerId', '==', sellerId);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();
    
    const payouts = [];
    for (const doc of snapshot.docs) {
      const payout = { id: doc.id, ...doc.data() };
      
      // Get seller details
      if (payout.sellerId) {
        const sellerDoc = await db.collection('users').doc(payout.sellerId).get();
        if (sellerDoc.exists) {
          payout.seller = {
            id: sellerDoc.id,
            name: `${sellerDoc.data().firstName} ${sellerDoc.data().lastName}`,
            email: sellerDoc.data().email,
            bankDetails: sellerDoc.data().bankDetails
          };
        }
      }
      
      payouts.push(payout);
    }
    
    const stats = {
      totalPayouts: payouts.length,
      pendingPayouts: payouts.filter(p => p.status === 'pending').length,
      completedPayouts: payouts.filter(p => p.status === 'completed').length,
      totalAmount: payouts
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0)
    };
    
    res.json({
      success: true,
      data: payouts,
      stats
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Process seller payout
router.post('/payments/process-payout', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { sellerId, amount, method, reference, notes } = req.body;
    
    if (!sellerId || !amount || !method) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get seller details
    const sellerDoc = await db.collection('users').doc(sellerId).get();
    if (!sellerDoc.exists) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    const seller = sellerDoc.data();
    
    // Create payout record
    const payoutData = {
      sellerId,
      sellerName: `${seller.firstName} ${seller.lastName}`,
      amount,
      method,
      reference: reference || '',
      notes: notes || '',
      status: 'processing',
      processedBy: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const payoutRef = await db.collection('payouts').add(payoutData);
    
    // Update seller balance
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(sellerId);
      const userDoc = await transaction.get(userRef);
      const currentBalance = userDoc.data().balance || 0;
      
      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }
      
      transaction.update(userRef, {
        balance: admin.firestore.FieldValue.increment(-amount),
        totalPayouts: admin.firestore.FieldValue.increment(amount),
        lastPayoutAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update payout status
      transaction.update(payoutRef, {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    res.json({
      success: true,
      message: 'Payout processed successfully',
      data: { id: payoutRef.id, ...payoutData }
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({ error: error.message || 'Failed to process payout' });
  }
});

// Get payment analytics
router.get('/payments/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    // Get orders within date range
    const ordersSnapshot = await db.collection('orders')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Calculate daily revenue
    const dailyRevenue = {};
    orders.forEach(order => {
      if (order.paymentStatus === 'completed' && order.createdAt) {
        const date = new Date(order.createdAt._seconds * 1000).toISOString().split('T')[0];
        dailyRevenue[date] = (dailyRevenue[date] || 0) + (order.amount || 0);
      }
    });
    
    // Get payment methods distribution
    const paymentMethods = {};
    orders.forEach(order => {
      if (order.paymentMethod) {
        paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + 1;
      }
    });
    
    // Calculate statistics
    const stats = {
      totalRevenue: orders
        .filter(o => o.paymentStatus === 'completed')
        .reduce((sum, o) => sum + (o.amount || 0), 0),
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ? 
        orders.reduce((sum, o) => sum + (o.amount || 0), 0) / orders.length : 0,
      platformFees: orders
        .filter(o => o.paymentStatus === 'completed')
        .reduce((sum, o) => sum + ((o.amount || 0) * 0.1), 0), // 10% platform fee
      successRate: orders.length > 0 ?
        (orders.filter(o => o.paymentStatus === 'completed').length / orders.length) * 100 : 0
    };
    
    res.json({
      success: true,
      data: {
        dailyRevenue,
        paymentMethods,
        stats,
        period
      }
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ==================== NOTIFICATION SYSTEM APIs ====================

// Send notification to users
router.post('/notifications/send', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, message, type = 'info', audience = 'all', userIds = [] } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    
    let targetUsers = [];
    
    // Determine target users based on audience
    if (audience === 'all') {
      const usersSnapshot = await db.collection('users').get();
      targetUsers = usersSnapshot.docs.map(doc => doc.id);
    } else if (audience === 'sellers') {
      const sellersSnapshot = await db.collection('users')
        .where('role', '==', 'seller')
        .get();
      targetUsers = sellersSnapshot.docs.map(doc => doc.id);
    } else if (audience === 'buyers') {
      const buyersSnapshot = await db.collection('users')
        .where('role', '==', 'user')
        .get();
      targetUsers = buyersSnapshot.docs.map(doc => doc.id);
    } else if (audience === 'specific' && userIds.length > 0) {
      targetUsers = userIds;
    }
    
    // Create notifications for each user
    const batch = db.batch();
    const notifications = [];
    
    for (const userId of targetUsers) {
      const notificationRef = db.collection('notifications').doc();
      const notificationData = {
        title,
        message,
        type,
        userId,
        read: false,
        createdBy: req.user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      batch.set(notificationRef, notificationData);
      notifications.push({ id: notificationRef.id, ...notificationData });
    }
    
    await batch.commit();
    
    res.json({
      success: true,
      message: `Notification sent to ${targetUsers.length} users`,
      data: {
        totalSent: targetUsers.length,
        audience,
        title,
        message
      }
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Get notification history
router.get('/notifications/history', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const snapshot = await db.collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();
    
    const notifications = [];
    const uniqueNotifications = new Map();
    
    // Group notifications by title and message
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const key = `${data.title}-${data.message}`;
      
      if (!uniqueNotifications.has(key)) {
        uniqueNotifications.set(key, {
          title: data.title,
          message: data.message,
          type: data.type,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          recipientCount: 1,
          readCount: data.read ? 1 : 0
        });
      } else {
        const existing = uniqueNotifications.get(key);
        existing.recipientCount++;
        if (data.read) existing.readCount++;
      }
    }
    
    // Convert to array and add admin details
    for (const [key, notification] of uniqueNotifications) {
      if (notification.createdBy) {
        const adminDoc = await db.collection('users').doc(notification.createdBy).get();
        if (adminDoc.exists) {
          notification.admin = {
            id: adminDoc.id,
            name: `${adminDoc.data().firstName} ${adminDoc.data().lastName}`,
            email: adminDoc.data().email
          };
        }
      }
      notifications.push(notification);
    }
    
    res.json({
      success: true,
      data: notifications,
      stats: {
        totalSent: snapshot.size,
        uniqueMessages: notifications.length
      }
    });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

// Get notification templates
router.get('/notifications/templates', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('notification_templates')
      .orderBy('createdAt', 'desc')
      .get();
    
    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create notification template
router.post('/notifications/templates', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, type, subject, body, variables = [] } = req.body;
    
    if (!name || !type || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const templateData = {
      name,
      type,
      subject,
      body,
      variables,
      createdBy: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const templateRef = await db.collection('notification_templates').add(templateData);
    
    res.json({
      success: true,
      message: 'Template created successfully',
      data: { id: templateRef.id, ...templateData }
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update notification template
router.put('/notifications/templates/:templateId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, type, subject, body, variables } = req.body;
    
    const templateRef = db.collection('notification_templates').doc(templateId);
    const templateDoc = await templateRef.get();
    
    if (!templateDoc.exists) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (subject !== undefined) updateData.subject = subject;
    if (body !== undefined) updateData.body = body;
    if (variables !== undefined) updateData.variables = variables;
    
    await templateRef.update(updateData);
    
    res.json({
      success: true,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete notification template
router.delete('/notifications/templates/:templateId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    
    await db.collection('notification_templates').doc(templateId).delete();
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Get notification statistics
router.get('/notifications/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }
    
    const snapshot = await db.collection('notifications')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();
    
    const notifications = snapshot.docs.map(doc => doc.data());
    
    // Calculate statistics
    const stats = {
      totalSent: notifications.length,
      totalRead: notifications.filter(n => n.read).length,
      readRate: notifications.length > 0 ?
        (notifications.filter(n => n.read).length / notifications.length) * 100 : 0,
      byType: {
        info: notifications.filter(n => n.type === 'info').length,
        success: notifications.filter(n => n.type === 'success').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        error: notifications.filter(n => n.type === 'error').length
      },
      dailyCount: {}
    };
    
    // Calculate daily counts
    notifications.forEach(notification => {
      if (notification.createdAt) {
        const date = new Date(notification.createdAt._seconds * 1000).toISOString().split('T')[0];
        stats.dailyCount[date] = (stats.dailyCount[date] || 0) + 1;
      }
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ==================== ENHANCED ORDER MANAGEMENT ====================

// Update order status with validation
router.put('/orders/:orderId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, notes } = req.body;
    
    const validStatuses = ['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid
    };
    
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes) updateData.adminNotes = notes;
    
    // Add status history
    const statusHistory = orderDoc.data().statusHistory || [];
    statusHistory.push({
      status,
      changedAt: admin.firestore.FieldValue.serverTimestamp(),
      changedBy: req.user.uid,
      notes
    });
    updateData.statusHistory = statusHistory;
    
    // Update delivery date if delivered
    if (status === 'delivered') {
      updateData.deliveredAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    await orderRef.update(updateData);
    
    // Send notification to buyer
    const order = orderDoc.data();
    if (order.buyerId) {
      await db.collection('notifications').add({
        userId: order.buyerId,
        title: 'Order Update',
        message: `Your order #${orderId.slice(-6)} status changed to ${status}`,
        type: 'info',
        read: false,
        orderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Get order analytics
router.get('/orders/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders').get();
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Calculate statistics
    const stats = {
      totalOrders: orders.length,
      byStatus: {
        pending: orders.filter(o => o.status === 'pending_payment').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      },
      totalRevenue: orders
        .filter(o => o.paymentStatus === 'completed')
        .reduce((sum, o) => sum + (o.amount || 0), 0),
      averageOrderValue: orders.length > 0 ?
        orders.reduce((sum, o) => sum + (o.amount || 0), 0) / orders.length : 0,
      topProducts: {},
      topBuyers: {}
    };
    
    // Calculate top products
    orders.forEach(order => {
      if (order.productTitle) {
        stats.topProducts[order.productTitle] = (stats.topProducts[order.productTitle] || 0) + 1;
      }
      if (order.buyerId) {
        stats.topBuyers[order.buyerId] = (stats.topBuyers[order.buyerId] || 0) + 1;
      }
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;