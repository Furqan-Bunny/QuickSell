const express = require('express');
const router = express.Router();
const { productUtils, categoryUtils } = require('../utils/firestore');
const { authMiddleware } = require('../middleware/auth');
const admin = require('firebase-admin');
const db = admin.firestore();

// Get admin's products (admin is the seller)
router.get('/my-products', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status } = req.query;
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admin can manage products'
      });
    }
    
    let query = db.collection('products')
      .where('sellerId', '==', userId);
    
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    const productsSnapshot = await query
      .orderBy('createdAt', 'desc')
      .get();
    
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch products' 
    });
  }
});

// Get all products (simple version for testing)
router.get('/', async (req, res) => {
  try {
    const products = await productUtils.findAll({}, 20, 0);
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch products' 
    });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching product with ID:', req.params.id);
    const product = await productUtils.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch product' 
    });
  }
});

// Get all categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await categoryUtils.findAll();
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch categories' 
    });
  }
});

// Create new product (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admin can create products'
      });
    }
    
    const {
      title,
      description,
      images,
      categoryId,
      startingPrice,
      buyNowPrice,
      reservePrice,
      endDate,
      condition,
      location,
      shippingOptions,
      tags
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !categoryId || !startingPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Create product data
    const productData = {
      title,
      description,
      images: images || [],
      categoryId,
      startingPrice: parseFloat(startingPrice),
      currentPrice: parseFloat(startingPrice),
      buyNowPrice: buyNowPrice ? parseFloat(buyNowPrice) : null,
      reservePrice: reservePrice ? parseFloat(reservePrice) : null,
      endDate: endDate ? admin.firestore.Timestamp.fromDate(new Date(endDate)) : null,
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      condition: condition || 'new',
      location: location || '',
      shippingOptions: shippingOptions || [],
      tags: tags || [],
      status: 'active',
      sellerId: userId,
      sellerName: userData.name || userData.email,
      totalBids: 0,
      views: 0,
      watchers: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add product to database
    const productRef = await db.collection('products').add(productData);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: productRef.id,
        ...productData
      }
    });
    
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
});

// Update product (admin only)
router.put('/:productId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { productId } = req.params;
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admin can update products'
      });
    }
    
    // Get existing product
    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    const product = productDoc.data();
    
    // Check if admin owns the product or is super admin
    if (product.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own products'
      });
    }
    
    // Extract update fields
    const {
      title,
      description,
      images,
      categoryId,
      startingPrice,
      buyNowPrice,
      reservePrice,
      endDate,
      condition,
      location,
      shippingOptions,
      tags,
      status
    } = req.body;
    
    // Build update object (only include provided fields)
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (images !== undefined) updateData.images = images;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (startingPrice !== undefined) {
      updateData.startingPrice = parseFloat(startingPrice);
      // Update current price only if no bids
      if (product.totalBids === 0) {
        updateData.currentPrice = parseFloat(startingPrice);
      }
    }
    if (buyNowPrice !== undefined) updateData.buyNowPrice = buyNowPrice ? parseFloat(buyNowPrice) : null;
    if (reservePrice !== undefined) updateData.reservePrice = reservePrice ? parseFloat(reservePrice) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? admin.firestore.Timestamp.fromDate(new Date(endDate)) : null;
    if (condition !== undefined) updateData.condition = condition;
    if (location !== undefined) updateData.location = location;
    if (shippingOptions !== undefined) updateData.shippingOptions = shippingOptions;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;
    
    // Update product
    await db.collection('products').doc(productId).update(updateData);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        id: productId,
        ...updateData
      }
    });
    
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
});

// Delete product (admin only)
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { productId } = req.params;
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admin can delete products'
      });
    }
    
    // Get existing product
    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    const product = productDoc.data();
    
    // Check if admin owns the product
    if (product.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own products'
      });
    }
    
    // Check if product has active bids or orders
    if (product.totalBids > 0 || product.status === 'sold') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete product with bids or that has been sold'
      });
    }
    
    // Delete product
    await db.collection('products').doc(productId).delete();
    
    // Also delete related bids (if any)
    const bidsSnapshot = await db.collection('bids')
      .where('productId', '==', productId)
      .get();
    
    const batch = db.batch();
    bidsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

module.exports = router;
