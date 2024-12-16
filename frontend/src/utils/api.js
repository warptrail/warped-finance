export async function fetchTransactions() {
  const response = await fetch('http://localhost:5002/api/transactions'); // Replace with your actual API endpoint
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return response.json();
}

export const fetchGroupsAndCategories = async () => {
  const response = await fetch('/api/groups/categories', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch groups and categories');
  }

  return response.json();
};

export const getTransactionById = async (transactionId) => {
  const response = await fetch(
    `http://localhost:5002/api/transactions/id/${transactionId}`
  );
  const text = await response.text(); // Get raw response as text
  console.log('Raw Response:', text);
  return JSON.parse(text); // Then parse
};

// Update transaction
export const updateTransaction = async (transactionId, updates) => {
  const response = await fetch(`/api/transactions/${transactionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update transaction with ID: ${transactionId}`);
  }

  return response.json();
};
