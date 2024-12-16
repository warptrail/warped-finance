const pool = require('../pool');

const getAllGroups = async () => {
  try {
    const result = await pool.query('SELECT * FROM groups ORDER BY id;');
    return result.rows;
  } catch (err) {
    console.error('Error fetching groups:', err);
    throw err;
  }
};

// Fetch groups and categories
const getGroupsAndCategories = async () => {
  const query = `
  SELECT g.name AS group_name, 
  JSON_AGG(c.name) AS categories
  FROM groups g
  LEFT JOIN categories c ON g.name = c."groupName"
  GROUP BY g.name
  ORDER BY g.name;
`;

  const result = await pool.query(query);
  return result.rows;
};

module.exports = { getAllGroups, getGroupsAndCategories };
