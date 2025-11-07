import { verifyAdminUser } from '@/lib/admin-auth-server';
import { NextResponse } from 'next/server';

/**
 * Admin-protected market refresh endpoint
 */
export async function POST() {
    try {
        // Verify admin access
        const { isAdmin, error } = await verifyAdminUser();

        if (!isAdmin) {
            return NextResponse.json(
                { error: error || 'Admin privileges required' },
                { status: 403 }
            );
        }

        console.log('[Admin API] Refreshing markets...');

        // Determine the base URL for internal API calls
        // Railway provides PUBLIC_DOMAIN automatically, also check other common variables
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL
            || (process.env.PUBLIC_DOMAIN && `https://${process.env.PUBLIC_DOMAIN}`)
            || (process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`)
            || (process.env.RAILWAY_STATIC_URL)
            || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`)
            || 'http://localhost:3000';

        console.log('[Admin API] Environment check:');
        console.log('- NODE_ENV:', process.env.NODE_ENV);
        console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'not set');
        console.log('- PUBLIC_DOMAIN:', process.env.PUBLIC_DOMAIN || 'not set');
        console.log('- RAILWAY_PUBLIC_DOMAIN:', process.env.RAILWAY_PUBLIC_DOMAIN || 'not set');
        console.log('- RAILWAY_STATIC_URL:', process.env.RAILWAY_STATIC_URL || 'not set');
        console.log('- VERCEL_URL:', process.env.VERCEL_URL || 'not set');
        console.log('[Admin API] Resolved base URL:', baseUrl);

        const apiUrl = `${baseUrl}/api/polymarket/markets?refresh=true`;
        console.log('[Admin API] Making internal API call to:', apiUrl);

        let response;
        let data;

        try {
            // Call polymarket markets endpoint with refresh (no limit to get all markets)
            response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add timeout to prevent hanging
                signal: AbortSignal.timeout(60000) // 60 second timeout for external API calls
            });

            console.log('[Admin API] Internal API call completed with status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Admin API] Markets API returned error:', response.status, response.statusText, errorText);
                return NextResponse.json({
                    success: false,
                    error: `Markets API error: ${response.status} ${response.statusText}`,
                    details: errorText
                });
            }

            console.log('[Admin API] Parsing response JSON...');
            data = await response.json();
            console.log('[Admin API] Response parsed successfully:', { success: data.success, count: data.count });

        } catch (fetchError: any) {
            console.error('[Admin API] Fetch error:', fetchError);

            if (fetchError.name === 'AbortError') {
                return NextResponse.json({
                    success: false,
                    error: 'Request timeout - Polymarket API took too long to respond'
                });
            }

            return NextResponse.json({
                success: false,
                error: `Network error: ${fetchError.message}`
            });
        }

        if (data.success) {
            return NextResponse.json({
                success: true,
                message: `Refreshed ${data.count} markets`,
                count: data.count,
                source: data.source
            });
        } else {
            return NextResponse.json({
                success: false,
                error: data.error || 'Failed to refresh markets'
            });
        }

    } catch (error: any) {
        console.error('[Admin API] Market refresh error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}