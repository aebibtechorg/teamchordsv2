import { apiFetch } from './api';
import { OrgMemberDto, OrganizationDto } from '../types/api';

export const getOrgMembers = async (orgId: string): Promise<OrgMemberDto[]> => {
  const res = await apiFetch(`/api/organizations/${orgId}/members`);
  return res.json();
};

export const removeOrgMember = async (orgId: string, userId: string): Promise<void> => {
  const res = await apiFetch(`/api/organizations/${orgId}/members/${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove member');
};

export const updateMemberRole = async (orgId: string, userId: string, role: string): Promise<void> => {
  const res = await apiFetch(`/api/organizations/${orgId}/members/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Failed to update member role');
};

export async function updateOrganization(orgId: string, dto: Partial<OrganizationDto>): Promise<void> {
  const res = await apiFetch(`/api/organizations/${orgId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    let message = 'Failed to update organization';
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // Ignore JSON parsing issues
    }
    throw new Error(message);
  }
}
