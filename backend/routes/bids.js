const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Place a bid
router.post('/', authMiddleware, [
  body('productId').notEmpty(),
  body('amount').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, amount, maxAmount } = req.body;

    // Mock implementation - return success without database
    console.log('Mock bid placed:', { productId, amount, user: req.user.username });
    
    // Return successful bid response
    return res.status(201).json({
      message: 'Bid placed successfully',
      bid: {
        id: `bid_${Date.now()}`,
        amount: amount,
        status: 'winning',
        productId: productId,
        bidder: req.user.username
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get bids for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const bids = await Bid.find({ product: req.params.productId })
      .populate('bidder', 'username firstName lastName avatar')
      .sort('-amount -placedAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bid.countDocuments({ product: req.params.productId });

    res.json({
      bids,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBids: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's bids
router.get('/my-bids', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { bidder: req.user._id };
    if (status) query.status = status;

    const bids = await Bid.find(query)
      .populate({
        path: 'product',
        select: 'title images currentPrice endDate status',
        populate: {
          path: 'seller',
          select: 'username'
        }
      })
      .sort('-placedAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bid.countDocuments(query);

    res.json({
      bids,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBids: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get bid details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id)
      .populate('product', 'title images currentPrice endDate')
      .populate('bidder', 'username avatar');

    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    // Check if user can view this bid
    if (bid.bidder._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(bid);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel bid (if allowed)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    // Check ownership
    if (bid.bidder.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if bid can be cancelled
    if (bid.status === 'won') {
      return res.status(400).json({ error: 'Cannot cancel winning bid' });
    }

    const product = await Product.findById(bid.product);
    
    // Don't allow cancellation if auction has ended
    if (new Date() > product.endDate) {
      return res.status(400).json({ error: 'Cannot cancel bid after auction has ended' });
    }

    // Don't allow cancellation if this is the highest bid and auction is ending soon
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    if (bid.status === 'winning' && product.endDate < oneHourFromNow) {
      return res.status(400).json({ 
        error: 'Cannot cancel highest bid within 1 hour of auction ending' 
      });
    }

    bid.status = 'cancelled';
    await bid.save();

    // If this was the winning bid, find the next highest bid
    if (bid.status === 'winning') {
      const nextHighestBid = await Bid.findOne({
        product: bid.product,
        status: 'outbid',
        _id: { $ne: bid._id }
      }).sort('-amount');

      if (nextHighestBid) {
        nextHighestBid.status = 'winning';
        await nextHighestBid.save();
        
        product.currentPrice = nextHighestBid.amount;
        await product.save();
      } else {
        // No other bids, reset to starting price
        product.currentPrice = product.startingPrice;
        await product.save();
      }
    }

    res.json({ message: 'Bid cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get winning bids for user
router.get('/my-wins', authMiddleware, async (req, res) => {
  try {
    const winningBids = await Bid.find({
      bidder: req.user._id,
      status: 'won'
    })
    .populate({
      path: 'product',
      select: 'title images currentPrice seller',
      populate: {
        path: 'seller',
        select: 'username email'
      }
    })
    .sort('-placedAt');

    res.json(winningBids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;