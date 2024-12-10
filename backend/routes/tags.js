const express = require('express');
const {
  getTransactionsWithTags,
  getTransactionsByTags,
  createTag,
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

//* Insert a new transaction
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

module.exports = router;
