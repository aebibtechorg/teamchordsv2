import { apiFetch } from './api';
import { OutputDto, OutputDetailDto } from '../types/api';

export function toOutputPayload(output: any, setListId: string, order: number): Partial<OutputDto> {
  return {
    id: output.id ?? output.Id ?? undefined,
    setListId,
    chordSheetId: output.song ?? output.chordSheetId ?? output.ChordSheetId,
    targetKey: output.targetKey ?? output.TargetKey,
    capo: output.capo ?? output.Capo ?? 0,
    order,
  };
}

export async function createOutput(output: Partial<OutputDto>): Promise<OutputDto> {
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

export async function updateOutput(id: string, output: Partial<OutputDto>): Promise<boolean> {
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

export async function deleteOutput(id: string): Promise<boolean> {
  const res = await apiFetch(`/api/outputs/${encodeURIComponent(id)}`, { method: 'DELETE' });

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Error deleting output: ${res.status} ${text}`);
  }

  return true;
}

export async function getOutputs(setListId: string): Promise<OutputDetailDto[] | null> {
  try {
    const res = await apiFetch(`/api/outputs?setListId=${encodeURIComponent(setListId)}&page=1&pageSize=10000`);
    if (!res.ok) return null;
    const json = await res.json();
    const outputs: OutputDto[] = json.items || [];
    const chordIds = Array.from(new Set(outputs.filter((o) => o.chordSheetId).map((o) => o.chordSheetId!)));
    const chordMap = new Map<string, any>();
    await Promise.all(
      chordIds.map(async (id) => {
        try {
          const r = await apiFetch(`/api/chordsheets/${encodeURIComponent(id)}`);
          if (r.ok) chordMap.set(id, await r.json());
        } catch (e) {
          // ignore
        }
      })
    );
    const enriched: OutputDetailDto[] = outputs.map((o) => ({
      ...o,
      chordsheets: o.chordSheetId && chordMap.get(o.chordSheetId) ? { key: chordMap.get(o.chordSheetId).key, content: chordMap.get(o.chordSheetId).content } : undefined,
    }));
    return enriched.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.error('Error getting outputs:', err);
    return null;
  }
}

export async function syncOutputs(setListId: string, outputs: any[], existingOutputs: OutputDetailDto[] | null = null) {
  try {
    const persisted = existingOutputs ?? (await getOutputs(setListId));
    if (!persisted) {
      return null;
    }

    const nextOutputs = outputs.map((output, index) => toOutputPayload(output, setListId, index));
    const existingById = new Map(persisted.filter((o) => o.id).map((o) => [String(o.id), o]));
    const nextById = new Map(nextOutputs.filter((o) => o.id).map((o) => [String(o.id), o]));

    const deletedIds = persisted.filter((o) => o.id && !nextById.has(String(o.id))).map((o) => o.id!);

    const updatedOutputs = nextOutputs.filter((o) => o.id && existingById.has(String(o.id)));
    const createdOutputs = nextOutputs.filter((o) => !o.id);

    await Promise.all([
      ...deletedIds.map((id) => deleteOutput(id)),
      ...updatedOutputs.map((output) => updateOutput(output.id!, output)),
    ]);

    const created = await Promise.all(createdOutputs.map((output) => createOutput(output)));

    const createdQueue = [...created];
    return nextOutputs
      .map((output) => {
        if (output.id) {
          return output;
        }

        const createdOutput = createdQueue.shift();
        return createdOutput ? { ...createdOutput, setListId, order: output.order } : output;
      })
      .filter(Boolean);
  } catch (err) {
    console.error('Error syncing outputs:', err);
    return null;
  }
}

export function getCapoText(capoValue: number | string | undefined): string {
  const normalized = Number(capoValue || 0);

  if (normalized === 1) return `${normalized}st fret`;
  if (normalized === 2) return `${normalized}nd fret`;
  if (normalized === 3) return `${normalized}rd fret`;

  return `${normalized}th fret`;
}
