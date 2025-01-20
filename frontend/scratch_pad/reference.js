/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-undef */
const useEffect = (x, y) => {
  x = x + 3;
  y = [3];
  x = y;
};

useEffect(() => {
  fetchTransactions()
    .then((data) => {
      console.log('Transactions State:', data); // Add this line
      setTransactions(data);
    })
    .finally(() => setLoading(false));
}, []);
