import { firebaseAgentPredictions } from '@/lib/firebase-agent-predictions';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        // Get recent predictions from Firebase
        const predictions = await firebaseAgentPredictions.getRecentPredictions(limit);

        // Format for UI display
        const formattedPredictions = predictions.map(pred => ({
            id: pred.id,
            agent_id: pred.agent_id,
            agent_name: pred.agent_name,
            agent_avatar: '🤖', // Default avatar, could be enhanced
            agent_model: 'OpenAI GPT-4',
            market_question: pred.market_question,
            prediction: pred.prediction,
            confidence: pred.confidence,
            reasoning: pred.reasoning,
            created_at: pred.created_at,
            resolved: pred.resolved,
            correct: pred.correct,
            profit_loss: pred.profit_loss
        }));

        return NextResponse.json({
            success: true,
            predictions: formattedPredictions,
            count: formattedPredictions.length,
            source: 'firebase'
        });

    } catch (error: any) {
        console.error('❌ Failed to fetch Firebase predictions for UI:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                predictions: [],
                source: 'firebase'
            },
            { status: 500 }
        );
    }
}