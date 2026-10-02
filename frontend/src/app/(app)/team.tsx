import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { Plus, X, Save } from 'lucide-react-native';
import { useProfileStore } from '../../store/useProfileStore';
import { getOrgMembers, removeOrgMember, updateMemberRole, updateOrganization } from '../../utils/organizations';
import { inviteUser } from '../../utils/common';
import { OrgMemberDto } from '../../types/api';
import TeamTable from '../../components/team/TeamTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';

export default function TeamManagement() {
  const { profile, setUserProfile } = useProfileStore();
  const [members, setMembers] = useState<OrgMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Org Name Editing
  const [orgName, setOrgName] = useState('');
  const [isSavingOrgName, setIsSavingOrgName] = useState(false);

  const orgId = profile?.orgId;
  const activeOrg = profile?.organizations?.find((o) => o.id === orgId);
  const currentUserRole = activeOrg?.role?.toLowerCase();
  const canEditOrgName = currentUserRole === 'admin';

  useEffect(() => {
    if (activeOrg?.name) {
      setOrgName(activeOrg.name);
    }
  }, [activeOrg?.name]);

  const fetchMembers = async () => {
    if (!orgId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data: any = await getOrgMembers(orgId);
      setMembers(data.items || data || []);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to load team members.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [orgId]);

  const handleRoleChange = async (member: OrgMemberDto, newRole: string) => {
    if (!orgId || !member.userId) return;
    const oldRole = member.role;
    setMembers((prev) =>
      prev.map((m) => (m.userId === member.userId ? { ...m, role: newRole } : m))
    );
    try {
      await updateMemberRole(orgId, member.userId, newRole);
    } catch (err: any) {
      setMembers((prev) =>
        prev.map((m) => (m.userId === member.userId ? { ...m, role: oldRole } : m))
      );
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to update member role.',
      });
    }
  };

  const handleRemoveMember = async () => {
    if (!orgId || !confirmRemoveId) return;
    try {
      await removeOrgMember(orgId, confirmRemoveId);
      setMembers((prev) => prev.filter((m) => m.userId !== confirmRemoveId));
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to remove member.',
      });
    } finally {
      setConfirmRemoveId(null);
    }
  };

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
        setIsInviteOpen(false);
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

  const handleSaveOrgName = async () => {
    if (!orgId || !orgName.trim()) return;
    setIsSavingOrgName(true);
    try {
      await updateOrganization(orgId, { name: orgName.trim() });
      if (profile && profile.organizations) {
        const updatedOrgs = profile.organizations.map((o) =>
          o.id === orgId ? { ...o, name: orgName.trim() } : o
        );
        setUserProfile({ ...profile, organizations: updatedOrgs });
      }
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Organization name updated.',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to update organization name.',
      });
    } finally {
      setIsSavingOrgName(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4 md:p-8">
      <View className="w-full mb-12">
        {/* Header */}
        <View className="flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <View>
            <Text className="text-2xl md:text-3xl font-bold text-gray-900">Team Management</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Manage organization settings, members, and permissions.
            </Text>
          </View>

          {currentUserRole === 'admin' && (
            <TouchableOpacity
              onPress={() => setIsInviteOpen(true)}
              className="flex-row items-center bg-blue-600 px-4 py-2.5 rounded-xl shadow-sm active:bg-blue-700 self-start md:self-auto"
            >
              <Plus size={16} color="#fff" />
              <Text className="text-sm font-semibold text-white ml-2">Invite Member</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Organization Name Card */}
        {canEditOrgName && (
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
            <Text className="text-xs font-semibold text-gray-700 mb-2">Organization Name</Text>
            <View className="flex-row gap-2">
              <TextInput
                value={orgName}
                onChangeText={setOrgName}
                placeholder="Organization Name"
                className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-gray-50 font-medium"
              />
              <TouchableOpacity
                onPress={handleSaveOrgName}
                disabled={isSavingOrgName}
                className="bg-gray-800 px-4 py-2 rounded-xl items-center justify-center active:bg-gray-900"
              >
                {isSavingOrgName ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View className="flex-row items-center">
                    <Save size={16} color="#fff" />
                    <Text className="text-white text-xs font-bold ml-1.5">Save</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Members Table */}
        {loading ? (
          <Spinner />
        ) : (
          <TeamTable
            data={members}
            onRemove={(m) => m.userId && setConfirmRemoveId(m.userId)}
            currentUserRole={currentUserRole}
            profileId={profile?.id}
            onRoleChange={handleRoleChange}
          />
        )}
      </View>

      {/* Invite Modal */}
      {isInviteOpen && (
        <Modal visible onClose={() => setIsInviteOpen(false)}>
          <View className="p-6 bg-white">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Invite Team Member</Text>
              <TouchableOpacity onPress={() => setIsInviteOpen(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-semibold text-gray-700 mb-1.5">Email Address</Text>
            <TextInput
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="musician@band.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 mb-6"
            />

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => setIsInviteOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-gray-200 active:bg-gray-300"
              >
                <Text className="text-gray-800 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendInvite}
                disabled={isInviting || !inviteEmail.trim()}
                className={`px-5 py-2.5 rounded-lg bg-blue-600 active:bg-blue-700 ${
                  isInviting || !inviteEmail.trim() ? 'opacity-50' : ''
                }`}
              >
                {isInviting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-medium">Send Invite</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmRemoveId)}
        onClose={() => setConfirmRemoveId(null)}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        message="Are you sure you want to remove this member from the organization?"
        confirmLabel="Remove"
      />
    </ScrollView>
  );
}
