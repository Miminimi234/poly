import { NextResponse } from 'next/server';

// Breeding endpoints deprecated — return 410 Gone
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Breeding feature has been removed' },
    { status: 410 }
  );
}

