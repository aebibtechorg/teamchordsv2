import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { X, Link2, Mail, Copy, Check, RefreshCw } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Modal from '../Modal';
import { inviteUser } from '../../utils/common';
import { useIconColor } from '../../hooks/use-icon-color';
import { WEB_BASE_URL } from '../../config';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId?: string;
}

export default function InviteUserModal({ isOpen, onClose, orgId }: InviteUserModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'email'>('link');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const ic = useIconColor();

  const handleClose = () => {
    setInviteEmail('');
    setGeneratedLink(null);
    setHasCopied(false);
    onClose();
  };

  const getBaseInviteUrl = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/invites`;
    }
    return `${WEB_BASE_URL || 'https://teamchords.com'}/invites`;
  };

  const handleGenerateLink = async () => {
    if (!orgId) return;
    setIsSubmitting(true);
    try {
      const res = await inviteUser(orgId);
      if (res && res.id) {
        const url = `${getBaseInviteUrl()}/${res.id}`;
        setGeneratedLink(url);
        await Clipboard.setStringAsync(url);
        setHasCopied(true);
        Toast.show({
          type: 'success',
          text1: 'Link Created & Copied',
          text2: 'Invite link copied to clipboard!',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to generate invite link.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to generate invite link.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyExistingLink = async () => {
    if (!generatedLink) return;
    await Clipboard.setStringAsync(generatedLink);
    setHasCopied(true);
    Toast.show({
      type: 'success',
      text1: 'Copied',
      text2: 'Invite link copied to clipboard!',
    });
    setTimeout(() => setHasCopied(false), 3000);
  };

  const handleSendEmailInvite = async () => {
    if (!inviteEmail.trim() || !orgId) return;
    setIsSubmitting(true);
    try {
      const res = await inviteUser(orgId, inviteEmail.trim());
      if (res) {
        Toast.show({
          type: 'success',
          text1: 'Invitation Sent',
          text2: `Invitation sent to ${inviteEmail.trim()}.`,
        });
        setInviteEmail('');
        handleClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to send invitation email.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to send invitation email.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} onClose={handleClose}>
      <View className="p-6 bg-card w-full">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="text-xl font-bold text-foreground">Invite Member</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Add musicians and collaborators to your team
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="p-1 rounded-lg hover:bg-muted active:opacity-70"
          >
            <X size={20} color={ic.secondary} />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-muted rounded-xl p-1 mb-5 border border-border">
          <TouchableOpacity
            onPress={() => setActiveTab('link')}
            className={`flex-1 flex-row items-center justify-center py-2 px-3 rounded-lg ${
              activeTab === 'link' ? 'bg-card shadow-sm' : ''
            }`}
          >
            <Link2
              size={15}
              color={activeTab === 'link' ? ic.text : ic.secondary}
            />
            <Text
              className={`text-xs font-semibold ml-2 ${
                activeTab === 'link' ? 'text-foreground font-bold' : 'text-muted-foreground'
              }`}
            >
              Share Link
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('email')}
            className={`flex-1 flex-row items-center justify-center py-2 px-3 rounded-lg ${
              activeTab === 'email' ? 'bg-card shadow-sm' : ''
            }`}
          >
            <Mail
              size={15}
              color={activeTab === 'email' ? ic.text : ic.secondary}
            />
            <Text
              className={`text-xs font-semibold ml-2 ${
                activeTab === 'email' ? 'text-foreground font-bold' : 'text-muted-foreground'
              }`}
            >
              Email Invite
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Share Link */}
        {activeTab === 'link' && (
          <View>
            {!generatedLink ? (
              <View className="bg-muted/50 border border-dashed border-border rounded-xl p-5 items-center justify-center mb-5">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mb-3">
                  <Link2 size={20} color={ic.primary} />
                </View>
                <Text className="text-sm font-semibold text-foreground text-center mb-1">
                  Create a Direct Invite Link
                </Text>
                <Text className="text-xs text-muted-foreground text-center mb-4 leading-relaxed">
                  Anyone with this link can join your team immediately after signing in. Valid for 7 days.
                </Text>
                <TouchableOpacity
                  onPress={handleGenerateLink}
                  disabled={isSubmitting}
                  className="w-full bg-primary py-2.5 px-4 rounded-xl flex-row items-center justify-center active:opacity-90"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Link2 size={16} color="#fff" />
                      <Text className="text-primary-foreground font-bold text-xs ml-2">
                        Generate & Copy Link
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View className="mb-5">
                <Text className="text-xs font-semibold text-foreground mb-1.5">
                  Shareable Invite Link
                </Text>
                <View className="flex-row items-center bg-muted border border-border rounded-xl px-3 py-2 mb-2">
                  <TextInput
                    value={generatedLink}
                    editable={false}
                    selectTextOnFocus
                    className="flex-1 text-xs text-foreground select-all font-mono"
                  />
                  <TouchableOpacity
                    onPress={handleCopyExistingLink}
                    className="ml-2 bg-primary px-3 py-1.5 rounded-lg flex-row items-center active:opacity-90"
                  >
                    {hasCopied ? (
                      <>
                        <Check size={14} color="#fff" />
                        <Text className="text-primary-foreground text-xs font-bold ml-1">Copied</Text>
                      </>
                    ) : (
                      <>
                        <Copy size={14} color="#fff" />
                        <Text className="text-primary-foreground text-xs font-bold ml-1">Copy</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between mt-1">
                  <Text className="text-[11px] text-muted-foreground">
                    Link copied to clipboard
                  </Text>
                  <TouchableOpacity
                    onPress={handleGenerateLink}
                    disabled={isSubmitting}
                    className="flex-row items-center active:opacity-70"
                  >
                    <RefreshCw size={12} color={ic.secondary} />
                    <Text className="text-[11px] text-muted-foreground hover:text-foreground ml-1">
                      New link
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={handleClose}
                className="px-5 py-2.5 rounded-xl bg-muted active:opacity-80"
              >
                <Text className="text-foreground font-medium text-xs">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 2: Email Invite */}
        {activeTab === 'email' && (
          <View>
            <Text className="text-xs font-semibold text-foreground mb-1.5">
              Musician's Email Address
            </Text>
            <TextInput
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="guitarist@band.com"
              placeholderTextColor={ic.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-border rounded-xl px-3.5 py-2.5 text-sm bg-muted text-foreground mb-2 font-medium"
            />
            <Text className="text-[11px] text-muted-foreground mb-6">
              We'll send an email with an invite link to join your organization.
            </Text>

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={handleClose}
                className="px-4 py-2.5 rounded-xl bg-muted active:opacity-80"
              >
                <Text className="text-foreground font-medium text-xs">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendEmailInvite}
                disabled={isSubmitting || !inviteEmail.trim()}
                className={`px-5 py-2.5 rounded-xl bg-primary active:opacity-90 flex-row items-center ${
                  isSubmitting || !inviteEmail.trim() ? 'opacity-50' : ''
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Mail size={15} color="#fff" />
                    <Text className="text-primary-foreground font-bold text-xs ml-1.5">
                      Send Invitation
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
