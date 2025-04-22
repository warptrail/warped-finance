// /CategoryModal/actions/DeleteCategory.jsx
const DeleteCategory = ({ category, onClose }) => {
  return (
    <div>
      <h2>Delete Category</h2>
      <p>Selected Category: {category?.category_name}</p>
      {/* Add confirmation logic here later */}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default DeleteCategory;
