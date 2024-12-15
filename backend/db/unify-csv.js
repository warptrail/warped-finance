const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { writeToPath } = require('fast-csv');

// Paths to input file and the unified output file
const mintFile = 'db/original-csv/mint/mint_transactions.csv';
const everyDollarFolderPath = './db/original-csv/everydollar';
const outputFilePath = './db/unified.csv';
const overlappingFilePath = './db/overlappingCategories.json';

// Unified CSV headers
const unifiedHeaders = [
  'id',
  'parent_id',
  'date',
  'description',
  'original_description',
  'amount',
  'category',
  'groupName',
  'is_split',
  'account_name',
  'notes',
  'tags',
  'source',
  'quantity',
  'link',
  'location',
];

// Load overlapping categories
const overlappingCategories = JSON.parse(
  fs.readFileSync(overlappingFilePath, 'utf-8')
);

// Create a mapping for category normalization
const categoryToGroupMap = new Map(
  overlappingCategories.map((item) => [item.category, item.group])
);

const normalizeText = (text) =>
  typeof text === 'string'
    ? text.trim().toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ')
    : '';

// Helper function to process Mint files
const processMintFile = (filePath) =>
  new Promise((resolve) => {
    const transactions = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        const amount =
          row['Transaction Type'] === 'credit'
            ? parseFloat(row.Amount)
            : -parseFloat(row.Amount);

        transactions.push({
          id: null, // Unique ID will be generated later
          parent_id: null,
          date: new Date(row.Date),
          description: normalizeText(row.Description),
          original_description: row['Original Description'] || null,
          amount,
          category: normalizeText(row.Category),
          groupName:
            categoryToGroupMap.get(normalizeText(row.Category)) || 'ungrouped',
          is_split: false,
          account_name: row['Account Name'],
          notes: row.Notes,
          tags: [row.Labels],
          source: 'Mint',
          quantity: null,
          link: null,
          location: null,
        });
      })
      .on('end', () => resolve(transactions));
  });

// Helper function to process EveryDollar files
const processEveryDollarFiles = () =>
  new Promise((resolve, reject) => {
    const everyDollarData = [];
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
          everyDollarData.push({
            id: null, // Unique ID will be generated later
            parent_id: null,
            date: new Date(row.date),
            description: normalizeText(row.merchant),
            original_description: null, // EveryDollar does not have this data
            amount: parseFloat(row.amount),
            category: normalizeText(row.item),
            groupName: normalizeText(row.group),
            is_split: false,
            account_name: null,
            notes: null, // EveryDollar does not have this data
            tags: [], // EveryDollar does not have this data
            source: 'EveryDollar',
            quantity: null,
            link: null,
            location: null,
          });
        })
        .on('end', () => {
          filesProcessed++;
          if (filesProcessed === files.length) {
            console.log('EveryDollar categories processed.');
            resolve(everyDollarData);
          }
        })
        .on('error', (err) => {
          console.error(`Error processing EveryDollar file ${file}, err`);
          reject(err);
        });
    });
  });

// Main function to unify CSV files
const unifyCsvFiles = async () => {
  try {
    const allTransactions = [];
    // Process Mint file
    const mintTransactions = await processMintFile(mintFile);
    allTransactions.push(...mintTransactions);

    // Process EveryDollar files
    const everyDollarTransactions = await processEveryDollarFiles();
    allTransactions.push(...everyDollarTransactions);

    // Filter out empty rows or rows missing critical fields
    const filteredTransactions = allTransactions.filter((row) => {
      return (
        row.category &&
        row.groupName &&
        Object.values(row).some((value) => value && String(value).trim() !== '')
      );
    });

    console.log('Filtered Transactions:', filteredTransactions);

    // Sort transactions by date (most recent first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Add unique IDs to transactions
    filteredTransactions.forEach((transaction, index) => {
      const zeroPad = (num, places) => String(num).padStart(places, '0');
      transaction.id = zeroPad(filteredTransactions.length - index, 5);
      transaction.date = transaction.date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
    });

    // Write to unified CSV
    writeToPath(outputFilePath, filteredTransactions, {
      headers: unifiedHeaders,
    })
      .on('finish', () =>
        console.log(`Unified CSV written to ${outputFilePath}`)
      )
      .on('error', (err) => console.error('Error writing CSV:', err));
  } catch (err) {
    console.error('Error processing files:', err);
  }
};

// Run the script
unifyCsvFiles();

// Test the headers
function testHeaders() {
  fs.createReadStream(everyDollarFiles[0])
    .pipe(
      csvParser({
        mapHeaders: ({ header }) => {
          console.log(`Original Header: ${header}`);
          // Remove BOM, quotes, and trim spaces
          return header
            .replace(/^\uFEFF/, '')
            .replace(/"/g, '')
            .trim();
        },
      })
    )
    .on('headers', (headers) => {
      console.log('normalized Headers', headers); // Log all detected headers
    })
    .on('data', (row) => {
      console.log('Parsed Row:', row);
    })
    .on('end', () => {
      console.log('Finished processing file');
    });
}
