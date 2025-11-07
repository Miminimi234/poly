import { verifyAdminUser } from '@/lib/admin-auth-server';
import { firebaseAgentPredictions } from '@/lib/firebase-agent-predictions';
import { NextResponse } from 'next/server';

/**
 * Test Firebase Admin SDK write capabilities
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

        console.log('🧪 [Firebase Test] Testing Firebase Admin SDK write capability...');

        // Test prediction data
        const testPrediction = {
            agent_id: 'test-agent',
            agent_name: 'Test Agent',
            market_id: 'test-market-123',
            market_question: 'Test Market Question?',
            prediction: 'YES' as const,
            confidence: 0.75,
            reasoning: 'This is a test prediction to verify Firebase Admin SDK write capability',
            research_cost: 0.1,
            research_sources: ['test'],
            price_at_prediction: 0.6,
            bet_amount: 10,
            entry_odds: {
                yes_price: 0.6,
                no_price: 0.4
            },
            expected_payout: 16.67,
            position_status: 'OPEN' as const,
            resolved: false
        };

        // Try to save the test prediction
        const predictionId = await firebaseAgentPredictions.savePrediction(testPrediction);

        console.log('✅ [Firebase Test] Test prediction saved successfully:', predictionId);

        // Try to retrieve it
        const retrievedPredictions = await firebaseAgentPredictions.getRecentPredictions(1);

        return NextResponse.json({
            success: true,
            message: 'Firebase Admin SDK write test successful',
            data: {
                savedPredictionId: predictionId,
                retrievedCount: retrievedPredictions.length,
                testPrediction: retrievedPredictions.length > 0 ? retrievedPredictions[0] : null
            }
        });

    } catch (error: any) {
        console.error('❌ [Firebase Test] Write test failed:', error);

        // Check if it's a permission error
        const isPermissionError = error.message?.includes('permission') ||
            error.message?.includes('Permission') ||
            error.code === 'PERMISSION_DENIED';

        return NextResponse.json(
            {
                success: false,
                error: error.message,
                isPermissionError,
                suggestion: isPermissionError
                    ? 'Update Firebase Database Rules to allow authenticated writes: ".write": "auth != null"'
                    : 'Check Firebase Admin SDK configuration and credentials'
            },
            { status: 500 }
        );
    }
}