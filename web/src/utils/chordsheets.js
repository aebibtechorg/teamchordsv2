import { apiFetch } from "./api";

// Cursor-based fetch for chordsheets. Options: { search, afterCreatedAt, afterId, pageSize }
async function getChordsheetsCursor(orgId, { search = "", afterCreatedAt = null, afterId = null, pageSize = 12 } = {}) {
    try {
        const parts = [`orgId=${encodeURIComponent(orgId)}`];
        if (search) parts.push(`search=${encodeURIComponent(search)}`);
        if (afterCreatedAt) parts.push(`afterCreatedAt=${encodeURIComponent(afterCreatedAt)}`);
        if (afterId) parts.push(`afterId=${encodeURIComponent(afterId)}`);
        if (pageSize) parts.push(`pageSize=${encodeURIComponent(pageSize)}`);

        const url = `/api/chordsheets?${parts.join('&')}`;
        const res = await apiFetch(url);
        if (!res.ok) return { data: [], nextCursor: null };
        const json = await res.json();
        return { data: json.items || [], nextCursor: json.nextCursor || null };
    } catch (err) {
        console.error("Error fetching chordsheets:", err);
        return { data: [], nextCursor: null };
    }
}

// Helper used by async select in SetListForm
async function searchChordsheets(orgId, inputValue, pageSize = 20) {
    const { data } = await getChordsheetsCursor(orgId, { search: inputValue, pageSize });
    return data || [];
}

async function getChordsheet(id) {
    try {
        const res = await apiFetch(`/api/chordsheets/${encodeURIComponent(id)}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.error("Error fetching chordsheet:", err);
        return null;
    }
}

async function createChordsheet(chordsheet) {
    try {
        const res = await apiFetch(`/api/chordsheets/`, {
            method: 'POST',
            body: JSON.stringify(chordsheet)
        });
        if (!res.ok) {
            const text = await res.text();
            console.error('Error creating chordsheet:', res.status, text);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error("Error creating chordsheet:", err);
        return null;
    }
}

async function updateChordsheet(id, chordsheet) {
    try {
        const res = await apiFetch(`/api/chordsheets/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(chordsheet)
        });
        if (!res.ok && res.status !== 204) {
            const text = await res.text();
            console.error('Error updating chordsheet:', res.status, text);
            return null;
        }
        // API returns 204 NoContent on success
        return true;
    } catch (err) {
        console.error("Error updating chordsheet:", err);
        return null;
    }
}

// Add this function to your chordsheets utility file
const createChordsheetsBulk = async (chordsheets) => {
  const response = await apiFetch('/api/chordsheets/bulk', {
    method: 'POST',
    body: JSON.stringify(chordsheets),
  });
  if (!response.ok) {
    throw new Error('Failed to create chordsheets in bulk');
  }
  return response.json();
};

async function deleteChordsheet(id) {
    try {
        const res = await apiFetch(`/api/chordsheets/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
        if (!res.ok && res.status !== 204) {
            const text = await res.text();
            console.error('Error deleting chordsheet:', res.status, text);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Error deleting chordsheet:", err);
        return false;
    }
}

async function backupChordsheets(orgId) {
    try {
        const res = await apiFetch(`/api/chordsheets/backup?orgId=${encodeURIComponent(orgId)}`);
        return res;
    } catch (err) {
        console.error("Error backing up chordsheets:", err);
        throw err;
    }
}

export { getChordsheetsCursor, searchChordsheets, getChordsheet, createChordsheet, updateChordsheet, deleteChordsheet, createChordsheetsBulk, backupChordsheets };
