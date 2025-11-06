import { verifyAdminUser } from '@/lib/admin-auth-server';
import { NextResponse } from 'next/server';

/**
 * Admin verification API endpoint
 * Returns admin status for current user
 */
export async function GET() {
    try {
        const { isAdmin, user, error } = await verifyAdminUser();

        if (error) {
            return NextResponse.json(
                { isAdmin: false, error },
                { status: isAdmin ? 500 : 401 }
            );
        }

        return NextResponse.json({
            isAdmin,
            user: {
                id: user?.id,
                email: user?.email
            }
        });

    } catch (error) {
        console.error('[Admin API] Verification error:', error);
        return NextResponse.json(
            { isAdmin: false, error: 'System error' },
            { status: 500 }
        );
    }
}