import { NextResponse } from 'next/server';

// Define admin emails from environment variables
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

/**
 * Simple email-based admin authentication
 * Just checks if email is in the admin list
 */
export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if email is in admin list
        const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase().trim());

        if (isAdminEmail) {
            console.log(`[Admin Auth] Admin access granted to: ${email}`);

            // Set a simple session cookie to mark as admin
            const response = NextResponse.json({
                success: true,
                message: 'Admin access granted',
                isAdmin: true
            });

            // Set admin session cookie (valid for 24 hours)
            response.cookies.set('admin-session', email, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 // 24 hours
            });

            return response;
        } else {
            console.log(`[Admin Auth] Access denied for email: ${email}`);
            return NextResponse.json(
                { success: false, error: 'This email is not authorized for admin access' },
                { status: 403 }
            );
        }

    } catch (error) {
        console.error('[Admin Auth] Email signin error:', error);
        return NextResponse.json(
            { success: false, error: 'Authentication system error' },
            { status: 500 }
        );
    }
}