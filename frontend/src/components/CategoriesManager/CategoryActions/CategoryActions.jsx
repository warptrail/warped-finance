/* eslint-disable react/prop-types */
import { useState } from 'react';
import CategoryModal from './CategoryModal';
import styles from './CategoryActions.module.css';

const CategoryActions = ({ selectedCategory }) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Open modal and set action
  const openModal = (action) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAction(null);
  };

  if (!selectedCategory) {
    return <p>Please select a category to perform actions.</p>;
  }

  console.log('selected category:', selectedCategory);

  return (
    <div>
      <h3>
        Manage Category: {selectedCategory.category_name}
        {' --- '}[ {selectedCategory.group_name} ]
      </h3>
      <button className={styles.actionButton} onClick={() => openModal('move')}>
        Move to Another Group
      </button>
      <button
        className={styles.actionButton}
        onClick={() => openModal('rename')}
      >
        Rename Category
      </button>
      <button
        className={styles.actionButton}
        onClick={() => openModal('merge')}
      >
        Merge into Another Category
      </button>
      <button
        className={styles.actionButton}
        onClick={() => openModal('delete')}
      >
        Create New Category
      </button>
      <button
        className={styles.actionButton}
        onClick={() => openModal('delete')}
      >
        Delete Category
      </button>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedAction={selectedAction}
        selectedCategory={selectedCategory}
      />
    </div>
  );
};

export default CategoryActions;
