const pool = require('./pool');

const getTransactionsWithTags = async () => {
  const result = await pool.query(
    `
  SELECT 
    t.id,
    t.date,
    t.description,
    c.name AS category_name,
    g.name AS group_name,
    ARRAY_AGG(tag.name) AS tags, -- Aggregate tags into an array
    t.notes
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN groups g ON t.group_id = g.id
JOIN transaction_tags tt ON t.id = tt.transaction_id -- Ensure the transaction has at least one tag
JOIN tags tag ON tt.tag_id = tag.id
GROUP BY t.id, t.date, t.description, c.name, g.name, t.notes
ORDER BY t.id
LIMIT 100;
    `
  );
  return result.rows;
};

// Fetch all categories
const getAllCategories = async () => {
  const result = await pool.query('SELECT * FROM categories');
  return result.rows;
};

// Fetch a category by name
const getCategoryByName = async (name) => {
  const result = await pool.query('SELECT * FROM categories WHERE name = $1', [
    name,
  ]);
  return result.rows[0];
};

// Insert a category into the "ungrouped" group
const insertCategory = async (name) => {
  const result = await pool.query(
    `
    INSERT INTO categories (name, "groupName")
    VALUES ($1, 'ungrouped')
    ON CONFLICT (name) DO NOTHING
    RETURNING *;
    `,
    [name]
  );
  return result.rows[0];
};

// Update a category's name
const updateCategoryName = async (currentName, newName) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch the current category
    const currentCategoryResult = await client.query(
      'SELECT id, "groupName" FROM categories WHERE name = $1',
      [currentName]
    );

    if (currentCategoryResult.rows.length === 0) {
      throw new Error(`Category "${currentName}" not found`);
    }

    const currentCategory = currentCategoryResult.rows[0];

    // Check if the new category already exists
    const newCategoryResult = await client.query(
      'SELECT id FROM categories WHERE name = $1',
      [newName]
    );

    let newCategoryId;

    if (newCategoryResult.rows.length > 0) {
      // Case 2: The new category already exists
      newCategoryId = newCategoryResult.rows[0].id;
    } else {
      // Case 3: the new category does not exist; create it
      const insertCategoryResult = await client.query(
        `
        INSERT INTO categories (name, "groupName")
        VALUES ($1, $2)
        RETURNING id;
        `,
        [newName, currentCategory.groupName]
      );
      newCategoryId = insertCategoryResult.rows[0].id;
    }

    // Update transactions to point to the new category
    await client.query(
      `
    UPDATE transactions
    SET category_id = $1
    WHERE category_id = $2;
    `,
      [newCategoryId, currentCategory.id]
    );

    // Delete the old category
    await client.query('DELETE FROM categories WHERE id = $1', [
      currentCategory.id,
    ]);
    await client.query('COMMIT');
    return { currentName, newName, updateCategoryId: newCategoryId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Fetch all transactions
const getAllTransactions = async () => {
  const result = await pool.query('SELECT * FROM transactions');
  return result.rows;
};

// Fetch transactions for a specific category
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

// Get all transactions by filters
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

    // Build the final SQL query
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

// Get transactions by multiple tags either and or or
const getTransactionsByTags = async (tagsArray, isAndMode) => {
  const client = await pool.connect();
  let query;
  console.log(tagsArray, isAndMode);
  try {
    if (isAndMode) {
      // Narrow search
      query = {
        text: `
      SELECT t.id, t.date, t.description, c.name AS category_name, g.name AS group_name, ARRAY_AGG(tag.name) AS tags, t.notes
FROM transactions t
JOIN transaction_tags tt ON t.id = tt.transaction_id
JOIN tags tag ON tt.tag_id = tag.id
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN groups g ON t.group_id = g.id
WHERE t.id IN (
    SELECT tt.transaction_id
    FROM transaction_tags tt
    JOIN tags tag ON tt.tag_id = tag.id
    WHERE tag.name = ANY ($1)
    GROUP BY tt.transaction_id
    HAVING ARRAY_AGG(tag.name) @> $1::TEXT[] -- Ensure all input tags are present
)
GROUP BY t.id, t.date, t.description, c.name, g.name, t.notes
ORDER BY t.id;

      `,
        values: [tagsArray], // Inject variables
      };
    }
    // Broader search
    query = {
      text: `
      SELECT t.id, t.date, t.description, c.name AS category_name, g.name AS group_name, ARRAY_AGG(tag.name) AS tags, t.notes
      FROM transactions t
      JOIN transaction_tags tt ON t.id = tt.transaction_id
      JOIN tags tag ON tt.tag_id = tag.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN groups g ON t.group_id = g.id
      WHERE tag.name = ANY ($1)
      GROUP BY t.id, t.date, t.description, c.name, g.name, t.notes
      ORDER BY t.id;
    `,
      values: [tagsArray], // Inject tagsArray
    };

    // Execute the query
    const result = await client.query(query.text, query.values);

    return result.rows;
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
};

// Update a transaction's category
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

module.exports = {
  getTransactionsWithTags,
  getAllCategories,
  getCategoryByName,
  insertCategory,
  updateCategoryName,
  getAllTransactions,
  getTransactionsByCategory,
  getTransactionsByFilters,
  getTransactionsByTags,
  updateTransactionCategory,
};
