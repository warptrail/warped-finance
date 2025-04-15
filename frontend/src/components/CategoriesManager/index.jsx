import { useEffect, useState } from 'react';
import CategoriesList from './CategoriesList/CategoriesList';
import CategoryActions from './CategoryActions/CategoryActions';
import CategoryModal from './CategoryActions/CategoryModal';

import { fetchCategoriesByGroup } from '../../utils/api';
import styles from './index.module.css';

function CategoriesManager() {
  const [groupedCategories, setGroupedCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeModalAction, setActiveModalAction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to call API to get the latest list of categories organized by group
  const refreshCategories = async () => {
    try {
      const data = await fetchCategoriesByGroup();
      setGroupedCategories(data);
    } catch (err) {
      console.error('Error refreshing categories:', err);
    }
  };

  useEffect(() => {
    refreshCategories();
  }, []);

  return (
    <div className={styles.container}>
      <h2>Manage Categories</h2>
      {/* TWO PANELS */}
      <div className={styles.layout}>
        {/* LEFT = Categories List Panel */}
        <div className={styles.listPanel}>
          <h2>Categories List</h2>
          <CategoriesList
            groupedCategories={groupedCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
        {/* RIGHT = Actions Panel */}
        <div className={styles.actionPanel}>
          <h2>Actions</h2>
          <CategoryActions
            selectedCategory={selectedCategory}
            setActiveModalAction={setActiveModalAction}
            setIsModalOpen={setIsModalOpen}
          />
        </div>
      </div>
      {isModalOpen && selectedCategory && (
        <CategoryModal
          isOpen={isModalOpen}
          action={activeModalAction}
          selectedCategory={selectedCategory}
          onClose={() => setIsModalOpen(false)}
          onCategoryUpdated={refreshCategories} // or your refresh logic
        />
      )}
    </div>
  );
}

export default CategoriesManager;
