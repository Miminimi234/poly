import { getCelebrityAgents, seedCelebrityAgents } from '@/lib/db/agents';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Fetch celebrity agents
    let agents = getCelebrityAgents();

    // If no agents exist (common in production/fresh deployments), seed them automatically
    if (agents.length === 0) {
      console.log('No celebrity agents found, seeding database...');
      await seedCelebrityAgents();
      agents = getCelebrityAgents(); // Fetch again after seeding
    }

    // Parse traits JSON string back to object
    const formattedAgents = agents.map(agent => ({
      ...agent,
      traits: agent.traits ? JSON.parse(agent.traits) : null,
      // agent.is_celebrity may be stored as a number (0/1) or boolean; coerce to boolean
      is_celebrity: !!agent.is_celebrity,
      is_active: true,
      is_bankrupt: false
    }));

    return NextResponse.json({
      success: true,
      agents: formattedAgents
    });

  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
