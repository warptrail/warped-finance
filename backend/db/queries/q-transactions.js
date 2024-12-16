const pool = require('../pool');

//* Fetch all transactions
const getAllTransactions = async () => {
  const result = await pool.query(
    `
    SELECT 
          t.id, 
          t.date, 
          t.description, 
          t.amount, 
          c.name AS category_name, 
          g.name AS group_name, 
          t.is_split,
          COALESCE(json_agg(DISTINCT tg.name) FILTER (WHERE tg.name IS NOT NULL), '[]') AS tags
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN groups g ON c."groupName" = g.name
      LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      GROUP BY t.id, t.date, t.description, t.amount, c.name, g.name
      ORDER BY t.id DESC
    `
  );
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
      t.original_description,
      t.amount,
      c.name AS category_name,
      g.name as group_name,
      t.is_split,
      t.notes,
      t.source,
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

//* PUT edit a transaction by its id
// Update transaction
const updateTransaction = async (id, updates) => {
  const fields = [];
  const values = [];
  let count = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${count}`);
    values.push(value);
    count++;
  }

  const query = `
    UPDATE transactions
    SET ${fields.join(', ')}
    WHERE id = $${count}
    RETURNING *;
  `;

  values.push(id);

  const result = await pool.query(query, values);
  if (result.rows.length === 0) {
    throw new Error(`Transaction with ID ${id} not found`);
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
const splitTransaction = async (transactionId, childTransactions) => {
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');

    // Fetch the parent transaction
    const parentTransactionResult = await client.query(
      'SELECT * FROM transactions WHERE id = $1',
      [transactionId]
    );

    // Throw an error if the parent transaction does not exist
    if (parentTransactionResult.rows.length === 0) {
      throw new Error(`PARENT transaction with ID ${transactionId} not found`);
    }

    const parentTransaction = parentTransactionResult.rows[0];

    // Make sure the transaction is not already split
    if (parentTransaction.is_split) {
      throw new Error(`Transaction with id ${transactionId} is already split`);
    }

    // Calculate the total amount of child transactions to ensure they match the parent
    const totalChildAmount = childTransactions.reduce(
      (sum, child) => sum + child.amount,
      0
    );
    if (totalChildAmount !== parseFloat(parentTransaction.amount, 10)) {
      throw new Error(
        'Child transactions amounts do not sum up to the parent transaction amount'
      );
    }

    // Mark the parent transaction as split
    await client.query(
      'UPDATE transactions SET is_split = TRUE WHERE id = $1',
      [transactionId]
    );

    // update the category to the default
    await client.query(
      'UPDATE transactions SET category_id = 1 WHERE id = $1',
      [transactionId]
    );

    // Loop through each child transaction and insert it into the database
    for (let i = 0; i < childTransactions.length; i++) {
      const child = childTransactions[i];

      // Fetch the category_id based on the category name provided
      const categoryResult = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [child.category]
      );

      // check if this category in the request body exists
      if (categoryResult.rows.length === 0) {
        throw new Error(`Category "${child.category}" does not exist`);
      }

      // get the category id
      const categoryId = categoryResult.rows[0].id;

      // Generate a unique ID for the child transaction
      const childId = `${transactionId}-${i + 1}`;
      await client.query(
        `INSERT INTO transactions (id, date, description, amount, category_id, group_id, parent_id, is_split, source)
          VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8)`,
        [
          childId,
          parentTransaction.date, // Use the parent's date
          parentTransaction.description, // Use the parent's description
          child.amount, // Amount specific to the child transaction
          categoryId, // Use the resolved category ID
          child.group_id || parentTransaction.group_id, // Inherit group if not provided
          transactionId, // Set the parent ID
          parentTransaction.source,
        ]
      );
    }

    // Commit the transaction if all operations are successful
    await client.query('COMMIT');

    //Return details of the updated parent and inserted child transactions
    return {
      parentTransaction: {
        id: transactionId,
        ...parentTransaction,
        is_split: true,
        categoryId: 'returned to default',
      },
      childTransactions: childTransactions.map((child, index) => ({
        id: `${transactionId}-${index + 1}`,
        ...child,
      })),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

//* Delete Split transactions
const deleteSplitTransactions = async (transactionId) => {
  const client = await pool.connect();

  try {
    const parentTransactionResult = await client.query(
      'SELECT is_split FROM transactions WHERE id = $1',
      [transactionId]
    );

    // Check if the transaction exists
    if (parentTransactionResult.rows.length === 0) {
      throw new Error(`Transaction with ID ${transactionId} not found`);
    }

    // Deconstruct data
    const parentTransaction = parentTransactionResult.rows[0];

    // Check if the transaction is split
    const isSplit = parentTransaction.is_split;
    if (!isSplit) {
      throw new Error(
        `Transaction with ID ${transactionId} is not marked as split`
      );
    }

    // Count the child transactions
    const childCountResult = await client.query(
      'SELECT COUNT(*) FROM transactions WHERE parent_id = $1',
      [transactionId]
    );
    const childCount = parseInt(childCountResult.rows[0].count, 10);

    // Find and delete child transactions
    await client.query('DELETE FROM transactions WHERE parent_id = $1', [
      transactionId,
    ]);

    // Update the parent transaction to mark it no longer split
    await client.query(
      'UPDATE transactions SET is_split = FALSE WHERE id = $1',
      [transactionId]
    );

    // Commit transaction
    await client.query('COMMIT');

    const singularOrPlural = (x, option1, option2) => {
      if (x === 1) {
        return option1;
      } else {
        return option2;
      }
    };
    console.log(
      `Successfully deleted ${childCount} split${singularOrPlural(
        childCount,
        '',
        's'
      )} for transaction ID ${transactionId}`
    );
    return {
      message: `Successfully deleted ${childCount} split${singularOrPlural(
        childCount,
        '',
        's'
      )} for transaction ID ${transactionId}`,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting splits:', err.message);
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

//* Get the most recent 20 transactions
const getLastTwentyTransactions = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
  SELECT 
          t.id, 
          t.date, 
          t.description, 
          t.amount, 
          c.name AS category_name, 
          g.name AS group_name, 
          t.is_split,
          COALESCE(json_agg(DISTINCT tg.name) FILTER (WHERE tg.name IS NOT NULL), '[]') AS tags
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN groups g ON c."groupName" = g.name
      LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      GROUP BY t.id, t.date, t.description, t.amount, c.name, g.name
      ORDER BY t.date DESC
      LIMIT 20;
      `);

    return result.rows;
  } catch (err) {
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
  updateTransaction,
  checkTransactionExists,
  updateTransactionCategory,
  insertTestTransactions,
  getMostRecentTransactions,
  splitTransaction,
  deleteSplitTransactions,
  insertTransaction,
  deleteTransaction,
  getLastTwentyTransactions,
};
