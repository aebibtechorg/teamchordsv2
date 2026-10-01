import React from 'react';
import { Modal as RNModal, View, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  visible?: boolean;
}

export default function Modal({ children, onClose, visible = true }: ModalProps) {
  return (
    <RNModal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <ScrollView bounces={false} contentContainerStyle={{ flexGrow: 1 }}>
                {children}
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
