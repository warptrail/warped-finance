const express = require('express');
const router = express.Router();
const { updateCategory } = require('../db/queries');

router.put('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { newGroupName } = req.body;
    const result = await updateCategory(name, newGroupName);
    res.json({ message: 'Category updated successfully', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: 'Failed to update category' });
  }
});

module.exports = router;
