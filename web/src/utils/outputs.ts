import { apiFetch } from './api';

async function getOutputs(setListId) {
    try {
        // fetch outputs for the set list (get many)
        const res = await apiFetch(`/api/outputs?setListId=${encodeURIComponent(setListId)}&page=1&pageSize=10000`);
        if (!res.ok) return null;
        const json = await res.json();
        const outputs = json.items || [];
        // fetch unique chordsheets referenced so we can attach key/content like the original Supabase join
        const chordIds = Array.from(new Set(outputs.filter(o => o.chordSheetId).map(o => o.chordSheetId)));
        const chordMap = new Map();
        await Promise.all(chordIds.map(async id => {
            try {
                const r = await apiFetch(`/api/chordsheets/${encodeURIComponent(id)}`);
                if (r.ok) chordMap.set(id, await r.json());
            } catch (e) {
                // ignore
            }
        }));
        // attach chordsheet subset to each output like supabase did
        const enriched = outputs.map(o => ({ ...o, chordsheets: chordMap.get(o.chordSheetId) ? { key: chordMap.get(o.chordSheetId).key, content: chordMap.get(o.chordSheetId).content } : null }));
        return enriched.sort((a, b) => a.order - b.order);
    } catch (err) {
        console.error("Error getting outputs:", err);
        return null;
    }
}

async function createOutputs(outputs) {
    try {
        // outputs is expected to be an array of output DTOs
        const created = await Promise.all(outputs.map(async (o) => {
            const res = await apiFetch(`/api/outputs/`, {
                method: 'POST',
                body: JSON.stringify(o)
            });
            if (!res.ok) {
                const text = await res.text();
                console.error('Error creating output:', res.status, text);
                return null;
            }
            return await res.json();
        }));
        return created.filter(c => c !== null);
    } catch (err) {
        console.error("Error creating output:", err);
        return null;
    }
}

async function deleteOutputs(setListId) {
    try {
        const res = await apiFetch(`/api/outputs?setListId=${encodeURIComponent(setListId)}&page=1&pageSize=10000`);
        if (!res.ok) return null;
        const json = await res.json();
        const outputs = json.items || [];
        await Promise.all(outputs.map(async o => {
            try {
                await apiFetch(`/api/outputs/${encodeURIComponent(o.id)}`, { method: 'DELETE' });
            } catch (e) {
                // ignore individual failures
            }
        }));
        return true;
    } catch (err) {
        console.error("Error deleting output:", err);
        return null;
    }
}

function getCapoText(capoValue) {
    if (capoValue == 1)
        return `${capoValue}st fret`;
    if (capoValue == 2)
        return `${capoValue}nd fret`;
    if (capoValue == 3)
        return `${capoValue}rd fret`;

    return `${capoValue}th fret`;
}

export { createOutputs, deleteOutputs, getOutputs, getCapoText };