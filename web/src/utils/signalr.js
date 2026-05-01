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
function getSignalRHubUrl(hubPath) {
    const baseUrl = getBaseUrl();
    const normalizedPath = hubPath.startsWith('/') ? hubPath : `/${hubPath}`;
    if (!baseUrl) {
        return normalizedPath;
    }
    return new URL(normalizedPath, `${baseUrl}/`).toString();
}
export { getSignalRHubUrl };
