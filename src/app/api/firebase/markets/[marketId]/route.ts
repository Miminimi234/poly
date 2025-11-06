import { verifyAdminUser } from '@/lib/admin-auth-server';
import firebaseMarketCache from '@/lib/firebase-market-cache';
import { NextResponse } from 'next/server';

/**
 * Admin-protected endpoint for updating individual markets in Firebase
 * This allows real-time modifications of market data
 */

export async function PUT(request: Request, { params }: { params: Promise<{ marketId: string }> }) {
    try {
        // Verify admin access
        const { isAdmin, error } = await verifyAdminUser();

        if (!isAdmin) {
            return NextResponse.json(
                { error: error || 'Admin privileges required' },
                { status: 403 }
            );
        }

        const { marketId } = await params;
        const updates = await request.json();

        console.log(`[Firebase Admin] Updating market ${marketId}...`);

        // Update the market in Firebase
        await firebaseMarketCache.updateMarket(marketId, updates);

        // Get the updated market to return
        const updatedMarket = await firebaseMarketCache.getMarket(marketId);

        return NextResponse.json({
            success: true,
            message: `Market ${marketId} updated successfully`,
            market: updatedMarket
        });

    } catch (error: any) {
        console.error(`[Firebase Admin] Market update error:`, error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: Request, { params }: { params: Promise<{ marketId: string }> }) {
    try {
        const { marketId } = await params;

        console.log(`[Firebase] Getting market ${marketId}...`);

        // Get the market from Firebase
        const market = await firebaseMarketCache.getMarket(marketId);

        if (!market) {
            return NextResponse.json(
                { success: false, error: 'Market not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            market
        });

    } catch (error: any) {
        console.error(`[Firebase] Get market error:`, error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ marketId: string }> }) {
    try {
        // Verify admin access
        const { isAdmin, error } = await verifyAdminUser();

        if (!isAdmin) {
            return NextResponse.json(
                { error: error || 'Admin privileges required' },
                { status: 403 }
            );
        }

        const { marketId } = await params;

        console.log(`[Firebase Admin] Deleting market ${marketId}...`);

        // Delete the market from Firebase
        await firebaseMarketCache.deleteMarket(marketId);

        return NextResponse.json({
            success: true,
            message: `Market ${marketId} deleted successfully`
        });

    } catch (error: any) {
        console.error(`[Firebase Admin] Market deletion error:`, error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}