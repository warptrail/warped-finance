/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { useTable, usePagination } from 'react-table';
import { fetchTransactions, getTransactionById } from '../utils/api';
import styles from './transactionsTable.module.css';

const TransactionModal = ({ transaction, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  if (!transaction) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Transaction Details</h2>
        {isEditing ? (
          <div className={styles.modalBody}>
            <label>
              Description:
              <input defaultValue={transaction.description} />
            </label>
            <label>
              Amount:
              <input defaultValue={transaction.amount} type="number" />
            </label>
            <label>
              Notes:
              <input defaultValue={transaction.notes} />
            </label>
            <div className={styles.modalActions}>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
              <button>Save Changes</button>
            </div>
          </div>
        ) : (
          <div className={styles.modalBody}>
            <p>
              <strong>ID:</strong> {transaction.id}
            </p>
            <p>
              <strong>Date:</strong> {transaction.date}
            </p>
            <p>
              <strong>Description:</strong> {transaction.description}
            </p>
            <p>
              <strong>Original Description:</strong>{' '}
              {transaction.original_description}
            </p>
            <p>
              <strong>Amount:</strong> {transaction.amount}
            </p>
            <p>
              <strong>Category:</strong> {transaction.category}
            </p>
            <p>
              <strong>Tags:</strong> {transaction.tags.join(', ')}
            </p>
            <p>
              <strong>Notes:</strong> {transaction.notes}
            </p>
            <p>
              <strong>Source:</strong> {transaction.source}
            </p>
            <button onClick={() => setIsEditing(true)}>Edit</button>
          </div>
        )}
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
};

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions()
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Date',
        accessor: 'date',
      },
      {
        Header: 'Description',
        accessor: 'description',
      },
      {
        Header: 'Category',
        accessor: 'category',
      },
      {
        Header: 'Tags',
        accessor: (row) => (row.tags ? row.tags.join(', ') : ''),
      },
    ],
    []
  );

  const tableInstance = useTable(
    {
      columns,
      data: transactions,
      initialState: { pageIndex: 0, pageSize: 25 },
    },
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    // rows,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    state: { pageIndex, pageSize },
    nextPage,
    gotoPage,
    previousPage,
    setPageSize,
  } = tableInstance;

  const handleRowClick = async (transactionId) => {
    try {
      console.log(transactionId);
      setLoading(true);
      const transaction = await getTransactionById(transactionId);
      console.log(transaction);
      setSelectedTransaction(transaction);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <table {...getTableProps()} className={styles.table}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()} key={column.id}>
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row);
            const transactionId = row.original.id;
            return (
              <tr
                {...row.getRowProps()}
                key={row.id}
                onClick={() => handleRowClick(transactionId)}
                className={styles.row}
              >
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()} key={cell.column.id}>
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className={styles.paginationControls}>
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'} First
        </button>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          Previous
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          Next
        </button>
        <button
          onClick={() => gotoPage(pageOptions.length - 1)}
          disabled={!canNextPage}
        >
          Last {'>>'}
        </button>
        <span>
          Page {pageIndex + 1} of {pageOptions.length}
        </span>
        <label>
          Show
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[25, 50, 100, 200].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          transactions per page
        </label>
      </div>

      {showModal && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
};

export default TransactionsTable;
