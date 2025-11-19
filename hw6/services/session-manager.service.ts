/**
 * Session Manager
 * 管理使用者對話狀態和上下文
 */

import { connectMongo } from '@/lib/db/mongodb';
import { ConversationModel } from '@/models/Conversation';
import { Locale } from '@/lib/i18n';

export enum ConversationState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  EVENT_SELECTED = 'EVENT_SELECTED',
  EVENT_LIST = 'EVENT_LIST',
  FAQ_MODE = 'FAQ_MODE',
}

export interface SessionContext {
  lastQuery?: string;
  lastSearchResults?: any[];
  selectedEvent?: any;
  selectedEventIndex?: number; // 如果有多個結果，記錄選中的索引
  language: Locale;
  favoritesList?: Array<{ eventId: string; title: string }>; // 收藏列表暫存（用於編號取消收藏）
}

export interface Session {
  userId: string;
  state: ConversationState;
  context: SessionContext;
  createdAt: Date;
  updatedAt: Date;
}

export class SessionManager {
  /**
   * 取得或建立 session
   */
  async getOrCreateSession(userId: string): Promise<Session> {
    await connectMongo();
    
    let conversation = await ConversationModel.findOne({ userId }).lean();
    
    if (!conversation) {
      conversation = await ConversationModel.create({
        userId,
        metadata: {
          locale: 'zh-TW',
        },
      });
    }
    
    // 從 metadata 中提取 session 資訊
    const metadata = conversation.metadata || {};
    const state = (metadata.state as ConversationState) || ConversationState.IDLE;
    const context: SessionContext = {
      lastQuery: metadata.lastQuery as string | undefined,
      lastSearchResults: metadata.lastSearchResults as any[] | undefined,
      selectedEvent: metadata.selectedEvent as any | undefined,
      selectedEventIndex: metadata.selectedEventIndex as number | undefined,
      language: (metadata.locale as Locale) || 'zh-TW',
      favoritesList: metadata.favoritesList as Array<{ eventId: string; title: string }> | undefined,
    };
    
    return {
      userId: conversation.userId,
      state,
      context,
      createdAt: conversation.startedAt,
      updatedAt: conversation.lastMessageAt,
    };
  }
  
  /**
   * 更新 session 狀態
   */
  async updateState(userId: string, state: ConversationState): Promise<void> {
    await connectMongo();
    
    await ConversationModel.updateOne(
      { userId },
      {
        $set: {
          'metadata.state': state,
          lastMessageAt: new Date(),
        },
      }
    );
  }
  
  /**
   * 儲存搜尋結果到 context
   */
  async saveSearchContext(
    userId: string,
    results: any[],
    query?: string
  ): Promise<void> {
    await connectMongo();
    
    const updateData: any = {
      'metadata.lastSearchResults': results,
      lastMessageAt: new Date(),
    };
    
    if (query) {
      updateData['metadata.lastQuery'] = query;
    }
    
    // 根據結果數量決定狀態和選中的事件
    if (results.length === 1) {
      // 單一結果：直接選中第一個事件
      updateData['metadata.state'] = ConversationState.EVENT_SELECTED;
      updateData['metadata.selectedEvent'] = results[0];
      updateData['metadata.selectedEventIndex'] = 0;
    } else if (results.length > 1) {
      // 多個結果：選中第一個事件（最相關的）
      updateData['metadata.state'] = ConversationState.EVENT_LIST;
      updateData['metadata.selectedEvent'] = results[0];
      updateData['metadata.selectedEventIndex'] = 0;
    } else {
      // 沒有結果：清除選中的事件
      updateData['metadata.state'] = ConversationState.IDLE;
      updateData['metadata.selectedEvent'] = null;
      updateData['metadata.selectedEventIndex'] = undefined;
    }
    
    console.log('[SessionManager] Saving search context:', {
      userId,
      resultCount: results.length,
      selectedEventTitle: results.length > 0 ? results[0]?.title : null,
      query,
    });
    
    await ConversationModel.updateOne({ userId }, { $set: updateData });
  }
  
  /**
   * 選擇單一事件（從列表中選擇）
   */
  async selectEvent(userId: string, eventIndex: number): Promise<void> {
    await connectMongo();
    
    const conversation = await ConversationModel.findOne({ userId }).lean();
    if (!conversation) return;
    
    const results = (conversation.metadata?.lastSearchResults as any[]) || [];
    if (eventIndex >= 0 && eventIndex < results.length) {
      await ConversationModel.updateOne(
        { userId },
        {
          $set: {
            'metadata.state': ConversationState.EVENT_SELECTED,
            'metadata.selectedEvent': results[eventIndex],
            'metadata.selectedEventIndex': eventIndex,
            lastMessageAt: new Date(),
          },
        }
      );
    }
  }
  
  /**
   * 取得上下文中的演出資訊
   */
  async getContextEvent(userId: string): Promise<any | null> {
    await connectMongo();
    
    const conversation = await ConversationModel.findOne({ userId }).lean();
    if (!conversation) return null;
    
    return (conversation.metadata?.selectedEvent as any) || null;
  }
  
  /**
   * 取得上下文中的搜尋結果
   */
  async getContextSearchResults(userId: string): Promise<any[]> {
    await connectMongo();
    
    const conversation = await ConversationModel.findOne({ userId }).lean();
    if (!conversation) return [];
    
    return (conversation.metadata?.lastSearchResults as any[]) || [];
  }
  
  /**
   * 清除 session (回到主選單)
   */
  async clearSession(userId: string): Promise<void> {
    await connectMongo();
    
    await ConversationModel.updateOne(
      { userId },
      {
        $set: {
          'metadata.state': ConversationState.IDLE,
          'metadata.lastQuery': undefined,
          'metadata.lastSearchResults': undefined,
          'metadata.selectedEvent': undefined,
          'metadata.selectedEventIndex': undefined,
          lastMessageAt: new Date(),
        },
      }
    );
  }
  
  /**
   * 更新語言設定
   */
  async updateLanguage(userId: string, locale: Locale): Promise<void> {
    await connectMongo();
    
    await ConversationModel.updateOne(
      { userId },
      {
        $set: {
          'metadata.locale': locale,
          lastMessageAt: new Date(),
        },
      }
    );
  }
  
  /**
   * 更新 session context（部分更新，保留其他欄位）
   */
  async updateContext(userId: string, contextUpdate: Partial<SessionContext>): Promise<void> {
    await connectMongo();
    
    const conversation = await ConversationModel.findOne({ userId }).lean();
    if (!conversation) {
      console.log('[SessionManager updateContext] No conversation found for userId:', userId);
      return;
    }
    
    // 獲取現有的 context
    const currentContext = {
      lastQuery: conversation.metadata?.lastQuery,
      lastSearchResults: conversation.metadata?.lastSearchResults,
      selectedEvent: conversation.metadata?.selectedEvent,
      selectedEventIndex: conversation.metadata?.selectedEventIndex,
      language: conversation.metadata?.locale || 'zh-TW',
      favoritesList: conversation.metadata?.favoritesList,
    };
    
    console.log('[SessionManager updateContext] Current context before update:', {
      userId,
      hasFavoritesList: !!currentContext.favoritesList,
      favoritesCount: currentContext.favoritesList?.length || 0,
    });
    
    // 合併更新（undefined 的值會被明確設置為 undefined，可用於清除欄位）
    const updateData: any = {
      lastMessageAt: new Date(),
    };
    
    // 明確處理每個欄位
    if ('lastQuery' in contextUpdate) {
      updateData['metadata.lastQuery'] = contextUpdate.lastQuery;
    }
    if ('lastSearchResults' in contextUpdate) {
      updateData['metadata.lastSearchResults'] = contextUpdate.lastSearchResults;
    }
    if ('selectedEvent' in contextUpdate) {
      updateData['metadata.selectedEvent'] = contextUpdate.selectedEvent;
    }
    if ('selectedEventIndex' in contextUpdate) {
      updateData['metadata.selectedEventIndex'] = contextUpdate.selectedEventIndex;
    }
    if ('language' in contextUpdate) {
      updateData['metadata.locale'] = contextUpdate.language;
    }
    if ('favoritesList' in contextUpdate) {
      updateData['metadata.favoritesList'] = contextUpdate.favoritesList;
      console.log('[SessionManager updateContext] Updating favoritesList:', {
        userId,
        isClearing: contextUpdate.favoritesList === undefined,
        newCount: contextUpdate.favoritesList?.length || 0,
      });
    }
    
    await ConversationModel.updateOne(
      { userId },
      { $set: updateData }
    );
    
    // 驗證更新是否成功
    const verify = await ConversationModel.findOne({ userId }).lean();
    console.log('[SessionManager updateContext] Update verified:', {
      userId,
      hasFavoritesList: !!verify?.metadata?.favoritesList,
      favoritesCount: verify?.metadata?.favoritesList?.length || 0,
    });
  }
}

export const sessionManager = new SessionManager();

