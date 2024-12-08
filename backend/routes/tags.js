const express = require('express');
const {
  getTransactionsWithTags,
  getTransactionsByTags,
} = require('../db/queries/q-tags');
const router = express.Router();

router.get('/transactions-with-tags', async (req, res) => {
  try {
    const transactionsWithTags = await getTransactionsWithTags();
    console.log(transactionsWithTags);
    return res.status(200).json(transactionsWithTags);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions with tags' });
  }
});

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

module.exports = router;
