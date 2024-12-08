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

insertTestTransactions = async () => {
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

module.exports = {
  getAllTransactions,
  getTransactionsByCategory,
  getTransactionsByFilters,
  updateTransactionCategory,
  insertTestTransactions,
  getMostRecentTransactions,
};
