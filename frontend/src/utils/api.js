export async function fetchTransactions() {
  const response = await fetch('http://localhost:5002/api/transactions'); // Replace with your actual API endpoint
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return response.json();
}
