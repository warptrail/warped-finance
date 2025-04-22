import { useState, useEffect } from 'react';
import styles from './EditPanel.module.css';
import parentStyles from '../Modal.module.css';
import {
  updateTransaction,
  updateTransactionTags,
} from '../../../../utils/api';

const EditPanel = ({ transaction, categories, onClose, refreshTable }) => {
  const [formData, setFormData] = useState({ ...transaction });
  const [localTags, setLocalTags] = useState('');

  useEffect(() => {
    const editableFields = [
      'description',
      'notes',
      'category_name',
      'tags',
      'quantity',
      'location',
      'link',
    ];
    if (transaction) {
      // Initialize formData with only editable fields
      const filteredData = Object.keys(transaction)
        .filter((key) => editableFields.includes(key))
        .reduce((acc, key) => {
          acc[key] = transaction[key];
          return acc;
        }, {});

      const categoryMatch = Object.values(categories)
        .flat()
        .find((cat) => cat.name === transaction.category_name);
      console.log('filteredDataEditPanel===>:', filteredData);
      console.log('categoryMatch===>:', categoryMatch);

      setFormData({
        ...filteredData,
        category_id: categoryMatch ? categoryMatch.id : '',
      });

      setLocalTags(formData.tags.join(', '));

      console.log('formData', formData);
      console.log('local tags useEffect', localTags);
    }
  }, []);

  // * Handle Updates Functionality

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // debounce function
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  // Update formData.tags after 300ms of inactivity
  const updateTagsInFormData = debounce((newTags) => {
    setFormData((prev) => ({
      ...prev,
      tags: newTags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    }));
  }, 300);

  const handleTagsChange = (e) => {
    const newValue = e.target.value;
    setLocalTags(newValue);
    updateTagsInFormData(newValue);
  };

  const onCancel = () => {
    const categoryMatch = Object.values(categories)
      .flat()
      .find((cat) => cat.name === transaction.category_name);
    setFormData({
      ...transaction,
      category_id: categoryMatch?.id || null, // Set category_id based on category_name
    });
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    try {
      const { id } = transaction;
      const { category_name, tags, ...sanitizedData } = formData;
      console.log('tags from save changes:', tags);
      console.log(category_name, tags, 'has been removed');
      console.log('sanitizedData', sanitizedData);

      // Update transaction details (excluding tags)
      await updateTransaction(id, sanitizedData);

      // Update tags
      await updateTransactionTags(id, tags);
      console.log('id:', id, 'formData', sanitizedData);
      refreshTable();
      onClose();
    } catch (err) {
      console.error('Failed to save changes:', err);
    }
  };

  return (
    <form className={parentStyles.modalBody} onSubmit={handleSaveChanges}>
      <label>
        Description:
        <input
          name="description"
          value={formData.description}
          onChange={handleInputChange}
        />
      </label>

      <div className={styles.selectContainer}>
        <label htmlFor="category" className={styles.selectLabel}>
          Category:
        </label>
        <select
          id="category"
          name="category_id"
          className={styles.selectElement}
          value={formData.category_id || ''}
          onChange={handleInputChange}
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((group) => (
            <optgroup label={group.group_name} key={group.group_id}>
              {group.categories.map((cat) => (
                <option value={cat.category_id} key={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className={styles.selectArrow}></div>
      </div>

      <label>
        Notes:
        <input
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
        />
      </label>

      <label>
        Tags:
        <input
          type="text"
          name="tags"
          value={localTags}
          onChange={handleTagsChange}
        />
      </label>

      <label>
        Quantity:
        <input
          name="quantity"
          value={formData.quantity}
          onChange={handleInputChange}
          type="number"
        />
      </label>
      <label>
        Location:
        <input
          name="location"
          value={formData.location}
          onChange={handleInputChange}
        />
      </label>
      <label>
        Link:
        <input name="link" value={formData.link} onChange={handleInputChange} />
      </label>
      <div className={styles.buttonGroup}>
        <button
          className={styles.cancelButton}
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button className={styles.saveButton} type="submit">
          Save
        </button>
      </div>
    </form>
  );
};

export default EditPanel;
