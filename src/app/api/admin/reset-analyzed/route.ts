import { firebaseAgentAnalysisEngine } from '@/lib/firebase-agent-analysis-engine';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const confirmedBy = body.confirmedBy || 'admin';

        console.log(`🔄 Admin reset analyzed status and clearing predictions by: ${confirmedBy}`);

        // Reset analyzed status for all markets and clear all predictions
        await firebaseAgentAnalysisEngine.resetAnalyzedStatus();

        return NextResponse.json({
            success: true,
            message: 'All markets marked as unanalyzed and all agent predictions cleared',
            resetBy: confirmedBy,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ Reset analyzed status failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                message: 'Failed to reset analyzed status'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        success: false,
        message: 'Use POST to reset analyzed status'
    }, { status: 405 });
}