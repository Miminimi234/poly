// Lightweight API helper to respect NEXT_PUBLIC_APP_URL when provided
// Behavior:
// - If running in development (NODE_ENV !== 'production') we prefer relative
//   paths so the dev server handles requests locally. This avoids accidentally
//   hitting a remote production URL during local development when
//   NEXT_PUBLIC_APP_URL is set.
// - In production we will prefix paths with NEXT_PUBLIC_APP_URL when it's set.
// - Set NEXT_PUBLIC_FORCE_REMOTE_API=true to force using NEXT_PUBLIC_APP_URL
//   even in development (useful for testing against a remote backend).

export function apiUrl(path: string): string {
    if (!path || !path.startsWith('/')) return path;

    const base = process.env.NEXT_PUBLIC_APP_URL || '';
    if (!base) return path;

    // If explicitly forced, allow remote API in dev
    const forceRemote = String(process.env.NEXT_PUBLIC_FORCE_REMOTE_API || '').toLowerCase() === 'true';

    // Only use the configured NEXT_PUBLIC_APP_URL in production or when forced.
    if (process.env.NODE_ENV !== 'production' && !forceRemote) {
        return path; // prefer relative path during local development
    }

    try {
        // If running in the browser and the configured base has the same origin
        // as the current page, use the relative path to avoid unnecessary absolute URLs.
        if (typeof window !== 'undefined') {
            const baseOrigin = new URL(base).origin;
            if (baseOrigin === window.location.origin) return path;
        }
    } catch (e) {
        // If NEXT_PUBLIC_APP_URL is invalid, fall back to relative path
        return path;
    }

    return base.replace(/\/$/, '') + path;
}

export function apiFetch(input: string, init?: RequestInit) {
    return fetch(apiUrl(input), init as any);
}

export default apiFetch;
