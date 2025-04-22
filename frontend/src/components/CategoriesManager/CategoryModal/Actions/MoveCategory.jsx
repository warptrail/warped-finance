const MoveCategory = ({ category, onClose }) => {
  return (
    <div>
      <h2>Move Category</h2>
      <p>Selected Category: {category?.category_name}</p>
      {/* Add form elements here later */}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default MoveCategory;
