import { apiFetch } from './api';

function toOutputPayload(output, setListId, order) {
    return {
        id: output.id ?? output.Id ?? null,
        setListId,
        chordSheetId: output.song ?? output.chordSheetId ?? output.ChordSheetId,
        targetKey: output.targetKey ?? output.TargetKey,
        capo: output.capo ?? output.Capo ?? 0,
        order,
    };
}

async function createOutput(output) {
    const res = await apiFetch(`/api/outputs/`, {
        method: 'POST',
        body: JSON.stringify(output),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error creating output: ${res.status} ${text}`);
    }

    return await res.json();
}

async function updateOutput(id, output) {
    const res = await apiFetch(`/api/outputs/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(output),
    });

    if (!res.ok && res.status !== 204) {
        const text = await res.text();
        throw new Error(`Error updating output: ${res.status} ${text}`);
    }

    return true;
}

async function deleteOutput(id) {
    const res = await apiFetch(`/api/outputs/${encodeURIComponent(id)}`, { method: 'DELETE' });

    if (!res.ok && res.status !== 204) {
        const text = await res.text();
        throw new Error(`Error deleting output: ${res.status} ${text}`);
    }

    return true;
}

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

async function syncOutputs(setListId, outputs, existingOutputs = null) {
    try {
        const persisted = existingOutputs ?? await getOutputs(setListId);
        if (!persisted) {
            return null;
        }

        const nextOutputs = outputs.map((output, index) => toOutputPayload(output, setListId, index));
        const existingById = new Map(persisted.filter(o => o.id).map(o => [String(o.id), o]));
        const nextById = new Map(nextOutputs.filter(o => o.id).map(o => [String(o.id), o]));

        const deletedIds = persisted
            .filter(o => o.id && !nextById.has(String(o.id)))
            .map(o => o.id);

        const updatedOutputs = nextOutputs.filter(o => o.id && existingById.has(String(o.id)));
        const createdOutputs = nextOutputs.filter(o => !o.id);

        await Promise.all([
            ...deletedIds.map(id => deleteOutput(id)),
            ...updatedOutputs.map(output => updateOutput(output.id, output)),
        ]);

        const created = await Promise.all(createdOutputs.map(output => createOutput(output)));

        const createdQueue = [...created];
        return nextOutputs.map((output) => {
            if (output.id) {
                return output;
            }

            const createdOutput = createdQueue.shift();
            return createdOutput ? { ...createdOutput, setListId, order: output.order } : output;
        }).filter(Boolean);
    } catch (err) {
        console.error("Error syncing outputs:", err);
        return null;
    }
}

function getCapoText(capoValue) {
    const normalized = Number(capoValue);

    if (normalized === 1)
        return `${normalized}st fret`;
    if (normalized === 2)
        return `${normalized}nd fret`;
    if (normalized === 3)
        return `${normalized}rd fret`;

    return `${normalized}th fret`;
}

export { createOutput, deleteOutput, getOutputs, getCapoText, syncOutputs, updateOutput };
