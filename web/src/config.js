let config = null;

export async function loadConfig() {
    if (!config) {
        const res = await fetch('/api/config');
        config = await res.json();
    }
    return config;
}
