import './app.css';
import { useEffect, useState } from 'react';
import axios from 'axios';

// Import Components
import TransactionsTable from './components/transaction-table';

const App = () => {
  const [message, setMessage] = useState('');

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
      <h1>Warped Finance Frontend</h1>
      <p>Message from backend: {message}</p>
      <TransactionsTable />
    </div>
  );
};

export default App;
