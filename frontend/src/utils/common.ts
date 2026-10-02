import { apiFetch, getApiBaseUrl } from './api';
import { UserDetailDto, OrganizationDto, ProfileDto, UpdateMeDto, InviteDto } from '../types/api';
import { Platform } from 'react-native';

export async function getProfile(userId?: string): Promise<UserDetailDto | null> {
  try {
    const res = await apiFetch(`/api/users/me`);
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) return null;
    return await res.json();
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    if (err.message === 'Unauthorized') throw err;
    return null;
  }
}

export async function createOrganization(profile: { name?: string }): Promise<OrganizationDto | null> {
  try {
    const res = await apiFetch(`/api/organizations/`, {
      method: 'POST',
      body: JSON.stringify({ name: profile.name }),
    });
    if (!res.ok) {
      const text = await res.json();
      console.error('Error creating organization:', res.status, text);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Error creating organization:', err);
    return null;
  }
}

export async function createProfile(profile: { userId?: string; orgId?: string; name?: string }): Promise<UserDetailDto | null> {
  try {
    let orgId = profile.orgId;
    if (!orgId) {
      const org = await createOrganization(profile);
      if (org && org.id) orgId = org.id;
    }

    const res = await apiFetch(`/api/profiles/`, {
      method: 'POST',
      body: JSON.stringify({ userId: profile.userId, orgId }),
    });
    if (!res.ok) {
      const text = await res.json();
      console.error('Error creating profile:', res.status, text);
      return null;
    }

    return await getProfile(profile.userId);
  } catch (err) {
    console.error('Error creating profile:', err);
    return null;
  }
}

export async function inviteUser(email: string, organizationId: string): Promise<InviteDto | null> {
  try {
    const baseUrl = `${Platform.OS === 'web' ? window.location.origin : ''}/invites`;
    const res = await apiFetch(`/api/invites`, {
      method: 'POST',
      body: JSON.stringify({ email, organizationId, baseUrl }),
    });
    if (!res.ok) {
      const text = await res.json();
      console.error('Error inviting user:', res.status, text);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Error inviting user:', err);
    return null;
  }
}

export async function updateMe(dto: UpdateMeDto): Promise<any> {
  try {
    const res = await apiFetch(`/api/users/me`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const text = await res.json();
      console.error('Error updating user:', res.status, text);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Error updating user:', err);
    return null;
  }
}

export async function updateProfile(id: string, dto: Partial<ProfileDto>): Promise<any> {
  try {
    const payload: any = { ...dto };
    if (payload.instruments && Array.isArray(payload.instruments)) {
      payload.instruments = JSON.stringify(payload.instruments);
    }
    const res = await apiFetch(`/api/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.json();
      console.error('Error updating profile:', res.status, text);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Error updating profile:', err);
    return null;
  }
}

export async function upsertProfile(profileId: string | undefined, userId: string, orgId: string, dto: Partial<ProfileDto>): Promise<any> {
  try {
    const payload: any = { ...dto, userId, orgId };
    if (payload.instruments && Array.isArray(payload.instruments)) {
      payload.instruments = JSON.stringify(payload.instruments);
    }

    const url = profileId ? `/api/profiles/${profileId}` : `/api/profiles/`;
    const method = profileId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.json();
      console.error('Error upserting profile:', res.status, text);
      return null;
    }
    if (method === 'PUT') return true;
    return await res.json();
  } catch (err) {
    console.error('Error upserting profile:', err);
    return null;
  }
}
