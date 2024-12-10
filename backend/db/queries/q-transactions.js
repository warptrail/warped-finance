const pool = require('../pool');

//* Fetch all transactions
const getAllTransactions = async () => {
  const result = await pool.query('SELECT * FROM transactions');
  return result.rows;
};

//* Fetch transactions for a specific category
const getTransactionsByCategory = async (categoryName) => {
  const client = await pool.connect();

  try {
    // Check if the category exists
    const categoryResult = await client.query(
      'SELECT id FROM categories WHERE name = $1',
      [categoryName]
    );

    if (categoryResult.rows.length === 0) {
      // Return null if the category doesn't exist
      return { categoryName, categoryExists: false };
    }

    const categoryId = categoryResult.rows[0].id;

    // Fetch all transactions for the chosen category
    const transactionsResult = await client.query(
      `
      SELECT t.id, t.date, t.description, t.amount, t.source, c.name AS category, c."groupName"
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.category_id = $1
      ORDER BY t.date DESC;
      `,
      [categoryId]
    );

    return { categoryExists: true, transactions: transactionsResult.rows };
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
};

//* Get all transactions by filters
const getTransactionsByFilters = async (filters) => {
  const client = await pool.connect();

  try {
    const queryParts = [];
    const queryValues = [];
    let valueIndex = 1;

    // Filter by categories
    if (filters.categories.length > 0) {
      queryParts.push(`c.name = ANY($${valueIndex})`);
      queryValues.push(filters.categories);
      valueIndex++;
    }

    // Filter by start date
    if (filters.startDate) {
      queryParts.push(`t.date >= $${valueIndex}`);
      queryValues.push(filters.startDate);
      valueIndex++;
    }

    // Filter by end date
    if (filters.endDate) {
      queryParts.push(`t.date <= $${valueIndex}`);
      queryValues.push(filters.endDate);
      valueIndex++;
    }

    // Filter by minimum amount
    if (filters.minAmount !== null) {
      queryParts.push(`t.amount >= $${valueIndex}`);
      queryValues.push(filters.minAmount);
      valueIndex++;
    }

    // Filter by maximum amount
    if (filters.maxAmount !== null) {
      queryParts.push(`t.amount <= $${valueIndex}`);
      queryValues.push(filters.maxAmount);
      valueIndex++;
    }

    //* Build the final SQL query
    const query = `
      SELECT t.id, t.date, t.description, t.amount, t.source, c.name AS category, c."groupName"
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      ${queryParts.length > 0 ? `WHERE ${queryParts.join(' AND ')}` : ''}
      ORDER BY t.date DESC;
    `;

    const result = await client.query(query, queryValues);
    return result.rows;
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
};

//* Get a transaction by its id
const getTransactionById = async (id) => {
  const query = `
    SELECT
      t.id,
      t.date,
      t.description,
      t.amount,
      c.name AS category_name,
      g.name as group_name,
      t.notes,
      array_agg(tt.name) AS tags
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN groups g ON t.group_id = g.id
    LEFT JOIN transaction_tags ttg ON t.id = ttg.transaction_id
    LEFT JOIN tags tt ON ttg.tag_id = tt.id
    WHERE t.id = $1
    GROUP BY t.id, c.name, g.name
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new Error(`Transaction with ID "${id} not found`);
  }

  return result.rows[0];
};

//* Check that a transaction exists
const checkTransactionExists = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id FROM transactions WHERE id = $1',
      [id]
    );
    return result.rows.length > 0; // Returns true if transaction exists
  } catch (err) {
    console.error('Error checking if transaction exists:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

//* Update a transaction's category
const updateTransactionCategory = async (transactionId, categoryId) => {
  const result = await pool.query(
    `
    UPDATE transactions
    SET category_id = $1
    WHERE id = $2
    RETURNING *;
    `,
    [categoryId, transactionId]
  );
  return result.rows[0];
};

//* Insert test transactions
const insertTestTransactions = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert transactions
    await client.query(`
      INSERT INTO transactions (id, date, description, amount, notes, source)
      VALUES
      ('90000', '2024-12-04', 'Test transaction 1', -10.00, 'Test notes 1', 'test_source'),
      ('90001', '2024-12-05', 'Test transaction 2', -15.00, 'Test notes 2', 'test_source'),
      ('90002', '2024-12-06', 'Test transaction 3', -20.00, 'Test notes 3', 'test_source'),
      ('90003', '2024-12-07', 'Test transaction 4', -25.00, 'Test notes 4', 'test_source'),
      ('90004', '2024-12-08', 'Test transaction 5', -30.00, 'Test notes 5', 'test_source')
      ON CONFLICT (id) DO NOTHING;
      `);

    //* Insert tags if they don't exist
    await client.query(`
      INSERT INTO tags(name)
      values ('monsters'), ('decadence'), ('healthy')
      ON CONFLICT (name) DO NOTHING;
      `);

    //* assign tags to id
    const tagAssignments = [
      { transaction_id: '90000', tags: ['monsters', 'healthy'] },
      { transaction_id: '90001', tags: ['decadence'] },
      { transaction_id: '90002', tags: ['monsters', 'decadence'] },
      { transaction_id: '90003', tags: ['healthy'] },
      { transaction_id: '90004', tags: ['monsters', 'healthy', 'decadence'] },
    ];

    for (const { transaction_id, tags } of tagAssignments) {
      const tagIdsResult = await client.query(
        `
          SELECT id FROM tags WHERE name = ANY ($1)
        `,
        [tags]
      );
      console.log('tagIdsResult', tagIdsResult);

      const tagIds = tagIdsResult.rows.map((row) => row.id);

      if (tagIds.length) {
        const values = tagIds
          .map((_, index) => `($1, $${index + 2})`)
          .join(', ');

        const queryText = `
      INSERT INTO transaction_tags (transaction_id, tag_id)
      VALUES ${values}
      ON CONFLICT DO NOTHING;
    `;
        await client.query(queryText, [transaction_id, ...tagIds]);
      }
    }

    await client.query('COMMIT');
    return { message: 'Test transactions inserted successfully.' };
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
};

//* Select test transactions
const getMostRecentTransactions = async () => {
  const client = await pool.connect();

  try {
    const queryText = `
      SELECT 
          t.id AS transaction_id,
          t.date,
          t.description,
          t.amount,
          t.notes,
          t.source,
          c.name AS category_name,
          g.name AS group_name,
          ARRAY_AGG(tg.name) AS tags
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN groups g ON t.group_id = g.id
      LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      GROUP BY t.id, c.name, g.name
      ORDER BY t.date DESC
      LIMIT 5;
    `;

    const result = await client.query(queryText);
    return result.rows;
  } catch (err) {
    console.error('Error fetching most recent transactions:', err);
    throw new Error('Failed to fetch most recent transactions.');
  } finally {
    client.release();
  }
};

//* Split transactions
const splitTransaction = async (parentId, splits) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate Parent Transaction
    const parentResult = await client.query(
      `
    SELECT id, amount, date, is_split FROM transactions WHERE id = $1
    `,
      [parentId]
    );
    if (parentResult.rows.length === 0) {
      throw new Error(`Parent transaction with ID ${parentId} not found`);
    }
    const parentTransaction = parentResult.rows[0];
    if (parentTransaction.is_split) {
      throw new Error(`Transaction ${parentId} is already split`);
    }

    // Validate split amounts
    const totalSplitAmount = splits.reduce(
      (sum, split) => sum + split.amount,
      0
    );

    if (totalSplitAmount !== parentTransaction.amount) {
      throw new Error(`Split amounts must sum to ${parentTransaction.amount}`);
    }

    // Generate child transactions
    const childTransactions = splits.map((split, index) => ({
      id: `${parentId}-${index + 1}`,
      parent_id: parentId,
      date: parentTransaction.date,
      description: parentTransaction.description,
      ...split,
    }));

    // Insert child transactions
    for (const child of childTransactions) {
      await client.query(
        `
        INSERT INTO transactions (id, parent_id, date, description, amount, category_id, notes, is_split)
        VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
        `,
        [
          child.id,
          child.parent_id,
          child.date,
          child.description,
          child.amount,
          child.category_id || 1, // Default to 'uncategorized' if no category specified
          child.notes || '',
        ]
      );

      // Insert tags (if any)
      if (child.tags) {
        for (const tag of child.tags) {
          await client.query(
            `
            INSERT INTO transaction_tags (transaction_id, tag_id)
            SELECT $1, id FROM tags WHERE name = $2 ON CONFLICT DO NOTHING
            `,
            [child.id, tag]
          );
        }
      }
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

//* Insert a manual transaction
const insertTransaction = async (transaction) => {
  const {
    id,
    date,
    description,
    amount,
    category_id = 1, // Default to "uncategorized"
    notes = '',
    tags = [],
    source = 'manual', // Default to "manual" for user-added transactions
    quantity = 1,
    link = null,
    location = null,
  } = transaction;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert transaction into the transactions table
    // Insert transaction into the transactions table
    const transactionResult = await client.query(
      `
          INSERT INTO transactions (id, date, description, amount, category_id, notes, source, quantity, link, location)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id;
          `,
      [
        id,
        date,
        description,
        amount,
        category_id,
        notes,
        source,
        quantity,
        link,
        location,
      ]
    );

    // Get the ID of the inserted transaction
    const insertedTransactionId = transactionResult.rows[0].id;

    // Insert tags into transaction_tags table, if provided
    for (const tag of tags) {
      await client.query(
        `
          INSERT INTO transaction_tags (transaction_id, tag_id)
          SELECT $1, id FROM tags WHERE name = $2 ON CONFLICT DO NOTHING;
          `,
        [insertedTransactionId, tag]
      );
    }

    await client.query('COMMIT');
    return insertedTransactionId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

//* Delete a transaction
const deleteTransaction = async (transactionId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete the transaction
    const result = await client.query(
      `
      DELETE FROM transactions WHERE id = $1 RETURNING id, description
      `,
      [transactionId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Transaction with ID ${transactionId} does not exist`);
    }

    await client.query('COMMIT');
    console.log(`Transaction ${transactionId} deleted successfully`);
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting transaction:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getAllTransactions,
  getTransactionsByCategory,
  getTransactionsByFilters,
  getTransactionById,
  checkTransactionExists,
  updateTransactionCategory,
  insertTestTransactions,
  getMostRecentTransactions,
  splitTransaction,
  insertTransaction,
  deleteTransaction,
};
