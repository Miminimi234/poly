import { NextResponse } from 'next/server';

// Breeding endpoints deprecated — return 410 Gone
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Breeding feature has been removed' },
    { status: 410 }
  );
}
