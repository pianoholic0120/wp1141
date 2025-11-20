import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

// 明确指定使用 Node.js runtime（而不是 edge runtime）
// 这是必需的，因为我们需要使用 Node.js API（如 MongoDB 连接等）
export const runtime = 'nodejs';
export const preferredRegion = 'sfo1';
export async function GET() {
  try {
    // 檢查 MongoDB 連接狀態
    let dbStatus = 'disconnected';
    let dbName = '';
    
    try {
      await connectMongo();
      if (mongoose.connection.readyState === 1) {
        dbStatus = 'connected';
        dbName = mongoose.connection.name;
      }
    } catch (error) {
      dbStatus = 'error';
    }

    // 檢查環境變數（不暴露實際值，只檢查是否存在）
    const config = {
      llmProvider: process.env.LLM_PROVIDER || '未設定',
      hasLineChannelToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      hasLineChannelSecret: !!process.env.LINE_CHANNEL_SECRET,
      hasOpenAIApiKey: !!process.env.OPENAI_API_KEY,
      hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
      hasMongoDBUri: !!process.env.MONGODB_URI,
      dbStatus,
      dbName,
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('[API] Error fetching config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

