import { apiFetch } from './api';
import { ChordSheetDto, BulkUploadSummaryDto } from '../types/api';

export interface ChordsheetCursorParams {
  search?: string;
  afterCreatedAt?: string | null;
  afterId?: string | null;
  pageSize?: number;
}

export interface ChordsheetsCursorResponse {
  data: ChordSheetDto[];
  nextCursor: { createdAt: string; id: string } | null;
}

export async function getChordsheetsCursor(
  orgId?: string,
  { search = '', afterCreatedAt = null, afterId = null, pageSize = 12 }: ChordsheetCursorParams = {}
): Promise<ChordsheetsCursorResponse> {
  try {
    if (!orgId || String(orgId).trim() === '') {
      return { data: [], nextCursor: null };
    }

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
    console.error('Error fetching chordsheets:', err);
    return { data: [], nextCursor: null };
  }
}

export async function searchChordsheets(orgId: string, inputValue: string, pageSize = 20): Promise<ChordSheetDto[]> {
  if (!orgId || String(orgId).trim() === '') {
    return [];
  }

  const { data } = await getChordsheetsCursor(orgId, { search: inputValue, pageSize });
  return data || [];
}

export async function getChordsheet(id: string): Promise<ChordSheetDto> {
  const res = await apiFetch(`/api/chordsheets/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw error;
  }
  return await res.json();
}

export async function createChordsheet(chordsheet: Partial<ChordSheetDto>): Promise<ChordSheetDto> {
  const res = await apiFetch(`/api/chordsheets/`, {
    method: 'POST',
    body: JSON.stringify(chordsheet),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw error;
  }
  return await res.json();
}

export async function updateChordsheet(id: string, chordsheet: Partial<ChordSheetDto>): Promise<boolean> {
  const res = await apiFetch(`/api/chordsheets/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(chordsheet),
  });
  if (!res.ok && res.status !== 204) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw error;
  }
  return true;
}

export async function createChordsheetsBulk(payload: { dtos: Partial<ChordSheetDto>[]; connectionId: string }): Promise<BulkUploadSummaryDto> {
  const response = await apiFetch('/api/chordsheets/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw error;
  }
  return response.json();
}

export async function deleteChordsheet(id: string): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/chordsheets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      const text = await res.text();
      console.error('Error deleting chordsheet:', res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting chordsheet:', err);
    return false;
  }
}

export async function backupChordsheets(orgId: string): Promise<Response> {
  return await apiFetch(`/api/chordsheets/backup?orgId=${encodeURIComponent(orgId)}`);
}
