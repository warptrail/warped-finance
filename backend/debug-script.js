const isValidTransactionId = (id) => {
  const transactionIdRegex = /^\d{5}(-\d+)?$/; // Regex pattern
  return transactionIdRegex.test(id);
};

// Test cases
const testCases = ['90210', '90210-1', '90-210', '902A0', '00001', '90210-12'];

testCases.forEach((testCase) => {
  console.log(`ID: ${testCase}, Valid: ${isValidTransactionId(testCase)}`);
});
