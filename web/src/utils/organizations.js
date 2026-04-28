import { apiFetch } from './api';

export const getOrgMembers = async (orgId) => {
    const res = await apiFetch(`/api/organizations/${orgId}/members`);
    return res.json();
};

export const removeOrgMember = async (orgId, userId) => {
    const res = await apiFetch(`/api/organizations/${orgId}/members/${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to remove member');
};

export const updateMemberRole = async (orgId, userId, role) => {
    const res = await apiFetch(`/api/organizations/${orgId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
    });
    if (!res.ok) throw new Error('Failed to update member role');
};

export async function updateOrganization(orgId, dto) {
    const res = await apiFetch(`/api/organizations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
    });

    if (!res.ok) {
        let message = 'Failed to update organization';
        try {
            const data = await res.json();
            message = data?.message || message;
        } catch {
            // Ignore JSON parsing issues and fall back to the default error message.
        }
        throw new Error(message);
    }
}

