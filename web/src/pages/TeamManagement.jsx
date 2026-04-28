import { useCallback, useEffect, useState } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import { getOrgMembers, removeOrgMember, updateMemberRole, updateOrganization } from '../utils/organizations';
import InviteUser from '../components/InviteUser';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import TeamTable from '../components/team/TeamTable';
import { Toaster, toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';

export default function TeamManagement() {
  const { profile, setUserProfile } = useProfileStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgNameDirty, setOrgNameDirty] = useState(false);
  const [orgNameSaving, setOrgNameSaving] = useState(false);
  const [orgNameError, setOrgNameError] = useState(null);

  const orgId = profile?.orgId;
  const activeOrg = profile?.organizations?.find(o => (o.id || o.Id) === orgId);
  const currentUserRole = activeOrg?.role?.toLowerCase();
  const activeOrgName = activeOrg?.name || activeOrg?.Name || '';
  const canEditOrgName = currentUserRole === 'admin';

  useEffect(() => {
    setOrgName(activeOrgName);
    setOrgNameDirty(false);
    setOrgNameError(null);
  }, [activeOrgName, orgId]);

  useEffect(() => {
    if (orgId) {
      fetchMembers();
    }
  }, [orgId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await getOrgMembers(orgId);
      setMembers(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeOrgMember(orgId, userId);
      setMembers(members.filter(m => m.userId !== userId));
      setConfirmRemove(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoleChange = async (member, newRole) => {
    const originalRole = member.role;
    // Optimistic update
    setMembers(members.map(m => m.userId === member.userId ? { ...m, role: newRole } : m));
    try {
      await updateMemberRole(orgId, member.userId, newRole);
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      // Revert
      setMembers(members.map(m => m.userId === member.userId ? { ...m, role: originalRole } : m));
      toast.error(err.message || 'Failed to update role');
    }
  };

  const saveOrganizationName = useCallback(async (nextName) => {
    setOrgNameSaving(true);
    try {
      await updateOrganization(orgId, { name: nextName });

      const updateOrganizationEntry = (organization) => {
        const organizationId = organization.id || organization.Id;
        if (organizationId !== orgId) return organization;

        return {
          ...organization,
          name: nextName,
          Name: nextName,
        };
      };

      setUserProfile({
        ...(profile || {}),
        organizations: profile?.organizations?.map(updateOrganizationEntry),
        Organizations: profile?.Organizations?.map(updateOrganizationEntry),
      });

      setOrgNameDirty(false);
      toast.success('Organization name updated');
    } catch (err) {
      setOrgNameError(err.message || 'Failed to update organization name');
      toast.error(err.message || 'Failed to update organization name');
    } finally {
      setOrgNameSaving(false);
    }
  }, [orgId, profile, setUserProfile]);

  useEffect(() => {
    if (!orgId || !canEditOrgName || !orgNameDirty) return;

    const trimmedName = orgName.trim();
    const currentName = activeOrgName.trim();

    if (!trimmedName) {
      setOrgNameError('Organization name is required.');
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setOrgNameError('Organization name must be between 2 and 100 characters.');
      return;
    }

    if (trimmedName === currentName) {
      setOrgNameError(null);
      setOrgNameDirty(false);
      return;
    }

    setOrgNameError(null);

    const timeoutId = setTimeout(() => {
      void saveOrganizationName(trimmedName);
    }, 650);

    return () => clearTimeout(timeoutId);
  }, [activeOrgName, canEditOrgName, orgId, orgName, orgNameDirty, saveOrganizationName]);

  if (!orgId) return <div>No organization selected</div>;

  return (
    <div className="p-4">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <div className="min-w-0">
          <div>
            <input
              type="text"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                setOrgNameDirty(true);
                setOrgNameError(null);
              }}
              readOnly={!canEditOrgName}
              className={`w-full bg-transparent max-w-md text-2xl font-bold text-gray-900 outline-none transition ${canEditOrgName ? 'focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-200' : 'cursor-default'}`}
              placeholder="Organization name"
              aria-label="Organization name"
            />
            {orgNameError && <p className="mt-1 text-sm text-red-500">{orgNameError}</p>}
          </div>
        </div>
        <button 
          onClick={() => setIsInviteDialogOpen(true)}
          className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 py-2 px-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center gap-2"
        >
          <Plus size={16} />
          Invite User
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      <TeamTable data={members} onRemove={setConfirmRemove} currentUserRole={currentUserRole} profileId={profile.id} onRoleChange={handleRoleChange} />

      {confirmRemove != null && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmRemove(null)}
          onConfirm={() => handleRemoveMember(confirmRemove.userId)}
          title="Remove Member"
          message={`Are you sure you want to remove ${confirmRemove.name} from the team?`}
        />
      )}

      {isInviteDialogOpen && (
        <Modal onClose={() => setIsInviteDialogOpen(false)}>
          <InviteUser close={() => setIsInviteDialogOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
