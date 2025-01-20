const BASE_URL = 'http://localhost:5002/api'; // Adjust to your backend API URL

// Fetch all categories from the backend
export const fetchCategories = async () => {
  try {
    const response = await fetch(`${BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const categories = await response.json();
    return categories; // Ensure this is an array of category objects
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const fetchTransactions = async () => {
  const response = await fetch(`${BASE_URL}/transactions`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  const data = await response.json();
  // console.log('fetchTransactions Response:', data);
  return data;
};

export const getTransactionById = async (transactionId) => {
  const response = await fetch(`${BASE_URL}/transactions/id/${transactionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transaction with ID: ${transactionId}`);
  }
  return response.json();
};

// Fetch all tags from the backend
export const fetchTags = async () => {
  try {
    const response = await fetch(`${BASE_URL}/tags`);
    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }
    const tags = await response.json();
    return tags; // Ensure this is an array of tag objects
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// Update a transaction with edited data
export const updateTransactionOld = async (transaction) => {
  try {
    const response = await fetch(
      `${BASE_URL}/transactions/id/${transaction.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      }
    );
    if (!response.ok) {
      throw new Error('Failed to update transaction');
    }
    const updatedTransaction = await response.json();
    return updatedTransaction;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (transactionId, updatedFields) => {
  try {
    const response = await fetch(
      `${BASE_URL}/transactions/id/${transactionId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields),
      }
    );

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to update transaction: ${errorMessage}`);
    }

    const updatedTransaction = await response.json();
    return updatedTransaction;
  } catch (err) {
    console.error('Error updating transaction:', err);
    throw err;
  }
};

export const updateTransactionTags = async (transactionId, tags) => {
  const response = await fetch(
    `${BASE_URL}/tags/per-transaction/${transactionId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update tags');
  }

  return await response.json();
};

/* 
Logic
*/
