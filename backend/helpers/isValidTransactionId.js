const isValidTransactionId = (id) => {
  const transactionIdRegex = /^\d{5}(-\d+)?$/; // Regex pattern
  return transactionIdRegex.test(id);
};

module.exports = isValidTransactionId;
