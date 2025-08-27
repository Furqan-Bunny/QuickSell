const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authMiddleware } = require('../middleware/auth');

const db = admin.firestore();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categoriesSnapshot = await db.collection('categories')
      .orderBy('order', 'asc')
      .get();
    
    const categories = [];
    categoriesSnapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
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

// Get single category with products
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get category
    const categoryDoc = await db.collection('categories').doc(id).get();
    
    if (!categoryDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Get products in this category
    const productsSnapshot = await db.collection('products')
      .where('categoryId', '==', id)
      .where('status', '==', 'active')
      .limit(20)
      .get();
    
    const products = [];
    productsSnapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: {
        category: {
          id: categoryDoc.id,
          ...categoryDoc.data()
        },
        products
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
});

module.exports = router;