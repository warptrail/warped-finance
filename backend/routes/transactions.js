const express = require('express');
const router = express.Router();
const {
  getTransactionsWithTags,
  getAllTransactions,
  updateTransactionCategory,
  getTransactionsByCategory,
  getTransactionsByFilters,
  getTransactionsByTags,
} = require('../db/queries');

//* Get all transactions & transactions filtered by multiple criteria
router.get('/', async (req, res) => {
  let transactions;
  const queryExists = !!Object.keys(req.query).length;

  const { categories, startDate, endDate, minAmount, maxAmount } = req.query;

  try {
    if (!queryExists) {
      transactions = await getAllTransactions();
      return res.json(transactions);
    }
    const filters = {
      categories: categories ? categories.split('.') : [],
      startDate,
      endDate,
      minAmount: minAmount ? parseFloat(minAmount) : null,
      maxAmount: maxAmount ? parseFloat(maxAmount) : null,
    };

    transactions = await getTransactionsByFilters(filters);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tags-test', async (req, res) => {
  const transactions = await getTransactionsWithTags();
  res.json(transactions);
});

// Fetch Transactions with one or multiple tags
router.get('/tags', async (req, res) => {
  const { tags, mode } = req.query;

  try {
    // If no tags, return 400 error
    if (!tags) {
      return res.status(400).json({ error: 'Tags parameter is required' });
    }

    // Split the tags into an array
    const tagsArray = tags.split(',').map((tag) => tag.trim().toLowerCase());

    if (tagsArray.length === 0) {
      return res.status(400).json({ error: 'Provide at least one tag' });
    }

    const isAndMode = mode === 'and'; // Toggle between AND and OR logic

    const transactions = await getTransactionsByTags(tagsArray, isAndMode);

    return res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions for category:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

//* Get all transactions of a specific category (Using a parameter instead of a query)
router.get('/category/:name', async (req, res) => {
  const { name } = req.params;

  try {
    const result = await getTransactionsByCategory(name);

    if (!result.categoryExists) {
      return res.status(404).json({ error: `Category ${name} does not exist` });
    }
    return res.json(result.transactions);
  } catch (err) {
    console.error('Error fetching transactions for category:', err);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

//* Update transaction category
router.put('/:id/category', async (req, res) => {
  const { id } = req.params;
  const { categoryId } = req.body;

  try {
    const updatedTransaction = await updateTransactionCategory(id, categoryId);
    if (!updatedTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
