import { apiFetch } from './utils/api';

let config = null;

export async function loadConfig() {
    if (!config) {
        const res = await apiFetch('/api/config');
        config = await res.json();
    }
    return config;
}
