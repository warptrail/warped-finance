/* eslint-disable react/prop-types */
// import React from 'react';
import styles from './CategoriesList.module.css';

const CategoriesList = ({ selectedCategory, onSelectCategory }) => {
  // Temporary placeholder categories
  const categories = [
    { id: 1, name: 'Groceries', groupName: 'Food' },
    { id: 2, name: 'Rent', groupName: 'Bills' },
    { id: 3, name: 'Subscriptions', groupName: 'Entertainment' },
    { id: 4, name: 'Gas', groupName: 'Transportation' },
  ];

  return (
    <ul className={styles.list}>
      {categories.map((category) => (
        <li
          key={category.id}
          className={`${styles.item} ${
            selectedCategory?.id === category.id ? styles.selected : ''
          }`}
          onClick={() => onSelectCategory(category)}
        >
          <strong>{category.name}</strong> - {category.groupName}
        </li>
      ))}
    </ul>
  );
};

export default CategoriesList;
