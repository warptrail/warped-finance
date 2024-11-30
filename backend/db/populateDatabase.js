const fs = require('fs');
const csvParser = require('csv-parser');

// Database connection setup
const pool = require('./pool');

// Path to the unified CSV file
const unifiedFilePath = './db/unified.csv';

// Normalize text to handle inconsistencies
const normalizeText = (text) =>
  typeof text === 'string'
    ? text.trim().toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ')
    : '';

// Function to insert unique groups
const insertGroups = async (groups) => {
  const client = await pool.connect();
  const groupIdMap = new Map();
  try {
    await client.query('BEGIN');

    for (const group of groups) {
      const normalizedGroup = normalizeText(group); // Normalize group name
      const res = await client.query(
        `
        INSERT INTO groups (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING
        RETURNING id, name;
        `,
        [normalizedGroup]
      );

      if (res.rows.length > 0) {
        groupIdMap.set(normalizedGroup, res.rows[0].id);
        // console.log(
        //   `Inserted group: "${normalizedGroup}" with ID: ${res.rows[0].id}`
        // );
      } else {
        const existing = await client.query(
          `SELECT id FROM groups WHERE name = $1`,
          [normalizedGroup]
        );
        if (existing.rows.length > 0) {
          groupIdMap.set(normalizedGroup, existing.rows[0].id);
          // console.log(
          //   `Existing group: "${normalizedGroup}" with ID: ${existing.rows[0].id}`
          // );
        } else {
          console.error(`Failed to find or create group: "${normalizedGroup}"`);
        }
      }
    }

    // console.log('Final Group ID Map:', Array.from(groupIdMap.entries()));

    // Ensure "ungrouped" is in the map
    if (!groupIdMap.has('ungrouped')) {
      const res = await client.query(
        `SELECT id FROM groups WHERE name = 'ungrouped';`
      );
      if (res.rows.length > 0) {
        groupIdMap.set('ungrouped', res.rows[0].id);
        // console.log(
        //   `Manually added "ungrouped" to Group ID Map with ID: ${res.rows[0].id}`
        // );
      } else {
        console.error(`"Ungrouped" is missing from the database.`);
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return groupIdMap;
};

// Function to insert unique categories
const insertCategories = async (categories, groupIdMap) => {
  const client = await pool.connect();
  const categoryIdMap = new Map();
  try {
    await client.query('BEGIN');

    for (const [categoryName, groupName] of categories.entries()) {
      const normalizedGroupName = normalizeText(groupName);
      const groupId = groupIdMap.get(normalizedGroupName) || null;

      // console.log(
      //   `Processing category: "${categoryName}" with groupName: "${normalizedGroupName}"`
      // );
      // console.log(`Resolved group ID for "${normalizedGroupName}":`, groupId);

      if (!groupId) {
        console.error(
          `Group "${normalizedGroupName}" not found for category "${categoryName}". Skipping.`
        );
        continue; // Skip categories without valid group IDs
      }

      const res = await client.query(
        `
        INSERT INTO categories (name, "groupName")
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
        RETURNING id, name;
        `,
        [categoryName, normalizedGroupName]
      );

      if (res.rows.length > 0) {
        categoryIdMap.set(categoryName, res.rows[0].id);
        // console.log(
        //   `Inserted category: "${categoryName}" with ID: ${res.rows[0].id}`
        // );
      } else {
        const existing = await client.query(
          `SELECT id FROM categories WHERE name = $1`,
          [categoryName]
        );
        if (existing.rows.length > 0) {
          categoryIdMap.set(categoryName, existing.rows[0].id);
          // console.log(
          //   `Existing category: "${categoryName}" with ID: ${existing.rows[0].id}`
          // );
        } else {
          console.error(`Failed to resolve category: "${categoryName}"`);
        }
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return categoryIdMap;
};

// Function to insert transactions
const insertTransactions = async (transactions, categoryIdMap, groupIdMap) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const transaction of transactions) {
      const groupId =
        groupIdMap.get(normalizeText(transaction.groupName)) || null;
      const categoryId =
        categoryIdMap.get(normalizeText(transaction.category)) || null;

      if (!categoryId || !groupId) {
        console.error(`Skipping transaction due to missing IDs:`, transaction);
        continue;
      }

      const amount = parseFloat(transaction.amount) || 0; // Ensure amount is numeric
      // console.log(amount);
      const quantity = parseFloat(transaction.quantity) || null;
      const parentId = transaction.parent_id ? transaction.parent_id : null;

      console.log('transaction time:', transaction);

      await client.query(
        `
        INSERT INTO transactions (
          id, parent_id, date, description, amount, category_id, group_id, 
          is_split, account_name, notes, tags, source, quantity, link, location
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);
        `,
        [
          transaction.id,
          parentId,
          transaction.date,
          transaction.description,
          amount,
          categoryId,
          groupId,
          transaction.is_split,
          transaction.account_name,
          transaction.notes,
          transaction.tags,
          transaction.source,
          quantity,
          transaction.link,
          transaction.location,
        ]
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

// Main function to process and populate the database
const populateDatabase = async () => {
  const groups = new Set();
  const categories = new Map();
  const transactions = [];

  try {
    // Parse unified CSV file
    fs.createReadStream(unifiedFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        const normalizedCategory = normalizeText(row.category);
        const normalizedGroupName = normalizeText(row.groupName);

        // Add groupName to the set of unique groups
        groups.add(normalizedGroupName);

        // Add category to the map
        if (!categories.has(normalizedCategory)) {
          categories.set(normalizedCategory, normalizedGroupName);
        }

        transactions.push(row); // Collect all transactions
        // console.log(transactions[43]);
      })
      .on('end', async () => {
        // console.log('Extracted Groups:', Array.from(groups));
        // console.log(
        //   'Extracted Categories Map:',
        //   Array.from(categories.entries())
        // );

        // Insert unique groups
        const groupIdMap = await insertGroups(Array.from(groups));

        // Insert unique categories
        const categoryIdMap = await insertCategories(categories, groupIdMap);

        // Insert transactions
        await insertTransactions(transactions, categoryIdMap, groupIdMap);

        console.log('Database populated successfully!');
      })
      .on('error', (err) => {
        console.error('Error reading unified CSV file:', err);
      });
  } catch (err) {
    console.error('Error populating database:', err);
  }
};

// Run the script
populateDatabase();
