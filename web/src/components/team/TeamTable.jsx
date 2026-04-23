import React from "react";
import { Trash2 } from "lucide-react";

const TeamTable = ({ data, onRemove, currentUserRole, profileId, onRoleChange }) => {
  const adminCount = data.filter(m => m.role.toLowerCase() === 'admin').length;

  return (
    <div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-200">
          {data.map((member) => (
            <div
              key={member.userId}
              className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  <img className="h-10 w-10 rounded-full" src={member.picture || '/default-avatar.png'} alt={member.name} />
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {currentUserRole === 'admin' && member.userId !== profileId ? (
                        <select
                          value={member.role}
                          onChange={(e) => onRoleChange(member, e.target.value)}
                          disabled={adminCount === 1 && member.role.toLowerCase() === 'admin'}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 bg-transparent ${
                            member.role.toLowerCase() === 'admin' ? 'text-green-800' : 'text-gray-800'
                          }`}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Member">Member</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.role.toLowerCase() === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role}
                        </span>
                      )}
                      <div className="text-sm text-gray-500">
                        Joined: {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                {currentUserRole === 'admin' && member.userId !== profileId && (
                  <button
                    onClick={() => onRemove(member)}
                    className="inline-flex items-center gap-2 rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    title="Remove Member"
                  >
                    <Trash2 size={18} />
                    <span className="sr-only">Remove member</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-gray-500">
          No team members found.
        </div>
      )}
    </div>
  );
};

export default TeamTable;
