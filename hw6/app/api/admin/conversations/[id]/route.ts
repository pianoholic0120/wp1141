import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import { ConversationModel } from '@/models/Conversation';
import { MessageModel } from '@/models/Message';
import mongoose from 'mongoose';
import { ConversationIdParamSchema } from '@/lib/validators/admin';
import { ConversationDetailResponseSchema } from '@/lib/validators/response';
import { logger } from '@/lib/utils/logger';

// 明确指定使用 Node.js runtime（需要 MongoDB 连接）
export const runtime = 'nodejs';
export const preferredRegion = 'sfo1';
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectMongo();
  
  const conversationId = params.id;
  
  // Validate conversation ID parameter with Zod
  const paramValidation = ConversationIdParamSchema.safeParse({ id: conversationId });
  if (!paramValidation.success) {
    return NextResponse.json(
      { error: 'Invalid conversation ID format', details: paramValidation.error.errors },
      { status: 400 }
    );
  }
  
  try {
    // 獲取查詢參數（排序方式）
    const { searchParams } = new URL(req.url);
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // desc = 新到舊, asc = 舊到新
    
    // 轉換 conversationId 為 ObjectId
    const objectId = new mongoose.Types.ObjectId(conversationId);
    
    // 獲取對話資訊
    const conversation = await ConversationModel.findById(objectId).lean();
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // 獲取所有訊息（根據排序參數排序）
    const sortDirection = sortOrder === 'asc' ? 1 : -1; // 1 = 舊到新, -1 = 新到舊
    const messages = await MessageModel.find({ conversationId: objectId })
      .sort({ timestamp: sortDirection })
      .lean();
    
    logger.info(`[API] Fetched ${messages.length} messages for conversation ${conversationId} (sortOrder: ${sortOrder})`);
    
    // Validate response with Zod
    const response = { conversation, messages };
    const responseValidation = ConversationDetailResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      logger.error('Invalid response structure:', responseValidation.error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    
    return NextResponse.json(responseValidation.data);
  } catch (error) {
    console.error('[API] Error fetching conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectMongo();
  
  const conversationId = params.id;
  
  // Validate conversation ID parameter with Zod
  const paramValidation = ConversationIdParamSchema.safeParse({ id: conversationId });
  if (!paramValidation.success) {
    return NextResponse.json(
      { error: 'Invalid conversation ID format', details: paramValidation.error.errors },
      { status: 400 }
    );
  }
  
  try {
    const body = await req.json();
    const { status } = body;
    
    // Validate status
    if (!status || !['active', 'resolved', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: active, resolved, archived' },
        { status: 400 }
      );
    }
    
    // Convert conversationId to ObjectId
    const objectId = new mongoose.Types.ObjectId(conversationId);
    
    // Update conversation status
    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      objectId,
      { $set: { status } },
      { new: true }
    ).lean();
    
    if (!updatedConversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    logger.info(`[API] Updated conversation ${conversationId} status to ${status}`);
    
    return NextResponse.json({
      success: true,
      conversation: updatedConversation,
      message: `對話狀態已更新為 ${status}`,
    });
  } catch (error) {
    console.error('[API] Error updating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

