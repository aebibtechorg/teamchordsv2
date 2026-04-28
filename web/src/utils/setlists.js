import { apiFetch } from './api';

// Cursor-based fetch for setlists. Options: { search, afterCreatedAt, afterId, pageSize }
async function getSetLists(orgId, { search = "", afterCreatedAt = null, afterId = null, pageSize = 50 } = {}) {
    try {
        if (!orgId || String(orgId).trim() === '') {
            return { data: [], nextCursor: null };
        }

        const parts = [`orgId=${encodeURIComponent(orgId)}`];
        if (search) parts.push(`search=${encodeURIComponent(search)}`);
        if (afterCreatedAt) parts.push(`afterCreatedAt=${encodeURIComponent(afterCreatedAt)}`);
        if (afterId) parts.push(`afterId=${encodeURIComponent(afterId)}`);
        if (pageSize) parts.push(`pageSize=${encodeURIComponent(pageSize)}`);

        const res = await apiFetch(`/api/setlists?${parts.join('&')}`);
        if (!res.ok) return { data: [], nextCursor: null };
        const json = await res.json();
        return { data: json.items || [], nextCursor: json.nextCursor || null };
    } catch (err) {
        console.error("Error fetching set lists:", err);
        return { data: [], nextCursor: null };
    }
}

async function getSetList(id) {
    try {
        const res = await apiFetch(`/api/setlists/${encodeURIComponent(id)}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.error("Error fetching set list:", err);
        return null;
    }
}

async function createSetList(setlist) {
    try {
        const res = await apiFetch(`/api/setlists/`, {
            method: 'POST',
            body: JSON.stringify(setlist)
        });
        if (!res.ok) {
            const text = await res.text();
            console.error('Error creating set list:', res.status, text);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error("Error creating set list:", err);
        return null;
    }
}

async function updateSetList(id, setlist) {
    try {
        const res = await apiFetch(`/api/setlists/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(setlist)
        });
        if (!res.ok && res.status !== 204) {
            const text = await res.text();
            console.error('Error updating set list:', res.status, text);
            return null;
        }
        return true;
    } catch (err) {
        console.error("Error updating set list:", err);
        return null;
    }
}

async function deleteSetList(id) {
    try {
        const res = await apiFetch(`/api/setlists/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) {
            const text = await res.text();
            console.error('Error deleting set list:', res.status, text);
            return null;
        }
        return true;
    } catch (err) {
        console.error("Error deleting set list:", err);
        return null;
    }
}

const handleCopyLink = async (id) => {
    const url = `${window.location.origin}/setlists/share/${id}`;
    await navigator.clipboard.writeText(url);
};

const handlePreview = async (id) => {
    const url = `${window.location.origin}/setlists/share/${id}`;
    window.open(url, '_blank');
};

export { getSetLists, getSetList, createSetList, updateSetList, deleteSetList, handleCopyLink, handlePreview };