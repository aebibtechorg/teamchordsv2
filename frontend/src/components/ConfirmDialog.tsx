import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} onClose={onClose}>
      <View className="p-6 bg-card">
        <Text className="text-xl font-bold mb-4 text-foreground">{title}</Text>
        <Text className="text-muted-foreground mb-6 leading-5">{message}</Text>
        <View className="flex-row justify-end gap-3">
          <TouchableOpacity
            onPress={onClose}
            className="px-4 py-2.5 rounded-lg bg-muted active:opacity-80"
          >
            <Text className="text-foreground font-medium">{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2.5 rounded-lg bg-red-500 active:bg-red-600"
          >
            <Text className="text-white font-medium">{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
