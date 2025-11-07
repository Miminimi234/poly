import { verifyAdminUser } from '@/lib/admin-auth-server';
import firebaseMarketCache from '@/lib/firebase-market-cache';
import { NextResponse } from 'next/server';

/**
 * Admin-protected Firebase refresh endpoint - refreshes from Polymarket API to Firebase
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

        console.log('[Firebase Admin] Refreshing markets to Firebase...');

        // Determine the base URL for internal API calls
        // Railway-optimized URL resolution (prioritize Railway variables)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL
            || (process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`)
            || (process.env.RAILWAY_STATIC_URL)
            || (process.env.PUBLIC_DOMAIN && `https://${process.env.PUBLIC_DOMAIN}`)
            || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`)
            || 'http://localhost:3000';

        console.log('[Firebase Admin] Railway environment check:');
        console.log('- NODE_ENV:', process.env.NODE_ENV);
        console.log('- RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'not set');
        console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'not set');
        console.log('- RAILWAY_PUBLIC_DOMAIN:', process.env.RAILWAY_PUBLIC_DOMAIN || 'not set');
        console.log('- RAILWAY_STATIC_URL:', process.env.RAILWAY_STATIC_URL || 'not set');
        console.log('- PUBLIC_DOMAIN:', process.env.PUBLIC_DOMAIN || 'not set');
        console.log('[Firebase Admin] Resolved base URL:', baseUrl);

        const apiUrl = `${baseUrl}/api/polymarket/markets?refresh=true`;
        console.log('[Firebase Admin] Making internal API call to:', apiUrl);

        let response;
        let data;

        try {
            // Call the polymarket markets endpoint with refresh to populate Firebase
            response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add timeout to prevent hanging
                signal: AbortSignal.timeout(60000) // 60 second timeout
            });

            console.log('[Firebase Admin] Internal API call completed with status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Firebase Admin] Markets API returned error:', response.status, response.statusText, errorText);
                return NextResponse.json({
                    success: false,
                    error: `Markets API error: ${response.status} ${response.statusText}`,
                    details: errorText
                });
            }

            console.log('[Firebase Admin] Parsing response JSON...');
            data = await response.json();
            console.log('[Firebase Admin] Response parsed successfully:', { success: data.success, count: data.count });

        } catch (fetchError: any) {
            console.error('[Firebase Admin] Fetch error:', fetchError);

            if (fetchError.name === 'AbortError') {
                return NextResponse.json({
                    success: false,
                    error: 'Request timeout - Markets API took too long to respond'
                });
            }

            return NextResponse.json({
                success: false,
                error: `Network error: ${fetchError.message}`
            });
        }

        if (data.success) {
            // Get Firebase stats after refresh
            const firebaseStats = await firebaseMarketCache.getStats();

            return NextResponse.json({
                success: true,
                message: `Firebase refreshed with ${data.count} markets`,
                count: data.count,
                totalAvailable: data.totalAvailable,
                source: data.source,
                firebaseStats: firebaseStats
            });
        } else {
            return NextResponse.json({
                success: false,
                error: data.error || 'Failed to refresh Firebase from Polymarket'
            });
        }

    } catch (error: any) {
        console.error('[Firebase Admin] Refresh error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}