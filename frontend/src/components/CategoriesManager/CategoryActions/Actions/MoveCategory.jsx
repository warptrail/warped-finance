/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import styles from './MoveCategory.module.css';
import { fetchGroups, updateCategoryGroup } from '../../../../utils/api';

function MoveCategory({ selectedCategory, onClose, onCategoryUpdated }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(selectedCategory.group_id);

  console.log('category from MoveCategory', selectedCategory);
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

  const handleGroupSelect = (groupId) => {
    setSelectedGroup(groupId);
  };

  const handleSubmit = async () => {
    if (selectedGroup === selectedCategory.group_id) {
      alert('Category is already in this group:', selectedCategory.group_name);
      return;
    }
    try {
      await updateCategoryGroup(selectedCategory.category_id, selectedGroup);
      alert('Category moved successfully!');
      onCategoryUpdated(); // Refresh category list
      onClose(); // Close modal
    } catch (err) {
      console.error('Error updating category group:', err);
      alert('Failed to move category.');
    }
  };

  console.log('line 16 MoveCategory.jsx -- groupsData:', groups);

  const setGroupClassName = (groupId, selectedGroup, currentGroup) => {
    console.table(groupId, selectedGroup, currentGroup);
    if (groupId === currentGroup) return styles.current; // Greyed out, can't select
    if (groupId === selectedGroup) return styles.selected; // User-selected highlight
    return null; // Default style
  };

  return (
    <div className={styles.container}>
      <h2>Move Category: {selectedCategory.category_name}</h2>
      <h3>currently in Group: {selectedCategory.group_name}</h3>
      <p>Select a new group</p>
      <p>selected group: {selectedGroup}</p>
      <ul className={styles.groupList}>
        {groups.map((group) => (
          <li
            key={group.id}
            className={`${styles.groupItem} ${setGroupClassName(
              group.id,
              selectedGroup,
              selectedCategory.group_name
            )}`}
            onClick={() => handleGroupSelect(group.id)}
          >
            {group.name}
          </li>
        ))}
      </ul>
      <button onClick={handleSubmit} className={styles.submitButton}>
        Move
      </button>
      <button onClick={onClose} className={styles.cancelButton}>
        Cancel
      </button>
    </div>
  );
}

export default MoveCategory;
