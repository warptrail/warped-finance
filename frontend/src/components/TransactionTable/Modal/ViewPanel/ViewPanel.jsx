/* eslint-disable react/prop-types */
// import styles from './ViewPanel.module.css';
import parentStyles from '../Modal.module.css';

function ViewPanel({ transaction }) {
  console.log('view panel transaction', transaction);
  return (
    <div className={parentStyles.modalBody}>
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
        <strong>Amount:</strong> {transaction.amount}
      </p>
      <p>
        <strong>Category:</strong>{' '}
        {transaction.category_name || 'Uncategorized'}
      </p>
      <p>
        <strong>Group:</strong> {transaction.group_name || 'Ungrouped'}
      </p>
      <p>
        <strong>Tags:</strong>{' '}
        {transaction.tags ? transaction.tags.join(', ') : 'None'}
      </p>
      <p>
        <strong>Notes:</strong> {transaction.notes || 'No notes available'}
      </p>
      <p>
        <strong>Quantity:</strong> {transaction.quantity || 'N/A'}
      </p>
      <p>
        <strong>Location:</strong> {transaction.location || 'Unknown'}
      </p>
      <p>
        <strong>Link:</strong>{' '}
        {transaction.link ? (
          <a href={transaction.link} target="_blank" rel="noopener noreferrer">
            View Receipt
          </a>
        ) : (
          'No link available'
        )}
      </p>
    </div>
  );
}

export default ViewPanel;
