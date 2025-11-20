import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import mongoose from 'mongoose';
import { DatabaseStatusResponseSchema } from '@/lib/validators/response';

// 明确指定使用 Node.js runtime（需要 MongoDB 连接）
export const runtime = 'nodejs';
export const preferredRegion = 'sfo1';
export async function GET() {
  try {
    await connectMongo();
    const collections = await mongoose.connection.db?.listCollections().toArray();
    
    const response = {
      connected: true,
      status: 'connected',
      message: `Database: ${mongoose.connection.name}, Collections: ${(collections || []).length}`,
      db: mongoose.connection.name,
      collections: (collections || []).map((c) => c.name),
    };
    
    // Validate response with Zod
    const responseValidation = DatabaseStatusResponseSchema.safeParse({
      connected: true,
      status: 'connected',
      message: response.message,
    });
    
    if (!responseValidation.success) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    
    return NextResponse.json(response);
  } catch (err: any) {
    const errorResponse = {
      connected: false,
      status: 'error',
      message: err?.message || String(err),
    };
    
    // Validate error response with Zod
    const responseValidation = DatabaseStatusResponseSchema.safeParse(errorResponse);
    if (!responseValidation.success) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    
    return NextResponse.json(responseValidation.data, { status: 500 });
  }
}
