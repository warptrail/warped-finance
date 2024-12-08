const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryByName,
  insertCategory,
  updateCategoryName,
} = require('../db/queries/q-categories');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update or merge categories
router.put('/update/:currentName', async (req, res) => {
  const { currentName } = req.params;
  const { newName } = req.body;

  try {
    if (!newName) {
      return res.status(400).json({ error: 'New category name is required' });
    }

    if (newName === currentName) {
      return res.status(400).json({
        error: 'New category name cannot be identical to old category name',
      });
    }

    const result = await updateCategoryName(currentName, newName);

    res.json({
      message: `Category "${result.currentName}" successfully updated to "${result.newName}"`,
      updatedCategoryId: result.updateCategoryId,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      // Custom error handling for "category not found"
      return res.status(404).json({ error: error.message });
    }

    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
