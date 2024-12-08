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

module.exports = { getAllGroups };
