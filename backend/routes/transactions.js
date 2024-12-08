const express = require('express');
const router = express.Router();
const {
  getAllTransactions,
  getTransactionsByCategory,
  getTransactionsByFilters,
  updateTransactionCategory,
  insertTestTransactions,
  getMostRecentTransactions,
} = require('../db/queries/q-transactions');

const {} = require('../db/queries/q-groups');
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

//* Post pre-written test transactions
router.post('/insert-test-transactions', async (req, res) => {
  try {
    const result = await insertTestTransactions();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//* Get those most recent test transactions
router.get('/recent-transactions', async (req, res) => {
  try {
    const transactions = await getMostRecentTransactions();
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
