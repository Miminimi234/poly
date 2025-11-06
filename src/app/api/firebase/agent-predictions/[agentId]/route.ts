import { firebaseAgentPredictions } from '@/lib/firebase-agent-predictions';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;

        if (!agentId) {
            return NextResponse.json(
                { success: false, error: 'Agent ID is required' },
                { status: 400 }
            );
        }

        // Get all predictions for this agent
        const predictions = await firebaseAgentPredictions.getPredictionsByAgent(agentId, 100);

        console.log(`✅ Firebase agent predictions retrieved for ${agentId}:`, predictions.length);

        return NextResponse.json({
            success: true,
            predictions,
            agent_id: agentId,
            count: predictions.length,
            source: 'firebase'
        });

    } catch (error: any) {
        console.error(`❌ Failed to get Firebase agent predictions for ${await params.then(p => p.agentId)}:`, error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                source: 'firebase'
            },
            { status: 500 }
        );
    }
}