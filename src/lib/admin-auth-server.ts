// Server-side admin authentication utilities

// Define admin user IDs or emails in environment variables
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

export interface AdminCheck {
    isAdmin: boolean;
    user: any;
    error?: string;
}

/**
 * Server-side admin verification
 * Call this in API routes that require admin access
 */
export async function verifyAdminUser(): Promise<AdminCheck> {
    try {
        // Import cookies from next/headers
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();

        // Check for admin session cookie
        const adminSession = cookieStore.get('admin-session');

        if (!adminSession) {
            return {
                isAdmin: false,
                user: null,
                error: 'Admin authentication required'
            };
        }

        // Verify the email in session is still in admin list
        const sessionEmail = adminSession.value;
        const isAdminEmail = ADMIN_EMAILS.includes(sessionEmail.toLowerCase().trim());

        if (!isAdminEmail) {
            console.log(`[Admin Auth] Session email no longer authorized: ${sessionEmail}`);
            return {
                isAdmin: false,
                user: null,
                error: 'Admin session invalid'
            };
        }

        return {
            isAdmin: true,
            user: { email: sessionEmail },
            error: undefined
        };

    } catch (error) {
        console.error('[Admin Auth] Verification failed:', error);
        return {
            isAdmin: false,
            user: null,
            error: 'Authentication system error'
        };
    }
}