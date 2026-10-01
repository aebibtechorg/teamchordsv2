import { Platform } from 'react-native';
import { API_BASE_URL } from '../config';

let tokenProvider: () => Promise<string | null> = async () => null;

export function setTokenProvider(fn: () => Promise<string | null>) {
  tokenProvider = fn;
}

export function getApiBaseUrl(): string {
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    // If running in development proxy / local
    return window.location.origin;
  }

  // Mobile local dev default fallback (can be overridden via env)
  return 'http://localhost:5268';
}

export async function apiFetch(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});

  try {
    const token = await tokenProvider();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch (e) {
    console.warn('tokenProvider threw an error', e);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let finalUrl = input;
  if (typeof input === 'string' && input.startsWith('/')) {
    const base = getApiBaseUrl();
    finalUrl = `${base}${input}`;
  }

  const res = await fetch(finalUrl, { credentials: 'same-origin', ...init, headers });
  return res;
}

export default apiFetch;
