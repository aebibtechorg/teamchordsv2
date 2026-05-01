const getBaseUrl = () => {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
    if (configuredBaseUrl) {
        return configuredBaseUrl.replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }
    return '';
};
function getSignalRHubUrl(hubPath, queryParams = {}) {
    const baseUrl = getBaseUrl();
    const normalizedPath = hubPath.startsWith('/') ? hubPath : `/${hubPath}`;

    if (!baseUrl && (!queryParams || Object.keys(queryParams).length === 0)) {
        return normalizedPath;
    }

    const fallbackOrigin = typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost';
    const url = new URL(normalizedPath, `${baseUrl || fallbackOrigin}/`);

    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
        }
    });

    if (!baseUrl && typeof window !== 'undefined' && window.location?.origin === url.origin) {
        return `${url.pathname}${url.search}`;
    }

    return url.toString();
}
export { getSignalRHubUrl };
