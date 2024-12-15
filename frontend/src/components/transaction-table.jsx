import { useEffect, useMemo, useState } from 'react';
import { useTable, usePagination } from 'react-table';
import styles from './TransactionsTable.module.css';

import { fetchTransactions } from '../utils/api';

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(25);

  // console.log(transactions[0]);

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
      initialState: { pageIndex: 0, pageSize },
      manualPagination: false,
    },
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    state: { pageIndex },
    setPageSize: setTablePageSize,
  } = tableInstance;

  const handlePageSizeChange = (e) => {
    const newPageSize = Number(e.target.value);
    setPageSize(newPageSize); // Update local state
    setTablePageSize(newPageSize); // Update React Table's page size
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles['table-container']}>
      <select
        value={pageSize}
        onChange={handlePageSizeChange}
        className={styles['pagination-select']}
      >
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value={200}>200</option>
      </select>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => {
            const headerProps = headerGroup.getHeaderGroupProps();
            return (
              <tr {...headerProps} key={headerProps.key || headerGroup.id}>
                {headerGroup.headers.map((column) => {
                  const columnProps = column.getHeaderProps();
                  return (
                    <th {...columnProps} key={columnProps.key || column.id}>
                      {column.render('Header')}
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>

        <tbody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row);
            const rowProps = row.getRowProps();
            return (
              <tr {...rowProps} key={rowProps.key || row.id}>
                {row.cells.map((cell) => {
                  const cellProps = cell.getCellProps();
                  return (
                    <td {...cellProps} key={cellProps.key || cell.column.id}>
                      {cell.render('Cell')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className={styles['pagination']}>
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>
        </span>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>
      </div>
    </div>
  );
};

export default TransactionsTable;
