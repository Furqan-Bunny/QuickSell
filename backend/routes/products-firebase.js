const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload image to Firebase Storage
const uploadToStorage = async (file) => {
  const fileName = `products/${uuidv4()}-${file.originalname}`;
  const fileUpload = bucket.file(fileName);
  
  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (error) => {
      reject(error);
    });

    stream.on('finish', async () => {
      // Make the file public
      await fileUpload.makePublic();
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      resolve(publicUrl);
    });

    stream.end(file.buffer);
  });
};

// Get my products (for admin/seller)
router.get('/my-products', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Get all products for admin
    let snapshot;
    try {
      snapshot = await db.collection('products')
        .orderBy('createdAt', 'desc')
        .get();
    } catch (error) {
      // Fallback without ordering if index is missing
      console.log('Products orderBy failed, using fallback:', error.message);
      snapshot = await db.collection('products').get();
    }
    
    const products = [];
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, status, search, sort } = req.query;
    let query = db.collection('products');
    
    // Apply filters
    if (category) {
      query = query.where('categoryId', '==', category);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Get all products
    const snapshot = await query.get();
    let products = [];
    
    snapshot.forEach(doc => {
      const product = {
        id: doc.id,
        ...doc.data()
      };
      
      // Apply search filter if needed
      if (!search || 
          product.title?.toLowerCase().includes(search.toLowerCase()) ||
          product.description?.toLowerCase().includes(search.toLowerCase())) {
        products.push(product);
      }
    });
    
    // Apply sorting
    if (sort === 'price-asc') {
      products.sort((a, b) => a.currentPrice - b.currentPrice);
    } else if (sort === 'price-desc') {
      products.sort((a, b) => b.currentPrice - a.currentPrice);
    } else if (sort === 'ending-soon') {
      products.sort((a, b) => {
        const aDate = a.endDate?._seconds ? a.endDate._seconds : new Date(a.endDate).getTime() / 1000;
        const bDate = b.endDate?._seconds ? b.endDate._seconds : new Date(b.endDate).getTime() / 1000;
        return aDate - bDate;
      });
    } else {
      // Default: newest first
      products.sort((a, b) => {
        const aDate = a.createdAt?._seconds || 0;
        const bDate = b.createdAt?._seconds || 0;
        return bDate - aDate;
      });
    }
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Validate product ID format
    if (!productId || productId === 'undefined' || productId === 'null') {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    // Try to fetch the product
    let doc;
    try {
      doc = await db.collection('products').doc(productId).get();
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      // If Firestore throws an error (invalid ID format), return 400
      if (firestoreError.code === 'invalid-argument') {
        return res.status(400).json({ error: 'Invalid product ID format' });
      }
      throw firestoreError;
    }
    
    if (!doc.exists) {
      console.log('Product not found:', productId);
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const productData = doc.data();
    
    // Only increment view count if product is active
    if (productData.status === 'active') {
      try {
        await db.collection('products').doc(productId).update({
          views: admin.firestore.FieldValue.increment(1)
        });
      } catch (updateError) {
        // Don't fail the request if view count update fails
        console.error('Failed to update view count:', updateError);
      }
    }
    
    // Get related data (bids) if needed
    let bids = [];
    try {
      const bidsSnapshot = await db.collection('bids')
        .where('productId', '==', productId)
        .orderBy('amount', 'desc')
        .limit(10)
        .get();
      
      bids = bidsSnapshot.docs.map(bidDoc => ({
        id: bidDoc.id,
        ...bidDoc.data()
      }));
    } catch (bidsError) {
      console.log('Could not fetch bids:', bidsError);
      // Continue without bids
    }
    
    res.json({
      success: true,
      data: {
        id: doc.id,
        ...productData
      },
      bids
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create product (Admin only)
router.post('/', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can create products' });
    }
    
    const {
      title,
      description,
      category,
      categoryId,
      startingPrice,
      incrementAmount,
      buyNowPrice,
      condition,
      endDate,
      specifications,
      shipping
    } = req.body;
    
    // Upload images if provided
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadToStorage(file);
          imageUrls.push(url);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    }
    
    // Create product document
    const product = {
      title,
      description,
      category,
      categoryId,
      images: imageUrls,
      startingPrice: parseFloat(startingPrice),
      currentPrice: parseFloat(startingPrice),
      incrementAmount: parseFloat(incrementAmount) || 100,
      buyNowPrice: buyNowPrice ? parseFloat(buyNowPrice) : null,
      condition,
      status: 'active',
      sellerId: req.user.uid,
      sellerName: req.user.username || req.user.email,
      endDate: new Date(endDate),
      specifications: specifications ? JSON.parse(specifications) : {},
      shipping: shipping ? JSON.parse(shipping) : {
        cost: 0,
        location: 'South Africa',
        methods: ['Standard Shipping']
      },
      views: 0,
      bidsCount: 0,
      watchers: 0,
      featured: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('products').add(product);
    
    // Update category product count
    if (categoryId) {
      await db.collection('categories').doc(categoryId).update({
        productCount: admin.firestore.FieldValue.increment(1)
      });
    }
    
    res.json({
      success: true,
      data: {
        id: docRef.id,
        ...product
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (Admin only)
router.put('/:id', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update products' });
    }
    
    const productId = req.params.id;
    const updates = { ...req.body };
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      for (const file of req.files) {
        try {
          const url = await uploadToStorage(file);
          imageUrls.push(url);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
      
      // Add new images to existing ones
      const doc = await db.collection('products').doc(productId).get();
      const existingImages = doc.data()?.images || [];
      updates.images = [...existingImages, ...imageUrls];
    }
    
    // Parse JSON fields if they're strings
    if (typeof updates.specifications === 'string') {
      updates.specifications = JSON.parse(updates.specifications);
    }
    if (typeof updates.shipping === 'string') {
      updates.shipping = JSON.parse(updates.shipping);
    }
    
    // Convert price fields to numbers
    if (updates.startingPrice) updates.startingPrice = parseFloat(updates.startingPrice);
    if (updates.currentPrice) updates.currentPrice = parseFloat(updates.currentPrice);
    if (updates.incrementAmount) updates.incrementAmount = parseFloat(updates.incrementAmount);
    if (updates.buyNowPrice) updates.buyNowPrice = parseFloat(updates.buyNowPrice);
    
    // Update timestamp
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('products').doc(productId).update(updates);
    
    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can delete products' });
    }
    
    const productId = req.params.id;
    
    // Get product to check category
    const doc = await db.collection('products').doc(productId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = doc.data();
    
    // Delete product
    await db.collection('products').doc(productId).delete();
    
    // Update category product count
    if (product.categoryId) {
      await db.collection('categories').doc(product.categoryId).update({
        productCount: admin.firestore.FieldValue.increment(-1)
      });
    }
    
    // Delete associated bids
    const bidsSnapshot = await db.collection('bids')
      .where('productId', '==', productId)
      .get();
    
    const batch = db.batch();
    bidsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// End auction manually (Admin only)
router.post('/:id/end', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can end auctions' });
    }
    
    const productId = req.params.id;
    const auctionScheduler = require('../services/auctionScheduler');
    
    const result = await auctionScheduler.endAuctionManually(productId);
    
    // Emit socket event
    const socketService = req.app.get('socketService');
    if (socketService) {
      socketService.emitToAuction(productId, 'auction-ended', {
        message: 'Auction has ended'
      });
    }
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error ending auction:', error);
    res.status(500).json({ error: error.message || 'Failed to end auction' });
  }
});

// Toggle featured status (Admin only)
router.post('/:id/feature', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can feature products' });
    }
    
    const productId = req.params.id;
    const { featured } = req.body;
    
    await db.collection('products').doc(productId).update({
      featured: featured,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      message: `Product ${featured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error) {
    console.error('Error updating featured status:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

module.exports = router;