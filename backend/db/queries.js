const pool = require('./pool');

//* Get all transactions with optional filters
const getTransactions = async ({ category, tag, startDate, endDate }) => {
  const filters = [];
  const values = [];

  if (category) {
    filters.push('c.name = $' + (filters.length + 1));
    values.push(category);
  }
  if (tag) {
    filters.push('$' + (filters.length + 1) + ' = ANY(t.tags)');
    values.push(tag);
  }
  if (startDate) {
    filters.push('t.date >= $' + (filters.length + 1));
    values.push(startDate);
  }
  if (endDate) {
    filters.push('t.date <= $' + (filters.length + 1));
    values.push(endDate);
  }

  const query = `
    SELECT t.id, t.date, t.description, c.name AS category_name, g.name AS group_name, t.source
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    JOIN groups g ON t.group_id = g.id
    ${filters.length ? 'WHERE ' + filters.join(' AND ') : ''}
  `;

  const { rows } = await pool.query(query, values);
  return rows;
};

//*  Update a transaction's category and tags
const updateTransaction = async (id, { category, tags }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // update category and get its group
    let groupId = null;
    if (category) {
      const res = await client.query(
        `SELECT id, "groupName" FROM categories WHERE name = $1`,
        [category]
      );
      if (res.rows.length === 0) {
        throw new Error(`Category ${category} not found`);
      }
      groupId = res.rows[0].id;
    }

    // Update the transaction
    await client.query(
      `
      UPDATE transactions
      SET category_id = COALESCE($1, category_id),
          group_id = COALESCE($2, group_id),
          tags = COALESCE($3, tags)
      WHERE id = $4
      `,
      [groupId, groupId, tags, id]
    );
    await client.query('COMMIT');
    return { id, category, tags };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// * Update the category
const updateCategory = async (name, newGroupName) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update the category's group
    const res = await client.query(
      `UPDATE categories SET "groupName" = $1 WHERE name = $2 RETURNING id, name, "groupName"`,
      [newGroupName, name]
    );

    if (res.rows.length === 0) {
      throw new Error(`Category ${name} not found`);
    }

    // Update all transactions with this category to the new group
    const categoryId = res.rows[0].id;
    await client.query(
      `UPDATE transactions SET group_id = (SELECT id FROM groups WHERE name = $1) WHERE category_id = $2`,
      [newGroupName, categoryId]
    );

    await client.query('COMMIT');
    return res.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getTransactions, updateTransaction, updateCategory };
