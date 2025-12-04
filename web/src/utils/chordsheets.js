import { apiFetch } from "./api";

async function getChordsheets(orgId, pageIndex = 0, pageSize = 10, searchTerm = "") {
    try {
        // If there's a search term we want to match title OR artist.
        if (searchTerm) {
            // Fetch title matches and artist matches then merge client-side.
            const pageSizeForSearch = 10000;
                const [titleRes, artistRes] = await Promise.all([
                    apiFetch(`/api/chordsheets?orgId=${encodeURIComponent(orgId)}&title=${encodeURIComponent(searchTerm)}&page=1&pageSize=${pageSizeForSearch}`),
                    apiFetch(`/api/chordsheets?orgId=${encodeURIComponent(orgId)}&artist=${encodeURIComponent(searchTerm)}&page=1&pageSize=${pageSizeForSearch}`)
                ]);
            const titleJson = await titleRes.json();
            const artistJson = await artistRes.json();
            const all = (titleJson.items || []).concat(artistJson.items || []);
            // dedupe by id
            const map = new Map();
            all.forEach(i => map.set(i.id, i));
            const combined = Array.from(map.values()).sort((a, b) => (a.artist || '').localeCompare(b.artist || '') || (a.title || '').localeCompare(b.title || ''));

            if (pageSize === -1) {
                return { data: combined, count: combined.length };
            }

            const start = pageIndex * pageSize;
            const paged = combined.slice(start, start + pageSize);
            return { data: paged, count: combined.length };
        }

        // Normal (no search) - use server paging
        const page = (pageIndex || 0) + 1;
        const ps = pageSize === -1 ? 10000 : pageSize;
            const res = await apiFetch(`/api/chordsheets?orgId=${encodeURIComponent(orgId)}&page=${page}&pageSize=${ps}`);
        const json = await res.json();
        return { data: json.items || [], count: json.total || 0 };
    } catch (err) {
        console.error("Error fetching chordsheets:", err);
        return { data: [], count: 0 };
    }
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

export { getChordsheets, getChordsheet, createChordsheet, updateChordsheet };
