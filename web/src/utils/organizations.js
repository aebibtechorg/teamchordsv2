import { apiFetch } from './api';

export const getOrgMembers = async (orgId) => {
    const res = await apiFetch(`/api/organizations/${orgId}/members`);
    return res.json();
};

export const removeOrgMember = async (orgId, userId) => {
    const res = await apiFetch(`/api/organizations/${orgId}/members/${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to remove member');
};
