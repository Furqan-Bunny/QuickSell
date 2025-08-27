const express = require('express');
const router = express.Router();
const { productUtils, categoryUtils } = require('../utils/firestore');

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
