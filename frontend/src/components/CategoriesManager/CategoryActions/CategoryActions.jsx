/* eslint-disable react/prop-types */
// import React from 'react';
import styles from './CategoryActions.module.css';

const CategoryActions = ({ selectedCategory }) => {
  if (!selectedCategory) {
    return <p>Please select a category to perform actions.</p>;
  }

  return (
    <div>
      <p>
        <strong>Selected Category:</strong> {selectedCategory.name} (
        {selectedCategory.groupName})
      </p>
      <button className={styles.actionButton}>Move to Another Group</button>
      <button className={styles.actionButton}>Rename Category</button>
      <button className={styles.actionButton}>
        Merge into Another Category
      </button>
      <button className={styles.actionButton}>Delete Category</button>
    </div>
  );
};

export default CategoryActions;
