// /CategoryModal/actions/MergeCategory.jsx
const MergeCategory = ({ category, onClose }) => {
  return (
    <div>
      <h2>Merge Category</h2>
      <p>Selected Category: {category?.category_name}</p>
      {/* Add form elements here later */}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default MergeCategory;