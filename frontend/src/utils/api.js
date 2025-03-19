const BASE_URL = 'http://localhost:5002/api'; // Adjust to your backend API URL

// Fetch all categories
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

export const fetchCategoriesByGroup = async () => {
  try {
    const response = await fetch(
      'http://localhost:5002/api/categories/grouped'
    );
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return await response.json();
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
};

// Fetch a list of available groups
export const fetchGroups = async () => {
  try {
    const response = await fetch(`${BASE_URL}/groups/all`);
    if (!response.ok) {
      throw new Error('Failed to fetch groups');
    }
    console.log('api fetchGroups test', response);
    return await response.json();
  } catch (err) {
    console.error('Error fetching groups', err);
    return [];
  }
};

// Update a category's group
export const updateCategoryGroup = async (categoryId, newGroupId) => {
  try {
    const response = await fetch(`/api/categories/${categoryId}/update-group`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: newGroupId }),
    });

    if (!response.ok) {
      throw new Error('Failed to update category group');
    }

    return await response.json();
  } catch (err) {
    console.error('Error updating category group:', err);
    throw err;
  }
};
