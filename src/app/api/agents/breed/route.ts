import { NextResponse } from 'next/server';

// Agent-breeding route deprecated — return 410 Gone
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Agent breeding has been removed' },
    { status: 410 }
  );
}

