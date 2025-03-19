import { useState } from 'react';
import CategoriesList from './CategoriesList/CategoriesList';
import CategoryActions from './CategoryActions/CategoryActions';

import styles from './index.module.css';

function CategoriesManager() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  console.log(
    'this is the selected Category from State in the categoriesManager index.jsx file::::',
    selectedCategory
  );

  return (
    <div className={styles.container}>
      <h2>Manage Categories</h2>
      <div className={styles.layout}>
        {/* Categories List Panel */}
        <div className={styles.listPanel}>
          <h3>Categories List</h3>
          <CategoriesList
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
        {/* Actions Panel */}
        <div className={styles.actionPanel}>
          <h3>Actions</h3>
          <CategoryActions selectedCategory={selectedCategory} />
        </div>
      </div>
    </div>
  );
}

export default CategoriesManager;
