import { useEffect, useState } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import { getOrgMembers, removeOrgMember } from '../utils/organizations';
import InviteUser from '../components/InviteUser';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Team Management</h1>

      <div className="mb-8">
        <button 
          onClick={() => setIsInviteDialogOpen(true)}
          className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
        >
          Invite User
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.userId}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img className="h-10 w-10 rounded-full" src={member.picture || '/default-avatar.png'} alt={member.name} />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    member.role.toLowerCase() === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {currentUserRole === 'admin' && member.userId !== profile.id && (
                    <button
                      onClick={() => setConfirmRemove(member)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmRemove && (
        <ConfirmDialog
          title="Remove Member"
          message={`Are you sure you want to remove ${confirmRemove.name} from the team?`}
          onConfirm={() => handleRemoveMember(confirmRemove.userId)}
          onCancel={() => setConfirmRemove(null)}
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
