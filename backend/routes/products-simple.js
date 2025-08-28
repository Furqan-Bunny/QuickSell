const express = require('express');
const router = express.Router();
const { productUtils, categoryUtils } = require('../utils/firestore');
const { authMiddleware } = require('../middleware/auth');
const admin = require('firebase-admin');
const db = admin.firestore();

// Get seller's products
router.get('/my-products', authMiddleware, async (req, res) => {
  try {
    const sellerId = req.user.uid;
    const { status } = req.query;
    
    let query = db.collection('products')
      .where('sellerId', '==', sellerId);
    
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
    console.error('Error fetching seller products:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch your products' 
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

module.exports = router;
