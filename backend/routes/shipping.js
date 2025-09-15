const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const sapoShipping = require('../services/sapoShippingService');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Generate tracking number for an order
 * POST /api/shipping/generate-tracking
 */
router.post('/generate-tracking', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get order details
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = { id: orderDoc.id, ...orderDoc.data() };

    // Check if user is authorized (seller or admin)
    if (req.user.role !== 'admin' && order.sellerId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized to generate tracking for this order' });
    }

    // Generate tracking number
    const result = await sapoShipping.generateTrackingNumber(orderId);

    // Update order with tracking number
    await db.collection('orders').doc(orderId).update({
      trackingNumber: result.trackingNumber,
      shippingStatus: 'tracking_generated',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating tracking number:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create shipment for an order
 * POST /api/shipping/create-shipment
 */
router.post('/create-shipment', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get order details
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = { id: orderDoc.id, ...orderDoc.data() };

    // Check if user is authorized (seller or admin)
    if (req.user.role !== 'admin' && order.sellerId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized to create shipment for this order' });
    }

    // Check if shipment already exists
    const existingShipment = await db.collection('shipments').doc(orderId).get();
    if (existingShipment.exists) {
      return res.status(400).json({ error: 'Shipment already exists for this order' });
    }

    // Get seller details
    let seller = {};
    if (order.sellerId) {
      const sellerDoc = await db.collection('users').doc(order.sellerId).get();
      if (sellerDoc.exists) {
        seller = sellerDoc.data();
      }
    }

    // Prepare order data with seller info
    const orderWithSeller = {
      ...order,
      seller: {
        name: seller.businessName || `${seller.firstName} ${seller.lastName}`,
        address: seller.address || '123 Seller Street',
        city: seller.city || 'Johannesburg',
        postalCode: seller.postalCode || '2000',
        phone: seller.phone || '0123456789',
        email: seller.email
      }
    };

    // Create shipment
    const result = await sapoShipping.createShipmentForOrder(orderWithSeller);

    // Update order status
    await db.collection('orders').doc(orderId).update({
      trackingNumber: result.trackingNumber,
      shippingStatus: 'shipped',
      shippedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track shipment(s)
 * GET /api/shipping/track/:trackingNumber
 */
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }

    // Track with SAPO
    const result = await sapoShipping.trackItems(trackingNumber);

    // Update local tracking cache
    if (result.items && result.items.length > 0) {
      const trackingData = result.items[0];
      
      // Find associated order
      const orderQuery = await db.collection('orders')
        .where('trackingNumber', '==', trackingNumber)
        .limit(1)
        .get();
      
      if (!orderQuery.empty) {
        const orderId = orderQuery.docs[0].id;
        
        // Update shipment tracking data
        await db.collection('shipments').doc(orderId).update({
          lastTracked: admin.firestore.FieldValue.serverTimestamp(),
          currentStatus: trackingData.currentStatus,
          events: trackingData.events,
          lastUpdate: trackingData.lastUpdate
        });
      }
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track multiple shipments
 * POST /api/shipping/track-multiple
 */
router.post('/track-multiple', async (req, res) => {
  try {
    const { trackingNumbers } = req.body;
    
    if (!trackingNumbers || !Array.isArray(trackingNumbers)) {
      return res.status(400).json({ error: 'Tracking numbers array is required' });
    }

    const result = await sapoShipping.trackItems(trackingNumbers);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error tracking shipments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update shipment event
 * POST /api/shipping/update-event
 */
router.post('/update-event', authMiddleware, async (req, res) => {
  try {
    const { trackingNumber, eventCode, additionalData } = req.body;
    
    if (!trackingNumber || !eventCode) {
      return res.status(400).json({ error: 'Tracking number and event code are required' });
    }

    // Check authorization
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update shipment events' });
    }

    const result = await sapoShipping.updateMailItemEvent(trackingNumber, eventCode, additionalData);

    // Update local shipment record
    const shipmentQuery = await db.collection('shipments')
      .where('trackingNumber', '==', trackingNumber)
      .limit(1)
      .get();
    
    if (!shipmentQuery.empty) {
      const shipmentId = shipmentQuery.docs[0].id;
      const shipmentDoc = shipmentQuery.docs[0].data();
      
      const newEvent = {
        code: eventCode,
        status: sapoShipping.mapEventCodeToStatus(eventCode),
        timestamp: new Date().toISOString(),
        data: additionalData
      };
      
      await db.collection('shipments').doc(shipmentId).update({
        events: admin.firestore.FieldValue.arrayUnion(newEvent),
        currentStatus: newEvent.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating shipment event:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel shipment
 * POST /api/shipping/cancel
 */
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const { trackingNumber, reason } = req.body;
    
    if (!trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }

    // Find associated order
    const orderQuery = await db.collection('orders')
      .where('trackingNumber', '==', trackingNumber)
      .limit(1)
      .get();
    
    if (orderQuery.empty) {
      return res.status(404).json({ error: 'Order not found for this tracking number' });
    }

    const order = orderQuery.docs[0].data();
    const orderId = orderQuery.docs[0].id;

    // Check authorization
    if (req.user.role !== 'admin' && order.sellerId !== req.user.uid && order.buyerId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized to cancel this shipment' });
    }

    // Cancel with SAPO
    const result = await sapoShipping.cancelShipment(trackingNumber, reason);

    // Update order and shipment status
    await db.collection('orders').doc(orderId).update({
      shippingStatus: 'cancelled',
      shippingCancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      shippingCancelReason: reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('shipments').doc(orderId).update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelReason: reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Shipment cancelled successfully',
      data: result
    });
  } catch (error) {
    console.error('Error cancelling shipment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark shipment as delivered
 * POST /api/shipping/mark-delivered
 */
router.post('/mark-delivered', authMiddleware, async (req, res) => {
  try {
    const { trackingNumber, signature } = req.body;
    
    if (!trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }

    // Check authorization (admin only)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can mark shipments as delivered' });
    }

    // Mark as delivered with SAPO
    const result = await sapoShipping.markAsDelivered(trackingNumber, signature);

    // Find and update associated order
    const orderQuery = await db.collection('orders')
      .where('trackingNumber', '==', trackingNumber)
      .limit(1)
      .get();
    
    if (!orderQuery.empty) {
      const orderId = orderQuery.docs[0].id;
      
      // Update order status
      await db.collection('orders').doc(orderId).update({
        status: 'delivered',
        shippingStatus: 'delivered',
        deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
        deliverySignature: signature,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update shipment status
      await db.collection('shipments').doc(orderId).update({
        status: 'delivered',
        deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
        signature: signature,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({
      success: true,
      message: 'Shipment marked as delivered',
      data: result
    });
  } catch (error) {
    console.error('Error marking shipment as delivered:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get shipping rates
 * POST /api/shipping/calculate-rate
 */
router.post('/calculate-rate', async (req, res) => {
  try {
    const { weight, destination, express } = req.body;
    
    // Basic rate calculation (can be enhanced with SAPO rate API if available)
    let baseRate = 50; // Base rate in ZAR
    
    // Weight-based pricing (per kg)
    const weightRate = Math.ceil(weight || 1) * 10;
    
    // Express shipping surcharge
    const expressCharge = express ? 50 : 0;
    
    // Distance-based pricing (simplified)
    const distanceCharge = destination?.province !== 'Gauteng' ? 30 : 0;
    
    const totalRate = baseRate + weightRate + expressCharge + distanceCharge;
    
    res.json({
      success: true,
      data: {
        baseRate,
        weightRate,
        expressCharge,
        distanceCharge,
        totalRate,
        currency: 'ZAR',
        estimatedDays: express ? '1-2' : '3-5'
      }
    });
  } catch (error) {
    console.error('Error calculating shipping rate:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's shipments
 * GET /api/shipping/my-shipments
 */
router.get('/my-shipments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { role } = req.query;
    
    let query;
    if (role === 'seller' || req.user.role === 'admin') {
      // Get shipments for orders where user is seller
      query = db.collection('orders')
        .where('sellerId', '==', userId)
        .where('trackingNumber', '!=', null);
    } else {
      // Get shipments for orders where user is buyer
      query = db.collection('orders')
        .where('buyerId', '==', userId)
        .where('trackingNumber', '!=', null);
    }
    
    const ordersSnapshot = await query.get();
    const shipments = [];
    
    for (const doc of ordersSnapshot.docs) {
      const order = doc.data();
      const shipmentDoc = await db.collection('shipments').doc(doc.id).get();
      
      if (shipmentDoc.exists) {
        shipments.push({
          orderId: doc.id,
          trackingNumber: order.trackingNumber,
          status: order.shippingStatus,
          createdAt: order.shippedAt,
          product: order.productTitle,
          buyer: order.buyerName,
          seller: order.sellerName,
          ...shipmentDoc.data()
        });
      }
    }
    
    res.json({
      success: true,
      data: shipments
    });
  } catch (error) {
    console.error('Error fetching user shipments:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;