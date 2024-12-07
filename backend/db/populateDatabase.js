const pool = require('./pool');
const csvParser = require('csv-parser');
const fs = require('fs');

const unifiedCSVPath = './db/unified.csv';

const insertGroups = async (transactions, client) => {
  console.log('Inserting groups...');

  const uniqueGroups = new Set(transactions.map((tx) => tx.groupName));
  const groupIdMap = new Map();

  for (const group of uniqueGroups) {
    if (group) {
      try {
        const result = await client.query(
          'INSERT INTO groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name',
          [group]
        );

        const groupId =
          result.rows[0]?.id ||
          (await client.query('SELECT id FROM groups WHERE name = $1', [group]))
            .rows[0].id;

        groupIdMap.set(group, groupId);
      } catch (err) {
        console.error(
          `Error inserting or retrieving group "${group}":`,
          err.message
        );
      }
    }
  }

  console.log('Groups successfully inserted or fetched:', [
    ...groupIdMap.keys(),
  ]);
  return groupIdMap;
};

const insertCategories = async (transactions, groupIdMap, client) => {
  const uniqueCategories = new Set(
    transactions.map((tx) => `${tx.category}:${tx.groupName}`)
  );
  console.log('Unique categories:', [...uniqueCategories]); // Log unique categories

  const categoryIdMap = new Map();

  for (const categoryGroup of uniqueCategories) {
    const [category, group] = categoryGroup.split(':');
    console.log(`Processing category: "${category}" in group: "${group}"`); // Log each category and group

    if (category && group) {
      try {
        const result = await client.query(
          `
          INSERT INTO categories (name, "groupName")
          VALUES ($1, $2)
          ON CONFLICT (name, "groupName") DO NOTHING
          RETURNING id;
          `,
          [category, group]
        );

        const categoryId =
          result.rows[0]?.id ||
          (
            await client.query(
              'SELECT id FROM categories WHERE name = $1 AND "groupName" = $2',
              [category, group]
            )
          ).rows[0]?.id;

        if (categoryId) {
          categoryIdMap.set(category, categoryId);
          console.log(
            `Inserted or fetched category: "${category}" with ID: ${categoryId}`
          );
        } else {
          console.warn(
            `Failed to resolve category: "${category}" in group: "${group}"`
          );
        }
      } catch (err) {
        console.error(
          `Error inserting or retrieving category "${category}" in group "${group}":`,
          err.message
        );
      }
    }
  }

  console.log('Final category ID Map:', [...categoryIdMap.entries()]);
  return categoryIdMap;
};

const insertTags = async (transactions, client) => {
  // Extract unique tags, ensuring no null or undefined values
  const uniqueTags = new Set(
    transactions.flatMap((tx) => (Array.isArray(tx.tags) ? tx.tags : []))
  );
  const tagIdMap = new Map();

  for (const tag of uniqueTags) {
    if (tag) {
      try {
        // Insert tag or fetch its ID if it already exists
        const result = await client.query(
          `
          INSERT INTO tags (name)
          VALUES ($1)
          ON CONFLICT (name) DO NOTHING
          RETURNING id;
          `,
          [tag]
        );

        const tagId =
          result.rows[0]?.id ||
          (await client.query('SELECT id FROM tags WHERE name = $1', [tag]))
            .rows[0].id;

        tagIdMap.set(tag, tagId);
      } catch (err) {
        console.error(
          `Error inserting or retrieving tag "${tag}":`,
          err.message
        );
      }
    }
  }

  console.log('Tags successfully inserted or fetched:', [...tagIdMap.keys()]);
  return tagIdMap;
};

const insertTransactions = async (
  transactions,
  categoryIdMap,
  groupIdMap,
  tagIdMap,
  client
) => {
  console.log('Inserting transactions...');
  console.log(tagIdMap);

  for (const transaction of transactions) {
    try {
      // Resolve category ID
      const categoryId = categoryIdMap.get(transaction.category);
      const groupId = groupIdMap.get(transaction.groupName);

      if (!categoryId || !groupId) {
        console.warn(
          `Skipping transaction due to missing category/group: ${transaction.description}`
        );
        continue; // Skip transactions with missing mappings
      }

      // Insert transaction
      await client.query(
        `
        INSERT INTO transactions (id, date, description, amount, quantity, source, category_id, group_id, notes, link, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING;
        `,
        [
          transaction.id,
          transaction.date,
          transaction.description,
          transaction.amount,
          transaction.quantity || 1, // Default quantity to 1 if undefined
          transaction.source,
          categoryId,
          groupId,
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

  console.log('Transactions successfully inserted.');
  console.log('Category ID Map:', [...categoryIdMap.entries()]);
  console.log('Group ID Map:', [...groupIdMap.entries()]);
};

const populateDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Read CSV Data
    console.log('Starting database population...');
    const transactions = [];
    fs.createReadStream(unifiedCSVPath)
      .pipe(csvParser())
      .on('data', (row) => {
        transactions.push({
          id: row.id,
          date: row.date,
          description: row.description,
          amount: parseFloat(row.amount),
          quantity: row.quantity ? parseInt(row.quantity, 10) : null,
          source: row.source,
          category: row.category,
          groupName: row.groupName,
          tags: row.tags
            ? row.tags.split(',').map((tag) => tag.trim().toLowerCase())
            : [], // Normalize tags
        });
      })
      .on('end', async () => {
        console.log(`Read ${transactions.length} transactions from CSV.`);

        // 2. Insert Data in Sequence
        console.log('Inserting groups...');
        const groupIdMap = await insertGroups(transactions, client);

        console.log('Inserting categories...');
        const categoryIdMap = await insertCategories(
          transactions,
          groupIdMap,
          client
        );

        console.log('Inserting tags...');
        const tagIdMap = await insertTags(transactions, client);

        console.log('Inserting transactions...');
        await insertTransactions(
          transactions,
          categoryIdMap,
          groupIdMap,
          tagIdMap,
          client
        );

        await client.query('COMMIT');
      });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error populating database:', error);
  } finally {
    client.release();
    console.log('Database successfully populated.');
  }
};

populateDatabase();
