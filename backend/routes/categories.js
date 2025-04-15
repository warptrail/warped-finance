const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryByName,
  insertCategory,
  updateCategoryName,
  fetchCategoriesByGroup,
  getCategoriesGroupedByGroup,
  updateCategoryGroup,
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

// Get all categories organized into their groups
router.get('/grouped', async (req, res) => {
  try {
    const groupedCategories = await getCategoriesGroupedByGroup();
    res.json(groupedCategories);
  } catch (err) {
    console.error('Error fetching grouped categories:', err);
    res.status(500).send('Failed to fetch grouped categories');
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

// PUT change category group
router.put('/:id/group', async (req, res) => {
  const categoryId = parseInt(req.params.id, 10);
  console.log('category ID: ', categoryId);
  const { newGroupId } = req.body;

  if (!categoryId || !newGroupId) {
    return res
      .status(400)
      .json({ error: 'Category ID and newGroupId are required.' });
  }

  try {
    const updatedCategory = await updateCategoryGroup(categoryId, newGroupId);
    if (!updatedCategory) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    res.status(200).json(updatedCategory);
  } catch (err) {
    console.error('Error updating category group:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
