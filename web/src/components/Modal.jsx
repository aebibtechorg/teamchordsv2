import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';

export default function Modal({ children, onClose }) {
  const dialogRef = useRef();

  useEffect(() => {
    if (!dialogRef.current) return;
    
    // Using native dialog API for accessibility
    dialogRef.current.showModal();
    
    return () => {
      if (dialogRef.current) {
        dialogRef.current.close();
      }
    };
  }, []);

  return createPortal(
    <dialog 
      ref={dialogRef}
      className="fixed inset-0 w-full max-w-md mx-auto my-20 rounded-lg shadow-lg bg-white backdrop:bg-black/50"
      onClick={(e) => {
        // Close modal when clicking outside
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="relative">
        {children}
      </div>
    </dialog>,
    document.getElementById('modal-root')
  );
}
