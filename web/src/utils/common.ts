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
            body: JSON.stringify({ email, organizationId })
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

export { getProfile, createOrganization, createProfile, inviteUser };