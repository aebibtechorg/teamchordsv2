import { apiFetch } from './api';
import { SetListDto, SetListDetailDto } from '../types/api';

export interface SetListsCursorParams {
  search?: string;
  afterCreatedAt?: string | null;
  afterId?: string | null;
  pageSize?: number;
}

export interface SetListsCursorResponse {
  data: SetListDto[];
  nextCursor: { createdAt: string; id: string } | null;
}

export async function getSetLists(
  orgId?: string,
  { search = '', afterCreatedAt = null, afterId = null, pageSize = 50 }: SetListsCursorParams = {}
): Promise<SetListsCursorResponse> {
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
    console.error('Error fetching set lists:', err);
    return { data: [], nextCursor: null };
  }
}

export async function getSetList(id: string): Promise<SetListDetailDto> {
  const res = await apiFetch(`/api/setlists/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw error;
  }
  return await res.json();
}

export async function createSetList(setlist: Partial<SetListDto>): Promise<SetListDto> {
  const res = await apiFetch(`/api/setlists/`, {
    method: 'POST',
    body: JSON.stringify(setlist),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw error;
  }
  return await res.json();
}

export async function updateSetList(id: string, setlist: Partial<SetListDto>): Promise<boolean> {
  const res = await apiFetch(`/api/setlists/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(setlist),
  });
  if (!res.ok && res.status !== 204) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw error;
  }
  return true;
}

export async function deleteSetList(id: string): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/setlists/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const text = await res.text();
      console.error('Error deleting set list:', res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting set list:', err);
    return false;
  }
}
