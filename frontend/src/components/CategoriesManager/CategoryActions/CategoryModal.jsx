/* eslint-disable react/prop-types */
import Modal from 'react-modal';
import styles from './CategoryModal.module.css';

import CreateCategory from './Actions/CreateCategory';
import MergeCategory from './Actions/MergeCategory';
import MoveCategory from './Actions/MoveCategory';
import RenameCategory from './Actions/RenameCategory';
import DeleteCategory from './Actions/DeleteCategory';

const CategoryModal = ({
  isOpen,
  onClose,
  selectedAction,
  selectedCategory,
}) => {
  console.log(
    'this is the selected category from the Categorymodal Component. ',
    selectedCategory
  );
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Manage Category"
      className={styles.modal}
      overlayClassName={styles.overlay}
    >
      <button className={styles.closeButton} onClick={onClose}>
        ✖
      </button>

      {/* Render selected action component */}
      {selectedAction === 'move' && (
        <MoveCategory selectedCategory={selectedCategory} onClose={onClose} />
      )}
      {selectedAction === 'rename' && (
        <RenameCategory selectedCategory={selectedCategory} onClose={onClose} />
      )}
      {selectedAction === 'merge' && (
        <MergeCategory selectedCategory={selectedCategory} onClose={onClose} />
      )}
      {selectedAction === 'create' && <CreateCategory onClose={onClose} />}
      {selectedAction === 'delete' && (
        <DeleteCategory selectedCategory={selectedCategory} onClose={onClose} />
      )}
    </Modal>
  );
};

export default CategoryModal;
