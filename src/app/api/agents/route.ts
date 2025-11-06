import { getCelebrityAgents } from '@/lib/db/agents';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Since we're only dealing with celebrity agents now, always fetch celebrity agents
    const agents = getCelebrityAgents();

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
