// /CategoryModal/actions/RenameCategory.jsx
const RenameCategory = ({ category, onClose }) => {
  return (
    <div>
      <h2>Rename Category</h2>
      <p>Selected Category: {category?.category_name}</p>
      {/* Add form elements here later */}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default RenameCategory;
