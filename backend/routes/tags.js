const express = require('express');
const {
  getTransactionsWithTags,
  getTransactionsByTags,
  createTag,
  getAllTags,
  updateTransactionTags,
} = require('../db/queries/q-tags');
const router = express.Router();

//* Get all transactions with any tag
router.get('/transactions-with-tags', async (req, res) => {
  try {
    const transactionsWithTags = await getTransactionsWithTags();
    console.log(transactionsWithTags);
    return res.status(200).json(transactionsWithTags);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions with tags' });
  }
});

//* Get all transactions with a specific tag
router.get('/transactions-by-tags', async (req, res) => {
  try {
    // Expect tags as a comma-separated string
    const tags = req.query.tags?.split(',');
    const mode = req.query.mode || 'OR'; // Default mode is OR

    if (!tags || tags.length === 0) {
      return res
        .status(400)
        .json({ error: 'Tags query parameter is required' });
    }

    const transactions = await getTransactionsByTags(tags, mode.toLowerCase());
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions by tags' });
  }
});

//* Insert a new tag
router.post('/new', async (req, res) => {
  const { name } = req.body; // Expecting the tag name in the request body

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid tag name' });
  }

  try {
    const newTag = await createTag(name);
    return res
      .status(201)
      .json({ message: 'Tag created successfully', tag: newTag });
  } catch (err) {
    if (err.message.includes('already exists')) {
      res.status(409).json({ error: err.message });
    } else {
      console.error('Error creating tag:', err.message);
      res.status(500).json({ error: 'Failed to create tag' });
    }
  }
});

// GET /api/tags - Fetch all tags
router.get('/', async (req, res) => {
  try {
    const tags = await getAllTags();
    res.status(200).json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

//* Edit the transaction tags
router.put('/per-transaction/:id', async (req, res) => {
  const { id } = req.params; // The transaction id
  const { tags } = req.body;

  try {
    await updateTransactionTags(id, tags);
    res.status(200).send({ message: 'Tags updated successfully' });
  } catch (err) {
    console.error('Error updating tags:', err);
    res.status(500).send({ error: 'Failed to update tags' });
  }
});

module.exports = router;
