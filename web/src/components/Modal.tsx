import { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';

export default function Modal({ children, onClose }) {
  const [open, setOpen] = useState(true);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {children}
      </DialogContent>
    </Dialog>
  );
}
