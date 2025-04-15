import { useEffect, useMemo, useState } from 'react';
import { useTable, usePagination } from 'react-table';

import Modal from './Modal/Modal';

import {
  fetchTransactions,
  fetchCategories,
  fetchTags,
  getTransactionById,
} from '../../utils/api';

import styles from './TransactionTable.module.css';

const TransactionsTable = () => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTransactions(), fetchCategories(), fetchTags()])
      .then(([transactionsData, categoriesData, tagsData]) => {
        setTransactions(transactionsData);

        // Group categories by their groupName for easier use in the dropdown
        const groupedCategories = categoriesData.reduce((acc, category) => {
          const { groupName, name, id } = category;
          if (!acc[groupName]) acc[groupName] = [];
          acc[groupName].push({ name, id });
          return acc;
        }, {});
        setCategories(groupedCategories);
        setTags(tagsData);
      })
      .catch((err) => console.error('Error fetching data:', err))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // console.log(categories);
  // console.table(tags);

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
        Header: 'Amount',
        accessor: 'amount',
      },
      {
        Header: 'Description',
        accessor: 'description',
      },
      {
        Header: 'Category',
        accessor: 'category_name',
      },
      {
        Header: 'Group',
        accessor: 'group_name',
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

  const refreshTable = async () => {
    try {
      setLoading(true);
      const updatedTransactions = await fetchTransactions();
      setTransactions(updatedTransactions);
    } catch (err) {
      console.error('Error refreshing transactions:', err);
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
        <Modal
          transaction={selectedTransaction}
          categories={categories}
          tags={tags}
          onClose={() => {
            setShowModal(false);
            setSelectedTransaction(null);
          }}
          refreshTable={refreshTable}
        />
      )}
    </div>
  );
};

export default TransactionsTable;
