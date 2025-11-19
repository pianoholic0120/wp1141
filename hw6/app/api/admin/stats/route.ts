import { NextResponse } from 'next/server';
import { calculateStats } from '@/services/analytics.service';

export async function GET() {
  try {
    const stats = await calculateStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to calculate stats:', error);
    return NextResponse.json({ error: 'Failed to calculate stats' }, { status: 500 });
  }
}
