// Lightweight API helper to respect NEXT_PUBLIC_APP_URL when provided
// - If the provided path starts with '/' and NEXT_PUBLIC_APP_URL is set
//   and its origin differs from the current window origin, the helper
//   prefixes the path with NEXT_PUBLIC_APP_URL so client fetches hit
//   the configured production server.
export function apiUrl(path: string): string {
    if (!path || !path.startsWith('/')) return path;

    const base = process.env.NEXT_PUBLIC_APP_URL || '';
    if (!base) return path;

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
