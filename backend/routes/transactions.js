const express = require('express');
const router = express.Router();
const { getTransactions, updateTransaction } = require('../db/queries');

router.get('/', async (req, res) => {
  try {
    const { category, tag, startDate, endDate } = req.query;
    const transactions = await getTransactions({
      category,
      tag,
      startDate,
      endDate,
    });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Update a transaction
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, tags } = req.body;

    const result = await updateTransaction(id, { category, tags });
    res.json({ message: 'Transaction updated successfully', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: 'Failed to update transaction' });
  }
});

module.exports = router;
