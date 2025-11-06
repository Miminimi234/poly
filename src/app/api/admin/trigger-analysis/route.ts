import { firebaseAgentAnalysisEngine } from '@/lib/firebase-agent-analysis-engine';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Get request body for admin identification
        const body = await request.json().catch(() => ({}));
        const triggeredBy = body.triggeredBy || 'admin';

        console.log(`🚀 Admin triggered agent analysis by: ${triggeredBy}`);

        // Trigger the analysis
        const session = await firebaseAgentAnalysisEngine.triggerAgentAnalysis(triggeredBy);

        return NextResponse.json({
            success: true,
            message: `Agent analysis ${session.status}`,
            session: {
                sessionId: session.sessionId,
                status: session.status,
                totalAgents: session.totalAgents,
                totalMarkets: session.totalMarkets,
                totalPredictions: session.totalPredictions,
                errors: session.errors,
                startTime: session.startTime,
                endTime: session.endTime
            }
        });

    } catch (error: any) {
        console.error('❌ Admin trigger failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                message: 'Agent analysis failed'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // Get current analysis statistics
        const stats = await firebaseAgentAnalysisEngine.getAnalysisStats();

        return NextResponse.json({
            success: true,
            stats
        });

    } catch (error: any) {
        console.error('❌ Failed to get analysis stats:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}