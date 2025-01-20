/* eslint-disable react/prop-types */
import { useState } from 'react';
import styles from './Modal.module.css';
import ViewPanel from './ViewPanel/ViewPanel';
import EditPanel from './EditPanel/EditPanel';

const Modal = ({ transaction, categories, tags, onClose, refreshTable }) => {
  const [editMode, setEditMode] = useState(false);

  if (!transaction) return null;

  const toggleEditMode = () => {
    setEditMode((previousMode) => !previousMode);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{editMode ? 'Edit ' : ''}Transaction Details</h2>
        {editMode ? (
          <EditPanel
            transaction={transaction}
            categories={categories}
            tags={tags}
            onClose={onClose}
            refreshTable={refreshTable}
          />
        ) : (
          <ViewPanel transaction={transaction} />
        )}

        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
        <button
          onClick={() => {
            toggleEditMode();
            console.log('is this edit mode?', editMode);
          }}
          className={styles.editButton}
        >
          {editMode ? 'Switch to View Mode' : 'Switch to Edit Mode'}
        </button>
      </div>
    </div>
  );
};

export default Modal;
