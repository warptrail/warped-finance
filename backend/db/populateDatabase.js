const pool = require('./pool');
const csvParser = require('csv-parser');
const fs = require('fs');

const UNIFIED_SOURCE_CSV = './db/unified.csv';

// * Turn the CSV file into an array of JavaScript Objects
const readCSV = async (filePath) => {
  return new Promise((resolve, reject) => {
    const transactions = []; // Array to store transaction objects

    // Read CSV file and process each row
    fs.createReadStream(filePath)
      .pipe(csvParser()) // Parse CSV into JavaScript objects
      .on('data', (row) => {
        // Process each row and add to the array
        transactions.push({
          id: row.id,
          date: row.date,
          description: row.description,
          original_description: row.original_description,
          amount: parseFloat(row.amount), // Convert amount to a number
          quantity: row.quantity ? parseInt(row.quantity, 10) : 1, // Default to 1
          source: row.source,
          category_name: row.category_name?.toLowerCase().trim() || null, // Ensure consistency
          group_name: row.group_name?.toLowerCase().trim() || null,
          account_name: row.account_name?.toLowerCase().trim() || null,
          tags: row.tags
            ? row.tags.split(',').map((tag) => tag.toLowerCase().trim()) // Split and clean tags
            : [],
          notes: row.notes || null,
          link: row.link || null,
          location: row.location || null,
        });
      })
      .on('end', () => resolve(transactions)) // When done, resolve the Promise
      .on('error', (err) => reject(err)); // Handle errors
  });
};

// * Insert unique groups from the transactions array into the database
const insertGroups = async (transactions, client) => {
  console.log('Inserting groups...');
  const uniqueGroups = new Set(transactions.map((tx) => tx.group_name));
  const groupIdMap = new Map();

  for (const group of uniqueGroups) {
    if (group) {
      const result = await client.query(
        'INSERT INTO groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id;',
        [group]
      );

      // Retrieve the group_id
      const groupId =
        result.rows[0]?.id ||
        (await client.query('SELECT id FROM groups WHERE name = $1', [group]))
          .rows[0].id;

      groupIdMap.set(group, groupId);
    }
  }
  console.log('Groups successfully inserted:', [...groupIdMap.keys()]);
  return groupIdMap;
};

const insertCategories = async (transactions, groupIdMap, client) => {
  console.log('Inserting categories...');

  // Step 1: Extract unique categories and their associated group names
  const uniqueCategories = new Set(
    transactions.map((tx) => `${tx.category_name}:${tx.group_name}`)
  );

  // This map will store the category name as key and its id as value
  const categoryIdMap = new Map();

  // Step 2: Loop through the unique category-group combinations.
  for (const categoryGroup of uniqueCategories) {
    const [categoryName, groupName] = categoryGroup.split(':');
    try {
      // Step 3 Resolve the group_id using groupIdMap
      const groupId = groupIdMap.get(groupName);

      if (!groupId) {
        console.warn(
          `Skipping category "${categoryName}" due to missing group "${groupName}"`
        );
        continue; // Skip if the group doesn't exist
      }

      // Step 4: Check if the category already exists in the database and insert if not.
      const result = await client.query(
        `INSERT INTO categories (name, group_id)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
        RETURNING id;`,
        [categoryName, groupId]
      );

      // Step 5: Retrieve the category_id (newly inserted or pre-existing)
      const categoryId =
        result.rows[0]?.id ||
        (
          await client.query('SELECT id FROM categories WHERE name = $1', [
            categoryName,
          ])
        ).rows[0].id;
      // Step 6: Store the category and its id in the map.
      categoryIdMap.set(categoryName, categoryId);
    } catch (err) {
      console.error(
        `Error inserting or retrieving category "${categoryName}" in group "${groupName}":`,
        err.message
      );
    }
  }
  console.log('Categories successfully inserted or fetched:', [
    ...categoryIdMap.keys(),
  ]);
  return categoryIdMap; // Return the map of category names to their IDS
};

const insertTags = async (transactions, client) => {
  console.log('Inserting tags...');

  // Step 1: Extract unique tags from transactions
  const uniqueTags = new Set(
    transactions.flatMap((tx) => tx.tags) // Collect all tags and flatten the arrays
  );
  const tagIdMap = new Map();

  // Step 2 Insert tags into the tags table
  for (const tag of uniqueTags) {
    if (tag) {
      const result = await client.query(
        `INSERT INTO tags (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING
        RETURNING id;
        `,
        [tag]
      );
      // Retrieve the tag ID, even if it was previously inserted
      const tagId =
        result.rows[0]?.id ||
        (await client.query('SELECT id FROM tags WHERE name = $1', [tag]))
          .rows[0].id;

      //
      tagIdMap.set(tag, tagId);
    }
  }

  console.log('Tags successfully inserted:', [...tagIdMap.keys()]);
  return tagIdMap; // Return the map for linking tags to transactions
};

const insertTransactions = async (transactions, categoryIdMap, client) => {
  console.log('Inserting transactions...');
  for (const transaction of transactions) {
    try {
      // 1. Resolve category ID using categoryIdMap
      const categoryId = categoryIdMap.get(transaction.category_name);

      // 2. Skip transactions if the category is invalid or missing
      if (!categoryId) {
        console.warn(
          `Skipping transaction due to missing category mapping: ${transaction.description}`
        );
        continue;
      }

      // 3. Insert transaction into database
      await client.query(
        `
        INSERT INTO transactions (
          id, date, description, original_description, amount, quantity, source, category_id, account_name, notes, link, location
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING;
        `,
        [
          transaction.id,
          transaction.date,
          transaction.description,
          transaction.original_description,
          transaction.amount,
          transaction.quantity || 1, // Default quantity to 1 if undefined
          transaction.source,
          categoryId, // Use the resolved category_id
          transaction.account_name,
          transaction.notes,
          transaction.link,
          transaction.location,
        ]
      );
    } catch (err) {
      console.error(
        `Error inserting transaction "${transaction.description}":`,
        err.message
      );
    }
  }
};

const insertTransactionTags = async (transactions, tagIdMap, client) => {
  console.log('Inserting transaction tags...');

  const transactionTagPairs = [];

  // Step 1: Prepare the pairs of (transaction_id, tag_id)
  for (const transaction of transactions) {
    const transactionId = transaction.id;
    const tags = transaction.tags;

    for (const tag of tags) {
      const tagId = tagIdMap.get(tag);

      // Only push if the tag exists in the database
      if (tagId) {
        transactionTagPairs.push([transactionId, tagId]);
      } else {
        console.warn(
          `Skipping tag "${tag}" for transaction " ${transactionId}" because `
        );
      }
    }
  }

  // Step 2: If no pairs, there's nothing to insert
  if (transactionTagPairs.length === 0) {
    console.log('No transaction tags to insert');
    return;
  }

  // Step 3 - Dynamically generate the SQL query using placeholders
  const queryText = `
        INSERT INTO transaction_tags (transaction_id, tag_id)
    VALUES ${transactionTagPairs
      .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
      .join(', ')}
    ON CONFLICT DO NOTHING;
  `;

  // Flatten the array for parameterized insertion (e.g., [transaction1, tag1, transaction2, tag2, ...])
  const queryValues = transactionTagPairs.flat();

  try {
    // Step 4: Execute the insertion
    await client.query(queryText, queryValues);
    console.log(
      `Successfully inserted ${transactionTagPairs.length} transaction tags.`
    );
  } catch (err) {
    console.error('Error inserting transaction tags:', err.message);
  }
};

const main = async () => {
  // 1. Connect to database
  const client = await pool.connect(); // Connect once to the database

  try {
    // 2. Start a transaction
    await client.query('BEGIN');
    console.log('Connected to the database');

    // 3 Read the CSV
    const transactions = await readCSV(UNIFIED_SOURCE_CSV);
    console.log(`Read ${transactions.length} transactions from CSV.`);

    // 4 Insert Data in Sequence
    groupIdMap = await insertGroups(transactions, client);
    const categoryIdMap = await insertCategories(
      transactions,
      groupIdMap,
      client
    );
    const tagIdMap = await insertTags(transactions, client);
    await insertTransactions(transactions, categoryIdMap, client);
    await insertTransactionTags(transactions, tagIdMap, client);

    // 5. Commit all changes if successful
    await client.query('COMMIT');
    console.log('Database successfully populated.');
    console.log(groupIdMap);
    console.log(categoryIdMap);
    console.log(tagIdMap);
  } catch (err) {
    // 6️ Roll back changes if any error occurs
    await client.query('ROLLBACK');
    console.error('Error populating the database:', err);
  } finally {
    // 7. Release client from connection
    client.release();
    console.log('Disconnected from the database');
  }
};

main();
