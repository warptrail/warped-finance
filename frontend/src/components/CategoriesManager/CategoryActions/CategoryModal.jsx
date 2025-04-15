/* eslint-disable react/prop-types */
import Modal from 'react-modal';
import MoveCategory from './actions/MoveCategory';
import RenameCategory from './actions/RenameCategory';
import MergeCategory from './actions/MergeCategory';
import DeleteCategory from './actions/DeleteCategory';
import CreateCategory from './actions/CreateCategory';
import styles from './CategoryModal.module.css';

const CategoryModal = ({
  isOpen,
  onClose,
  action,
  selectedCategory,
  onCategoryUpdated,
}) => {
  const renderContent = () => {
    switch (action) {
      case 'move':
        return (
          <MoveCategory
            category={selectedCategory}
            onCategoryUpdated={onCategoryUpdated}
          />
        );
      case 'rename':
        return (
          <RenameCategory
            category={selectedCategory}
            onCategoryUpdated={onCategoryUpdated}
          />
        );
      case 'merge':
        return (
          <MergeCategory
            category={selectedCategory}
            onCategoryUpdated={onCategoryUpdated}
          />
        );
      case 'delete':
        return (
          <DeleteCategory
            category={selectedCategory}
            onCategoryUpdated={onCategoryUpdated}
          />
        );
      case 'create':
        return <CreateCategory onCategoryUpdated={onCategoryUpdated} />;
      default:
        return <p>No action selected.</p>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Category Action Modal"
      className={styles.modal}
      overlayClassName={styles.overlay}
      ariaHideApp={false} // Adjust or set via Modal.setAppElement in main app file
    >
      <div className={styles.modalContent}>{renderContent()}</div>
    </Modal>
  );
};

export default CategoryModal;
