const express = require('express');
const router = express.Router();
const {
  getAllTransactions,
  getTransactionsByCategory,
  getTransactionsByFilters,
  getTransactionById,
  checkTransactionExists,
  updateTransactionCategory,
  insertTestTransactions,
  getMostRecentTransactions,
  splitTransaction,
  deleteSplitTransactions,
  insertTransaction,
  deleteTransaction,
  getLastTwentyTransactions,
} = require('../db/queries/q-transactions');

const isValidTransactionId = require('../helpers/isValidTransactionId');

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

//* Delete those recent test transactions

//* Insert a transaction manually
router.post('/new', async (req, res) => {
  const { id, date, description, amount, category_id, tags } = req.body; // Expect the transaction data in the request body
  // Validate the request body (basic validation)
  if (!id || !date || !description || !amount) {
    return res.status(400).json({
      error: 'Missing required fields: id, date, description, or amount',
    });
  }

  if (!isValidTransactionId(id)) {
    return res.status(400).json({ error: 'Invalid or missing transaction ID' });
  }
  try {
    // Check if the ID already exists
    const exists = await checkTransactionExists(id);
    if (exists) {
      return res
        .status(409)
        .json({ error: `Transaction with ID ${id} already exists` });
    }
    // Insert the transaction
    const insertedTransactionId = await insertTransaction({
      id,
      date,
      description,
      amount,
      category_id,
      tags,
    });

    res.status(201).json({
      message: 'Transaction added successfully',
      id: insertedTransactionId,
    });
  } catch (err) {
    console.error('Error inserting transaction:', err.message);
    res.status(500).json({ error: 'Failed to insert transaction' });
  }
});

//* Get a specific transaction
router.get('/id/:id', async (req, res) => {
  const { id } = req.params;

  // Validate transaction ID format
  if (!isValidTransactionId(id)) {
    return res.status(400).json({ error: 'Invalid transaction ID format' });
  }

  try {
    // Fetch the transaction
    const transaction = await getTransactionById(id);
    res.status(200).json(transaction);
  } catch (err) {
    console.error('Error fetching transaction', err.message);
    res.status(404).json({ error: err.message });
  }
});

//* Get last 20 transactions
router.get('/last-20', async (req, res) => {
  try {
    const lastTwentyTransactions = await getLastTwentyTransactions();
    return res.status(200).json(lastTwentyTransactions);
  } catch (err) {
    console.error('Error fetching transaction', err.message);
    res.status(500).json({ error: err });
  }
});

//* Delete a specific transaction
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidTransactionId(id)) {
    return res.status(400).json({ error: 'Invalid transaction ID format' });
  }

  try {
    const deletedTransaction = await deleteTransaction(id);
    res.status(200).json({
      message: `Transaction ${id} deleted successfully`,
      transaction: deletedTransaction,
    });
  } catch (err) {
    if (err.message.includes('does not exist')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  }
});

// * Splitting Transactions
router.post('/split/:id', async (req, res) => {
  const { id } = req.params; // Parent transaction ID
  const { splits } = req.body; // Array of splits from the request body

  try {
    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return res
        .status(400)
        .json({ error: 'Invalid or missing splits data', splits });
    }

    // Call the function to split the transaction
    const result = await splitTransaction(id, splits);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error splitting transaction:', err.message);
    if (err.message.includes('Split amounts must sum to')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

//* DELETE endpoint for deleting the splits for a specific transaction
router.delete('/id/:id/splits', async (req, res) => {
  const { id } = req.params;
  try {
    // call the deleteSplits function
    const result = await deleteSplitTransactions(id);

    // Return the success message
    res.json(result);
  } catch (err) {
    console.error(
      `Error deleting splits for transaction ID ${id}:`,
      err.message
    );
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
