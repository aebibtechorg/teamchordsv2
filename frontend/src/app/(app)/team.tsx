import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { Plus, Save } from 'lucide-react-native';
import { useProfileStore } from '../../store/useProfileStore';
import { getOrgMembers, removeOrgMember, updateMemberRole, updateOrganization } from '../../utils/organizations';
import { OrgMemberDto } from '../../types/api';
import TeamTable from '../../components/team/TeamTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import InviteUserModal from '../../components/team/InviteUserModal';
import Spinner from '../../components/Spinner';
import { useIconColor } from '../../hooks/use-icon-color';

export default function TeamManagement() {
  const { profile, setUserProfile } = useProfileStore();
  const [members, setMembers] = useState<OrgMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const ic = useIconColor();

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
        text2: err.message || 'Failed to update team name.',
      });
    } finally {
      setIsSavingOrgName(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-4 md:p-8">
      <View className="w-full mb-12">
        {/* Header */}
        <View className="flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <View>
            <Text className="text-2xl md:text-3xl font-bold text-foreground">Team Management</Text>
            <Text className="text-sm text-muted-foreground mt-1">
              Manage team settings, members, and permissions.
            </Text>
          </View>

          {currentUserRole === 'admin' && (
            <TouchableOpacity
              onPress={() => setIsInviteOpen(true)}
              className="flex-row items-center bg-primary px-4 py-2.5 rounded-xl shadow-sm active:opacity-90 self-start md:self-auto"
            >
              <Plus size={16} color="#fff" />
              <Text className="text-sm font-semibold text-primary-foreground ml-2">Invite Member</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Organization Name Card */}
        {canEditOrgName && (
          <View className="bg-card rounded-2xl p-5 shadow-sm border border-border mb-6">
            <Text className="text-xs font-semibold text-foreground mb-2">Team Name</Text>
            <View className="flex-row gap-2">
              <TextInput
                value={orgName}
                onChangeText={setOrgName}
                placeholder="Organization Name"
                placeholderTextColor={ic.placeholder}
                className="flex-1 border border-border rounded-xl px-3.5 py-2 text-sm bg-muted text-foreground font-medium"
              />
              <TouchableOpacity
                onPress={handleSaveOrgName}
                disabled={isSavingOrgName}
                className="bg-primary px-4 py-2 rounded-xl items-center justify-center active:opacity-90"
              >
                {isSavingOrgName ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View className="flex-row items-center">
                    <Save size={16} color="#fff" />
                    <Text className="text-primary-foreground text-xs font-bold ml-1.5">Save</Text>
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
      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        orgId={orgId}
      />

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmRemoveId)}
        onClose={() => setConfirmRemoveId(null)}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        message="Are you sure you want to remove this member from the team?"
        confirmLabel="Remove"
      />
    </ScrollView>
  );
}
