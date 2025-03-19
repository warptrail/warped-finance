/* eslint-disable react/prop-types */

import { useEffect, useState } from 'react';
import styles from './CategoriesList.module.css';
import { fetchCategoriesByGroup } from '../../../utils/api';

const groupColors = [
  '#FF6B6B',
  '#FF9F43',
  '#FFC312',
  '#A3CB38',
  '#1289A7',
  '#D980FA',
  '#9980FA',
  '#FDA7DF',
  '#B53471',
  '#1B9CFC',
  '#78E08F',
  '#EAB543',
];

const CategoriesList = ({ selectedCategory, onSelectCategory }) => {
  const [categoriesByGroup, setCategoriesByGroup] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      const categories = await fetchCategoriesByGroup();

      // Group categories under their respective groups
      const grouped = categories.reduce((acc, category) => {
        const { group_id, group_name, category_id, category_name } = category;
        if (!acc[group_id]) {
          acc[group_id] = { group_name, group_id, categories: [] };
        }
        acc[group_id].categories.push({
          category_id,
          category_name,
          group_id,
          group_name,
        });
        return acc;
      }, {});

      setCategoriesByGroup(Object.values(grouped));
    };

    loadCategories();
    setLoading(false);
  }, []);

  if (loading) return <p>Loading categories...</p>;

  const buildNewSelectedCategory = (group, category) => {
    const selectedCategory = {
      category_id: category.category_id,
      category_name: category.category_name,
      group_id: group.group_id,
      group_name: group.group_name,
    };
    console.log('SELECTED CATEGORY buildNewSelectedCategory');
    console.table(selectedCategory);
    return selectedCategory;
  };

  return (
    <div className={styles.container}>
      {categoriesByGroup.map((group, index) => (
        <div key={group.group_name} className={styles.group}>
          {/* Group Name as Header */}
          <h3
            className={styles.groupHeader}
            style={{ backgroundColor: groupColors[index % groupColors.length] }}
          >
            {group.group_name}
          </h3>

          {/* List of Categories */}
          <ul className={styles.list}>
            {group.categories.map((category) => (
              <li
                key={category.category_id}
                className={`${styles.item} ${
                  selectedCategory?.category_id === category.category_id
                    ? styles.selected
                    : ''
                }`}
                onClick={() =>
                  onSelectCategory(buildNewSelectedCategory(group, category))
                }
              >
                {category.category_name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default CategoriesList;
