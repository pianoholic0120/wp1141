import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import { ConversationModel } from '@/models/Conversation';
import { MessageModel } from '@/models/Message';
import { ConversationsQuerySchema } from '@/lib/validators/admin';
import { ConversationsListResponseSchema } from '@/lib/validators/response';
import { logger } from '@/lib/utils/logger';

export async function GET(req: Request) {
  await connectMongo();
  
  const { searchParams } = new URL(req.url);
  
  // Validate query parameters with Zod
  const queryParams = {
    status: searchParams.get('status') || 'all',
    search: searchParams.get('search') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    messageSearch: searchParams.get('messageSearch') || undefined,
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    sortBy: searchParams.get('sortBy') || 'lastMessageAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  };
  
  const validationResult = ConversationsQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: validationResult.error.errors },
      { status: 400 }
    );
  }
  
  const { status, search, dateFrom, dateTo, messageSearch, page, limit, sortBy, sortOrder } = validationResult.data;
  
  try {
    // 構建查詢條件
    const query: any = {};
    const baseQuery: any = {}; // 基礎查詢條件（status, search, messageSearch）
    
    if (status && status !== 'all') {
      baseQuery.status = status;
    }
    
    if (search) {
      baseQuery.userId = { $regex: search, $options: 'i' };
    }
    
    // 先處理訊息內容搜尋（如果有的話）
    let conversationIdsFromMessageSearch: string[] = [];
    if (messageSearch) {
      const messages = await MessageModel.find({
        content: { $regex: messageSearch, $options: 'i' },
      })
        .select('conversationId')
        .lean();
      conversationIdsFromMessageSearch = [...new Set(
        messages.map((m: any) => m.conversationId.toString())
      )];
      if (conversationIdsFromMessageSearch.length === 0) {
        // 如果沒有找到任何訊息，返回空結果
        return NextResponse.json({ items: [], total: 0 });
      }
      baseQuery._id = { $in: conversationIdsFromMessageSearch };
    }
    
    // 處理日期篩選：顯示在該日期範圍內有活動的對話
    // 如果對話的開始時間或最後消息時間在範圍內，就應該顯示
    if (dateFrom || dateTo) {
      // 用戶輸入的日期應該被理解為台灣時間（UTC+8）
      // 需要將台灣時間的日期範圍轉換為 UTC 時間範圍
      const TAIWAN_UTC_OFFSET_MS = 8 * 60 * 60 * 1000; // 8小時的毫秒數
      
      if (dateFrom && dateTo) {
        // 有開始和結束日期：查找在範圍內有活動的對話
        const [startYear, startMonth, startDay] = dateFrom.split('-').map(Number);
        const [endYear, endMonth, endDay] = dateTo.split('-').map(Number);
        
        // 構建 UTC 時間範圍
        // 台灣時間 UTC+8，所以：
        // 台灣時間 2025-11-15 00:00:00 = UTC 2025-11-14 16:00:00
        // 台灣時間 2025-11-18 23:59:59.999 = UTC 2025-11-18 15:59:59.999
        // 使用 Date.UTC 構建 UTC 時間，然後減去 8 小時偏移
        const startDateUTC = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0) - TAIWAN_UTC_OFFSET_MS);
        const endDateUTC = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999) - TAIWAN_UTC_OFFSET_MS);
        
        // 驗證日期範圍（用於調試）
        logger.info('[Date Filter] Date range validation:', {
          input: { dateFrom, dateTo },
          startDateUTC: startDateUTC.toISOString(),
          endDateUTC: endDateUTC.toISOString(),
          startDateLocal: startDateUTC.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
          endDateLocal: endDateUTC.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
          startTimestamp: startDateUTC.getTime(),
          endTimestamp: endDateUTC.getTime(),
        });
        
        logger.info('[Date Filter] Date range (startedAt or lastMessageAt):', {
          dateFrom,
          dateTo,
          startDateUTC: startDateUTC.toISOString(),
          endDateUTC: endDateUTC.toISOString(),
          startDateLocal: startDateUTC.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
          endDateLocal: endDateUTC.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
        });
        
        // 使用 $or 條件：開始時間或最後消息時間在範圍內
        const dateConditions = {
          $or: [
            {
              startedAt: {
                $gte: startDateUTC,
                $lte: endDateUTC,
              },
            },
            {
              lastMessageAt: {
                $gte: startDateUTC,
                $lte: endDateUTC,
              },
            },
          ],
        };
        
        // 合併基礎條件和日期條件
        if (Object.keys(baseQuery).length > 0) {
          query.$and = [
            baseQuery,
            dateConditions,
          ];
        } else {
          // 如果沒有其他條件，直接使用日期條件
          Object.assign(query, dateConditions);
        }
      } else if (dateFrom) {
        // 只有開始日期：查找在該日期之後有活動的對話
        const [year, month, day] = dateFrom.split('-').map(Number);
        const startDateUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - TAIWAN_UTC_OFFSET_MS);
        const dateConditions = {
          $or: [
            { startedAt: { $gte: startDateUTC } },
            { lastMessageAt: { $gte: startDateUTC } },
          ],
        };
        if (Object.keys(baseQuery).length > 0) {
          query.$and = [
            baseQuery,
            dateConditions,
          ];
        } else {
          Object.assign(query, dateConditions);
        }
      } else if (dateTo) {
        // 只有結束日期：查找在該日期之前有活動的對話
        const [year, month, day] = dateTo.split('-').map(Number);
        const endDateUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - TAIWAN_UTC_OFFSET_MS);
        const dateConditions = {
          $or: [
            { startedAt: { $lte: endDateUTC } },
            { lastMessageAt: { $lte: endDateUTC } },
          ],
        };
        if (Object.keys(baseQuery).length > 0) {
          query.$and = [
            baseQuery,
            dateConditions,
          ];
        } else {
          Object.assign(query, dateConditions);
        }
      }
    } else {
      // 沒有日期篩選，直接使用基礎查詢條件
      Object.assign(query, baseQuery);
    }
    
    // 記錄最終查詢條件（用於調試）
    logger.info('[Query] Final query conditions:', {
      query: JSON.stringify(query, null, 2),
      hasDateFilter: !!(dateFrom || dateTo),
      dateFrom,
      dateTo,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // 構建排序條件
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // 計算跳過數量
    const skip = (page - 1) * limit;
    
    // 獲取對話列表（帶分頁和排序）
    const items = await ConversationModel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // 記錄查詢結果（用於調試）
    if (dateFrom || dateTo) {
      logger.info('[Query] Results with date filter:', {
        totalResults: items.length,
        page,
        limit,
        sampleResults: items.slice(0, 3).map((item: any) => ({
          userId: item.userId,
          startedAt: item.startedAt?.toISOString(),
          lastMessageAt: item.lastMessageAt?.toISOString(),
          startedAtLocal: item.startedAt?.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
          lastMessageAtLocal: item.lastMessageAt?.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
        })),
      });
    }
    
    // 獲取總數
    const total = await ConversationModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Validate response with Zod
    const response = { 
      items, 
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
    const responseValidation = ConversationsListResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      logger.error('Invalid response structure:', responseValidation.error);
      // 如果 schema 驗證失敗，仍返回數據但記錄錯誤
      return NextResponse.json(response);
    }
    
    return NextResponse.json(responseValidation.data);
  } catch (error) {
    console.error('[API] Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
