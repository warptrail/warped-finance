const setFormData = () => {};
const setLocalTags = () => {};

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
