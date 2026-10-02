import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { X } from 'lucide-react-native';
import Modal from '../Modal';
import { inviteUser } from '../../utils/common';
import { useIconColor } from '../../hooks/use-icon-color';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId?: string;
}

export default function InviteUserModal({ isOpen, onClose, orgId }: InviteUserModalProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const ic = useIconColor();

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !orgId) return;
    setIsInviting(true);
    try {
      const res = await inviteUser(inviteEmail.trim(), orgId);
      if (res) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `Invitation sent to ${inviteEmail}.`,
        });
        setInviteEmail('');
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to send invitation.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to send invitation.',
      });
    } finally {
      setIsInviting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} onClose={onClose}>
      <View className="p-6 bg-card">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-foreground">Invite Team Member</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={ic.secondary} />
          </TouchableOpacity>
        </View>

        <Text className="text-xs font-semibold text-foreground mb-1.5">Email Address</Text>
        <TextInput
          value={inviteEmail}
          onChangeText={setInviteEmail}
          placeholder="musician@band.com"
          placeholderTextColor={ic.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          className="border border-border rounded-xl px-3.5 py-2.5 text-sm bg-muted text-foreground mb-6"
        />

        <View className="flex-row justify-end gap-3">
          <TouchableOpacity
            onPress={onClose}
            className="px-4 py-2.5 rounded-lg bg-muted active:opacity-80"
          >
            <Text className="text-foreground font-medium">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSendInvite}
            disabled={isInviting || !inviteEmail.trim()}
            className={`px-5 py-2.5 rounded-lg bg-primary active:opacity-90 ${
              isInviting || !inviteEmail.trim() ? 'opacity-50' : ''
            }`}
          >
            {isInviting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-medium">Send Invite</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
