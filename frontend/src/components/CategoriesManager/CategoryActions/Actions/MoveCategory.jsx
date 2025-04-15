/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import styles from './MoveCategory.module.css';
import { fetchGroups, updateCategoryGroup } from '../../../../utils/api';

function MoveCategory({ selectedCategory, onCategoryUpdated }) {
  const [groups, setGroups] = useState([]); // all available groups

  const [highlightedGroupId, setHighlightedGroupId] = useState(null);

  // Simply gets a list of all available groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groupsData = await fetchGroups();
        setGroups(groupsData);
      } catch (err) {
        console.error('Error fetching groups:', err);
      }
    };
    loadGroups();
  }, []);

  console.log(selectedCategory, 'ahahdsfhasdfjsd');

  // Function to submit a new group_id to the selected category, sends a put request
  const handleSubmit = async () => {
    if (highlightedGroupId === selectedCategory.group_id) {
      alert('Category is already in this group:', selectedCategory.group_name);
      return;
    }
    try {
      console.log(
        'TESTING THE MOVE 🐄🐄🐄🐄🐄🐄',
        selectedCategory,
        highlightedGroupId
      );
      await updateCategoryGroup(
        selectedCategory.category_id,
        highlightedGroupId
      );
      alert('Category moved successfully!');
      onCategoryUpdated(); // Refresh category list
    } catch (err) {
      console.error('Error updating category group:', err);
      alert('Failed to move category.');
    }
  };

  // Styling Logic
  const getGroupClassName = (group) => {
    if (group.id === selectedCategory.group_id) {
      return `${styles.groupItem} ${styles.disabled}`;
    }
    if (group.id === highlightedGroupId) {
      return `${styles.groupItem} ${styles.selected}`;
    }
    return styles.groupItem;
  };

  // ! ==================================================================================
  //! RETURN
  return (
    <div className={styles.container}>
      <h2>Move Category: {selectedCategory.category_name}</h2>
      <h3>currently in Group: {selectedCategory.group_name}</h3>
      <p>Select a new group</p>
      <p>selected group: {selectedCategory.group_name}</p>
      <ul className={styles.groupList}>
        {groups.map((group) => (
          <li
            key={group.id}
            className={getGroupClassName(group)}
            onClick={() => {
              if (group.id !== selectedCategory.group_id) {
                setHighlightedGroupId(group.id);
              }
            }}
          >
            {group.name}
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubmit}
        disabled={!highlightedGroupId}
        className={
          highlightedGroupId ? styles.activeButton : styles.disabledButton
        }
      >
        Move
      </button>

      <button onClick={onCategoryUpdated} className={styles.cancelButton}>
        Cancel
      </button>
    </div>
  );
}

export default MoveCategory;
