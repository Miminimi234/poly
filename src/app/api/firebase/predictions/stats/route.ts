import { CELEBRITY_AGENTS } from '@/lib/celebrity-agents';
import { firebaseAgentPredictions } from '@/lib/firebase-agent-predictions';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');

        console.log('📊 Calculating Firebase prediction stats for agent:', agentId || 'all');

        let predictions;
        if (agentId) {
            predictions = await firebaseAgentPredictions.getPredictionsByAgent(agentId, 1000);
        } else {
            // Get stats for all agents
            const allStats = await Promise.all(
                CELEBRITY_AGENTS.map(agent =>
                    firebaseAgentPredictions.getPredictionsByAgent(agent.id, 1000)
                )
            );
            predictions = allStats.flat();
        }

        // Calculate statistics
        const total = predictions.length;
        const resolved = predictions.filter(p => p.resolved).length;
        const unresolved = total - resolved;
        const correct = predictions.filter(p => p.correct === true).length;
        const incorrect = predictions.filter(p => p.correct === false).length;
        const accuracy = resolved > 0 ? ((correct / resolved) * 100).toFixed(1) : '0.0';

        const yesPredictions = predictions.filter(p => p.prediction === 'YES').length;
        const noPredictions = predictions.filter(p => p.prediction === 'NO').length;

        const totalResearchCost = predictions.reduce((sum, p) => sum + p.research_cost, 0);
        const totalProfitLoss = predictions.reduce((sum, p) => sum + (p.profit_loss || 0), 0);

        const avgConfidence = total > 0 ?
            ((predictions.reduce((sum, p) => sum + p.confidence, 0) / total) * 100).toFixed(1) :
            '0.0';

        // Calculate win streaks
        const resolvedPredictions = predictions
            .filter(p => p.resolved && p.correct !== null)
            .sort((a, b) => new Date(b.resolved_at!).getTime() - new Date(a.resolved_at!).getTime());

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Current streak (from most recent)
        for (const pred of resolvedPredictions) {
            if (pred.correct) {
                if (currentStreak === tempStreak) {
                    currentStreak++;
                }
                tempStreak++;
            } else {
                break;
            }
        }

        // Longest streak ever
        tempStreak = 0;
        for (const pred of resolvedPredictions.reverse()) { // Chronological order
            if (pred.correct) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        const stats = {
            total,
            resolved,
            unresolved,
            correct,
            incorrect,
            accuracy,
            yesPredictions,
            noPredictions,
            totalResearchCost: totalResearchCost.toFixed(2),
            totalProfitLoss: totalProfitLoss.toFixed(2),
            avgConfidence,
            currentStreak,
            longestStreak
        };

        console.log('✅ Firebase prediction stats calculated:', stats);

        return NextResponse.json({
            success: true,
            stats,
            source: 'firebase'
        });

    } catch (error: any) {
        console.error('❌ Failed to calculate Firebase prediction stats:', error);
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