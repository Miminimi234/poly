import { verifyAdminUser } from '@/lib/admin-auth-server';
import { firebaseAgentAnalysisEngine } from '@/lib/firebase-agent-analysis-engine';
import { NextResponse } from 'next/server';

export async function POST(request: Request, context: { params: Promise<{ marketId: string }> }) {
    try {
        // Verify admin status
        const { isAdmin, error } = await verifyAdminUser();

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: error || 'Admin privileges required' },
                { status: 403 }
            );
        }

        // Await params in Next.js 15
        const params = await context.params;
        const marketId = params.marketId;

        if (!marketId) {
            return NextResponse.json(
                { success: false, error: 'Market ID is required' },
                { status: 400 }
            );
        }

        console.log(`🎯 Admin triggered single market analysis: ${marketId}`);

        // Trigger analysis for specific market
        const result = await firebaseAgentAnalysisEngine.triggerSingleMarketAnalysis(marketId);

        return NextResponse.json({
            success: true,
            message: `Analysis triggered for market ${marketId}`,
            result: {
                marketId,
                agentsTriggered: result.agentsTriggered,
                predictionsGenerated: result.predictionsGenerated,
                errors: result.errors
            }
        });

    } catch (error: any) {
        console.error('❌ Single market analysis failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                message: 'Market analysis failed'
            },
            { status: 500 }
        );
    }
}