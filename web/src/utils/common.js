import { apiFetch } from './api';

async function getProfile() {
    try {
        // For now, return the user record itself rather than profile join data
        const res = await apiFetch(`/api/users/me`);
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.error('Error fetching profile:', err);
        return null;
    }
}

async function createOrganization(profile) {
    try {
        const res = await apiFetch(`/api/organizations/`, {
            method: 'POST',
            body: JSON.stringify({ name: profile.name })
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

async function createProfile(profile) {
    try {
        // If no orgId specified, automatically create a default organization for the new user
        let orgId = profile.orgId;
        if (!orgId) {
            const org = await createOrganization(profile);
            if (org && org.id) orgId = org.id;
        }

        const res = await apiFetch(`/api/profiles/`, {
            method: 'POST',
            body: JSON.stringify({ userId: profile.userId, orgId })
        });
        if (!res.ok) {
            const text = await res.json();
            console.error('Error creating profile:', res.status, text);
            return null;
        }

        // return the user info (getProfile now returns the user record)
        return await getProfile(profile.userId);
    } catch (err) {
        console.error('Error creating profile:', err);
        return null;
    }
}

async function inviteUser(email, organizationId) {
    try {
        const res = await apiFetch(`/api/invites`, {
            method: 'POST',
            body: JSON.stringify({ email, organizationId, baseUrl: window.location.origin })
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

async function updateMe(dto) {
    try {
        const res = await apiFetch(`/api/users/me`, {
            method: 'PUT',
            body: JSON.stringify(dto)
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

async function updateProfile(id, dto) {
    try {
        const payload = { ...dto };
        if (payload.instruments && Array.isArray(payload.instruments)) {
            payload.instruments = JSON.stringify(payload.instruments);
        }
        const res = await apiFetch(`/api/profiles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
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

async function upsertProfile(profileId, userId, orgId, dto) {
    try {
        const payload = { ...dto, userId, orgId };
        if (payload.instruments && Array.isArray(payload.instruments)) {
            payload.instruments = JSON.stringify(payload.instruments);
        }

        const url = profileId ? `/api/profiles/${profileId}` : `/api/profiles/`;
        const method = profileId ? 'PUT' : 'POST';

        const res = await apiFetch(url, {
            method,
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const text = await res.json();
            console.error('Error upserting profile:', res.status, text);
            return null;
        }
        // PUT returns 204 No Content, POST returns 201 with body
        if (method === 'PUT') return true;
        return await res.json();
    } catch (err) {
        console.error('Error upserting profile:', err);
        return null;
    }
}

export { getProfile, createOrganization, createProfile, inviteUser, updateMe, updateProfile, upsertProfile };
