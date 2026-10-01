import { getApiBaseUrl } from './api';

export function getSignalRHubUrl(hubPath: string, queryParams: Record<string, any> = {}): string {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = hubPath.startsWith('/') ? hubPath : `/${hubPath}`;

  const url = new URL(normalizedPath, `${baseUrl || 'http://localhost'}/`);

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}
