const pool = require('../pool');

// Fetch all categories
const getAllCategories = async () => {
  const result = await pool.query('SELECT * FROM categories');
  return result.rows;
};

// Fetch all categories organized by group name
// This returns a flat array of objects organized by group id and then category name
// these next two functions share the same query

const queryCategoriesByGroup = `
  SELECT
    c.id AS category_id,
    c.name as category_name,
    g.id AS group_id,
    g.name AS group_name
  FROM categories c
  JOIN groups g ON c.group_id = g.id
  ORDER BY g.id, c.name;
    `;
const fetchCategoriesByGroup = async () => {
  const query = queryCategoriesByGroup;
  const result = await pool.query(query);
  return result.rows;
};

// This is for structuring the data for the categories manager UI
const getCategoriesGroupedByGroup = async () => {
  const result = await pool.query(queryCategoriesByGroup);
  const rows = result.rows;
  const grouped = {};

  // grouping logic
  for (const row of rows) {
    const { group_id, group_name, category_id, category_name } = row;

    // If this group hasn't bee added to the grouped object yet, initialize it
    if (!grouped[group_id]) {
      grouped[group_id] = {
        group_id,
        group_name,
        categories: [],
      };
    }

    // Push the current category into the corresponding group's categories array
    grouped[group_id].categories.push({
      category_id,
      category_name,
    });
  }

  // Convert the grouped object into an array of group objects
  return Object.values(grouped);
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

// Change the group a category belongs to
const updateCategoryGroup = async (categoryId, newGroupId) => {
  const query = `
  UPDATE categories
  SET group_id = $1
  WHERE id = $2
  RETURNING *
  `;
  const values = [newGroupId, categoryId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  getAllCategories,
  getCategoryByName,
  insertCategory,
  updateCategoryName,
  fetchCategoriesByGroup,
  getCategoriesGroupedByGroup,
  updateCategoryGroup,
};
