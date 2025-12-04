// Centralized fetch wrapper that attaches Authorization header using a token provider.
// By default the token provider will read from localStorage, but you can override
// it with `setTokenProvider` (useful to integrate with `useAuth0`).

// Default provider returns null — no fallback to localStorage.
let tokenProvider = async () => null;

export function setTokenProvider(fn) {
    tokenProvider = fn;
}

export async function apiFetch(input, init = {}) {
    const headers = new Headers(init.headers || {});

    try {
        const token = await tokenProvider();
        console.log("apiFetch: obtained token:", token);
        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    } catch (e) {
        // token provider failure should not block fetch — just continue without auth
        console.warn('tokenProvider threw an error', e);
    }

    // Default to JSON content-type when sending a body that's not FormData
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(input, { credentials: 'same-origin', ...init, headers });
    return res;
}

export default apiFetch;
