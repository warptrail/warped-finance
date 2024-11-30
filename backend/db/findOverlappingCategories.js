const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

// File paths for Mint and EveryDollar CSVs
const mintFilePath = 'db/original-csv/mint/mint_transactions.csv';
const everyDollarFolderPath = 'db/original-csv/everydollar'; // Folder containing multiple EveryDollar files

const mintCategories = new Set();
const everyDollarCategories = new Map(); // Map category -> group
const overlappingCategories = [];

// Read Mint categories
const processMintFile = () =>
  new Promise((resolve) => {
    fs.createReadStream(mintFilePath)
      .pipe(
        csvParser({
          mapHeaders: ({ header }) =>
            header.trim().toLowerCase().replace(/\s+/g, '_').replace(/"/g, ''), // Normalize headers
        })
      )
      .on('data', (row) => {
        console.log('Mint Row:', row); // Log raw Mint rows
        if (row.category) {
          mintCategories.add(normalizeCategory(row.category));
        }
      })
      .on('end', () => {
        console.log('Mint categories processed.');
        resolve();
      });
  });

// Read all EveryDollar files and collect categories and groups
const processEveryDollarFiles = () =>
  new Promise((resolve) => {
    const files = fs
      .readdirSync(everyDollarFolderPath)
      .filter((file) => file.endsWith('.csv'));

    let filesProcessed = 0;
    files.forEach((file) => {
      fs.createReadStream(path.join(everyDollarFolderPath, file))
        .pipe(
          csvParser({
            mapHeaders: ({ header }) =>
              header
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/"/g, ''), // Normalize headers
          })
        )
        .on('data', (row) => {
          console.log('EveryDollar Row:', row); // Log raw EveryDollar rows
          const item = row.item ? row.item.trim().toLowerCase() : null;
          const group = row.group ? row.group.trim() : null;

          console.log(`Parsed Item: "${item}", Group: "${group}"`); // Log parsed fields
          if (row.item && row.group) {
            everyDollarCategories.set(
              normalizeCategory(row.item),
              normalizeCategory(row.group)
            );
          }
        })
        .on('end', () => {
          filesProcessed++;
          if (filesProcessed === files.length) {
            console.log('EveryDollar categories processed.');
            resolve();
          }
        });
    });
  });

// Function to normalize categories
const normalizeCategory = (category) =>
  category
    .trim() // Remove leading and trailing spaces
    .toLowerCase() // Convert to lowercase
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\s+/g, ' '); // Collapse multiple spaces into one

// Find overlapping categories
const findOverlaps = () => {
  mintCategories.forEach((category) => {
    if (everyDollarCategories.has(category)) {
      overlappingCategories.push({
        category,
        group: everyDollarCategories.get(category),
      });
    }
  });
  console.log('MINT: ', mintCategories);
  console.log('EVERYDOLLAR: ', everyDollarCategories);
  console.log('Mint Categories Set:', Array.from(mintCategories));
  console.log(
    'EveryDollar Categories Map Keys:',
    Array.from(everyDollarCategories.keys())
  );

  console.log('Overlapping Categories:', overlappingCategories);
  console.log(
    'Number of Overlapping Categories:',
    overlappingCategories.length
  );
};

// Main function
(async () => {
  await Promise.all([processMintFile(), processEveryDollarFiles()]);
  findOverlaps();

  // Write overlapping categories to a JSON file
  fs.writeFileSync(
    './overlappingCategories.json',
    JSON.stringify(overlappingCategories, null, 2),
    'utf-8'
  );
})();
