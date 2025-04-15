/* eslint-disable react/prop-types */
import styles from './CategoryActions.module.css';

const CategoryActions = ({
  selectedCategory,
  setActiveModalAction,
  setIsModalOpen,
}) => {
  if (!selectedCategory) {
    return <p>Please select a category to perform actions.</p>;
  }

  const handleActionClick = (action) => {
    setActiveModalAction(action);
    setIsModalOpen(true);
  };

  return (
    <div>
      <h3 className={styles.selectedCategoryH3}>
        Category Name: {selectedCategory.category_name}
      </h3>
      <h3 className={styles.selectedCategoryH3}>
        Category ID: {selectedCategory.category_id}
      </h3>
      <h3 className={styles.selectedCategoryH3}>
        Group Name: {selectedCategory.group_name}
      </h3>
      <h3 className={styles.selectedCategoryH3}>
        Group ID: {selectedCategory.group_id}
      </h3>

      <h3>
        Manage Category: {selectedCategory.category_name}
        {' --- '}[ {selectedCategory.group_name} ]
      </h3>
      <hr></hr>
      <button
        className={styles.actionButton}
        onClick={() => handleActionClick('move')}
      >
        Move to Another Group
      </button>
      <button
        className={styles.actionButton}
        onClick={() => handleActionClick('rename')}
      >
        Rename Category
      </button>
      <button
        className={styles.actionButton}
        onClick={() => handleActionClick('merge')}
      >
        Merge into Another Category
      </button>
      <button
        className={styles.actionButton}
        onClick={() => handleActionClick('create')}
      >
        Create New Category
      </button>
      <button
        className={styles.actionButton}
        onClick={() => handleActionClick('delete')}
      >
        Delete Category
      </button>
    </div>
  );
};

export default CategoryActions;
