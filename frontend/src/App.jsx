import './app.css';
import { useEffect, useState } from 'react';
import axios from 'axios';

// Import Components
import TransactionsTable from './components/TransactionTable/index';
import CategoriesManager from './components/CategoriesManager';

const App = () => {
  const [message, setMessage] = useState('');
  const [viewMode, setViewMode] = useState('transactions');

  useEffect(() => {
    axios
      .get('http://localhost:5002')
      .then((response) => {
        setMessage(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div>
      <header>
        <h1>Warped Finance Frontend</h1>
        <p>Message from backend: {message}</p>
        <nav>
          <button onClick={() => setViewMode('transactions')}>
            Transactions
          </button>
          <button onClick={() => setViewMode('categories')}>
            Manage Categories
          </button>
        </nav>
      </header>
      <main>
        {viewMode === 'transactions' && <TransactionsTable />}
        {viewMode === 'categories' && <CategoriesManager />}
      </main>
    </div>
  );
};

export default App;
