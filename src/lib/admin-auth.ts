// Admin authentication utilities
export interface AdminCheck {
    isAdmin: boolean;
    user: any;
    error?: string;
}

/**
 * Client-side admin check (for UI display only - not for security)
 * This is just for showing/hiding UI elements
 */
export async function checkAdminStatus(): Promise<boolean> {
    try {
        const response = await fetch('/api/admin/verify', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.isAdmin === true;

    } catch (error) {
        console.error('[Admin Check] Client verification failed:', error);
        return false;
    }
}