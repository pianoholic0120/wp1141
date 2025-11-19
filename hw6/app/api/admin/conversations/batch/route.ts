import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import { ConversationModel } from '@/models/Conversation';
import { MessageModel } from '@/models/Message';
import mongoose from 'mongoose';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

const BatchDeleteSchema = z.object({
  ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format')).min(1),
});

const BatchUpdateSchema = z.object({
  ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format')).min(1),
  status: z.enum(['active', 'resolved', 'archived']),
});

export async function DELETE(req: Request) {
  await connectMongo();

  try {
    const body = await req.json();
    
    // Validate request body with Zod
    const validationResult = BatchDeleteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { ids } = validationResult.data;

    // Convert string IDs to ObjectIds
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

    // Delete conversations and their associated messages
    const deleteResult = await ConversationModel.deleteMany({
      _id: { $in: objectIds },
    });

    // Also delete associated messages
    await MessageModel.deleteMany({
      conversationId: { $in: objectIds },
    });

    logger.info(`[Batch Delete] Deleted ${deleteResult.deletedCount} conversations`);

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.deletedCount,
      message: `成功刪除 ${deleteResult.deletedCount} 個對話`,
    });
  } catch (error) {
    logger.error('[Batch Delete] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: '刪除時發生錯誤' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  await connectMongo();

  try {
    const body = await req.json();
    
    // Validate request body with Zod
    const validationResult = BatchUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { ids, status } = validationResult.data;

    // Convert string IDs to ObjectIds
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

    // Update conversations status
    const updateResult = await ConversationModel.updateMany(
      { _id: { $in: objectIds } },
      { $set: { status } }
    );

    logger.info(`[Batch Update] Updated ${updateResult.modifiedCount} conversations to status: ${status}`);

    return NextResponse.json({
      success: true,
      modifiedCount: updateResult.modifiedCount,
      message: `成功更新 ${updateResult.modifiedCount} 個對話狀態為 ${status}`,
    });
  } catch (error) {
    logger.error('[Batch Update] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: '更新時發生錯誤' },
      { status: 500 }
    );
  }
}

