import { useEffect, useState } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import { getOrgMembers, removeOrgMember } from '../utils/organizations';
import InviteUser from '../components/InviteUser';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import TeamTable from '../components/team/TeamTable';

export default function TeamManagement() {
  const { profile } = useProfileStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const orgId = profile?.orgId;
  const currentUserRole = profile?.organizations?.find(o => o.id === orgId)?.role?.toLowerCase();

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

  if (!orgId) return <div>No organization selected</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <button 
          onClick={() => setIsInviteDialogOpen(true)}
          className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
        >
          Invite User
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      <TeamTable data={members} onRemove={setConfirmRemove} currentUserRole={currentUserRole} profileId={profile.id} />

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
