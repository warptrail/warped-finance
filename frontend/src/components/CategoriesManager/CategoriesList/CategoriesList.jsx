/* eslint-disable react/prop-types */
import styles from './CategoriesList.module.css';

const groupColors = [
  '#cce5ff',
  '#d4edda',
  '#fff3cd',
  '#f8d7da',
  '#e2e3e5',
  '#d1ecf1',
  '#f5c6cb',
  '#c3e6cb',
  '#bee5eb',
  '#f8f9fa',
  '#d6d8d9',
  '#fefefe',
];

const buildNormalizedCategory = (group, category) => {
  return {
    category_id: category.category_id,
    category_name: category.category_name,
    group_id: group.group_id,
    group_name: group.group_name,
  };
};

const CategoriesList = ({
  groupedCategories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className={styles.listPanel}>
      {groupedCategories.map((group, groupIndex) => (
        <div key={group.group_id} className={styles.groupSection}>
          <h3
            className={styles.groupHeader}
            style={{
              backgroundColor: groupColors[groupIndex % groupColors.length],
            }}
          >
            {group.group_name}
          </h3>
          <ul className={styles.categoryList}>
            {group.categories.map((category) => {
              const normalizedCategory = buildNormalizedCategory(
                group,
                category
              );
              const isSelected =
                selectedCategory?.category_id ===
                  normalizedCategory.category_id &&
                selectedCategory?.group_id === normalizedCategory.group_id;
              return (
                <li
                  key={normalizedCategory.category_id}
                  className={`${styles.categoryItem} ${
                    isSelected ? styles.selected : ''
                  }`}
                  onClick={() => onSelectCategory(normalizedCategory)}
                >
                  {normalizedCategory.category_name}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default CategoriesList;
