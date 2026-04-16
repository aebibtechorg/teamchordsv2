import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
