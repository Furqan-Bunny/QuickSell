const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Create order after winning auction
router.post('/create', authMiddleware, [
  body('productId').notEmpty(),
  body('bidId').notEmpty(),
  body('shippingAddress').notEmpty()
], async (req, res) => {
  try {
    const { productId, bidId, shippingAddress, paymentMethod } = req.body;

    // Verify product and bid
    const product = await Product.findById(productId).populate('seller');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.winner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not the winner of this auction' });
    }

    // Calculate amounts
    const subtotal = product.currentPrice;
    const shippingCost = product.shippingInfo?.shippingCost || 0;
    const tax = subtotal * 0.08; // 8% tax
    const fees = subtotal * 0.03; // 3% platform fee
    const total = subtotal + shippingCost + tax + fees;

    // Create order
    const order = new Order({
      buyer: req.user._id,
      seller: product.seller._id,
      product: productId,
      bid: bidId,
      orderType: 'auction',
      amount: {
        subtotal,
        shipping: shippingCost,
        tax,
        fees,
        total
      },
      payment: {
        method: paymentMethod || 'card',
        status: 'pending'
      },
      shipping: {
        address: shippingAddress,
        status: 'pending'
      },
      status: 'pending'
    });

    await order.save();

    // Update product status
    product.status = 'sold';
    await product.save();

    // Send notifications
    const buyerNotification = new Notification({
      user: req.user._id,
      type: 'won',
      title: 'Auction Won!',
      message: `Congratulations! You won the auction for "${product.title}"`,
      data: {
        productId: product._id,
        orderId: order._id,
        amount: total
      }
    });

    const sellerNotification = new Notification({
      user: product.seller._id,
      type: 'payment',
      title: 'Item Sold!',
      message: `Your item "${product.title}" has been sold`,
      data: {
        productId: product._id,
        orderId: order._id,
        amount: subtotal
      }
    });

    await Promise.all([
      buyerNotification.save(),
      sellerNotification.save()
    ]);

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's orders
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const { role = 'buyer', status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (role === 'buyer') {
      query.buyer = req.user._id;
    } else if (role === 'seller') {
      query.seller = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('product', 'title images')
      .populate('buyer', 'username email')
      .populate('seller', 'username email')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('product')
      .populate('buyer', 'username email phone')
      .populate('seller', 'username email phone')
      .populate('bid');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user can view this order
    if (
      order.buyer._id.toString() !== req.user._id.toString() &&
      order.seller._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status (seller/admin)
router.put('/:id/status', authMiddleware, [
  body('status').isIn(['confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (
      order.seller.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { status } = req.body;
    order.status = status;

    // Update shipping status if applicable
    if (status === 'shipped') {
      order.shipping.status = 'shipped';
    } else if (status === 'delivered') {
      order.shipping.status = 'delivered';
      order.shipping.actualDelivery = new Date();
    }

    await order.save();

    // Send notification to buyer
    const notification = new Notification({
      user: order.buyer,
      type: 'shipping',
      title: 'Order Update',
      message: `Your order #${order.orderNumber} status has been updated to ${status}`,
      data: {
        orderId: order._id
      }
    });
    await notification.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update shipping info
router.put('/:id/shipping', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (
      order.seller.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { carrier, trackingNumber, estimatedDelivery } = req.body;

    if (carrier) order.shipping.carrier = carrier;
    if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.shipping.estimatedDelivery = estimatedDelivery;

    await order.save();

    // Send notification to buyer
    const notification = new Notification({
      user: order.buyer,
      type: 'shipping',
      title: 'Shipping Update',
      message: `Tracking information has been added to your order #${order.orderNumber}`,
      data: {
        orderId: order._id,
        trackingNumber
      }
    });
    await notification.save();

    res.json({
      message: 'Shipping information updated successfully',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add review
router.post('/:id/review', authMiddleware, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { rating, comment } = req.body;
    const isBuyer = order.buyer.toString() === req.user._id.toString();
    const isSeller = order.seller.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if order is completed
    if (order.status !== 'completed' && order.status !== 'delivered') {
      return res.status(400).json({ error: 'Can only review completed orders' });
    }

    if (isBuyer) {
      order.review.fromBuyer = {
        rating,
        comment,
        createdAt: new Date()
      };

      // Update seller's rating
      const seller = await User.findById(order.seller);
      const totalRating = (seller.ratings.average * seller.ratings.count) + rating;
      seller.ratings.count += 1;
      seller.ratings.average = totalRating / seller.ratings.count;
      await seller.save();
    } else {
      order.review.fromSeller = {
        rating,
        comment,
        createdAt: new Date()
      };

      // Update buyer's rating
      const buyer = await User.findById(order.buyer);
      const totalRating = (buyer.ratings.average * buyer.ratings.count) + rating;
      buyer.ratings.count += 1;
      buyer.ratings.average = totalRating / buyer.ratings.count;
      await buyer.save();
    }

    await order.save();

    res.json({
      message: 'Review added successfully',
      review: isBuyer ? order.review.fromBuyer : order.review.fromSeller
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel order
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (
      order.buyer.toString() !== req.user._id.toString() &&
      order.seller.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'completed'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel order in current status' });
    }

    order.status = 'cancelled';
    await order.save();

    // Update product status back to ended
    await Product.findByIdAndUpdate(order.product, { status: 'ended' });

    // Send notifications
    const buyerNotification = new Notification({
      user: order.buyer,
      type: 'system',
      title: 'Order Cancelled',
      message: `Order #${order.orderNumber} has been cancelled`,
      data: { orderId: order._id }
    });

    const sellerNotification = new Notification({
      user: order.seller,
      type: 'system',
      title: 'Order Cancelled',
      message: `Order #${order.orderNumber} has been cancelled`,
      data: { orderId: order._id }
    });

    await Promise.all([
      buyerNotification.save(),
      sellerNotification.save()
    ]);

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;