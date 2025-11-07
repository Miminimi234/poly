import { NextResponse } from 'next/server';

// Trigger analysis for all agents (temporarily disabled to prevent conflicts)
export async function POST(request: Request) {
  try {
    console.log('Analysis trigger called - temporarily disabled to prevent API conflicts');

    return NextResponse.json({
      success: true,
      message: 'Analysis trigger temporarily disabled',
      agents: []
    });

  } catch (error: any) {
    console.error('Analysis trigger error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Optional GET endpoint for manual testing
export async function GET(request: Request) {
  return POST(request);
}

