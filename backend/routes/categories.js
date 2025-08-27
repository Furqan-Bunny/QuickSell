const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true, parent: null })
      .populate('subcategories')
      .sort('order name');
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('subcategories')
      .populate('parent');
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create category (admin only)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    
    if (category.parent) {
      await Category.findByIdAndUpdate(category.parent, {
        $push: { subcategories: category._id }
      });
    }
    
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update category (admin only)
router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete category (admin only)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    if (category.productCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products' });
    }
    
    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;