const pool = require('../pool');
//* Get all transactions that have any tags
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
LIMIT 10;
    `
  );
  return result.rows;
};

//* Get transactions by multiple tags either and or or
const getTransactionsByTags = async (tagsArray, mode = 'or') => {
  const client = await pool.connect();

  try {
    const placeholderIndexes = tagsArray.map((_, i) => `$${i + 1}`);
    const filterCondition =
      mode === 'and'
        ? `
        HAVING COUNT(DISTINCT tg.name) = ${tagsArray.length}
      `
        : '';
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
          ARRAY_AGG(DISTINCT tg.name) AS tags
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN groups g ON t.group_id = g.id
      LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      WHERE t.id IN (
          SELECT tt.transaction_id
          FROM transaction_tags tt
          INNER JOIN tags tg ON tt.tag_id = tg.id
          WHERE tg.name = ANY (ARRAY[${placeholderIndexes.join(', ')}])
          GROUP BY tt.transaction_id
          ${filterCondition}
      )
      GROUP BY t.id, c.name, g.name
      ORDER BY t.date DESC;
    `;

    const result = await client.query(queryText, tagsArray);
    return result.rows;
  } catch (err) {
    console.error('Error fetching transactions by tags:', err);
    throw err;
  } finally {
    client.release();
  }
};

// Create a new tag
const createTag = async (tagName) => {
  if (!tagName || typeof tagName !== 'string' || tagName.trim() === '') {
    throw new Error('Invalid tag name');
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `
      INSERT INTO tags (name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name;
      `,
      [tagName.trim()]
    );

    if (result.rows.length === 0) {
      throw new Error(`Tag "${tagName}" already exists`);
    }

    return result.rows[0]; // Return the new tag
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
};

// Fetch all tags
const getAllTags = async () => {
  const query = `SELECT id, name FROM tags ORDER BY name ASC;`;
  const result = await pool.query(query);
  console.log(result);
  return result.rows;
};

const updateTransactionTags = async (transactionId, newTags) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch existing tags for the transaction
    const existingTagsResult = await client.query(
      'SELECT t.name FROM tags t JOIN transaction_tags tt ON t.id = tt.tag_id WHERE tt.transaction_id = $1',
      [transactionId]
    );

    const existingTags = existingTagsResult.rows.map((row) => row.name);

    // Determine tags to add and remove
    const tagsToAdd = newTags.filter((tag) => !existingTags.includes(tag));
    const tagsToRemove = existingTags.filter((tag) => !newTags.includes(tag));

    // Remove tags
    if (tagsToRemove.length > 0) {
      await client.query(
        `
        DELETE FROM transaction_tags
        WHERE transaction_id = $1 AND tag_id IN (
          SELECT id FROM tags WHERE name = ANY($2)
        )
        `,
        [transactionId, tagsToRemove]
      );
    }

    // Add new tags
    for (const tag of tagsToAdd) {
      // Ensure the tag exists in the tags table
      const tagResult = await client.query(
        'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
        [tag]
      );
      const tagId =
        tagResult.rows[0]?.id ||
        (await client.query('SELECT id FROM tags WHERE name = $1', [tag]))
          .rows[0].id;

      // Add the tag to the transaction
      await client.query(
        'INSERT INTO transaction_tags (transaction_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [transactionId, tagId]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getTransactionsWithTags,
  getTransactionsByTags,
  createTag,
  getAllTags,
  updateTransactionTags,
};
