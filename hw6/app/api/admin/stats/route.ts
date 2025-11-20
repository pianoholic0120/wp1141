import { NextResponse } from 'next/server';
import { calculateStats } from '@/services/analytics.service';

// 明确指定使用 Node.js runtime（需要 MongoDB 连接）
export const runtime = 'nodejs';
export const preferredRegion = 'sfo1';
export async function GET() {
  try {
    const stats = await calculateStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to calculate stats:', error);
    return NextResponse.json({ error: 'Failed to calculate stats' }, { status: 500 });
  }
}
