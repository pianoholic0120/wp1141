/**
 * Chat Handler Service
 * 使用狀態機架構處理使用者訊息
 */

import { connectMongo } from '@/lib/db/mongodb';
import { ConversationModel } from '@/models/Conversation';
import { MessageModel } from '@/models/Message';
import { sessionManager, ConversationState } from './session-manager.service';
import { stateMachine, ActionType } from './state-machine.service';
import { generateAssistantReply, extractLLMMetadata } from './llm.service';
import {
  searchEvents,
  searchEventsByArtist,
  searchEventsByVenue,
  searchEventsByCategory,
  searchEventsByDateRange,
  searchEventsAdvanced,
} from './event.service';
import { parseQuery } from './query-parser.service';
import { buildStructuredResponse } from './response-builder.service';
import { cleanMarkdown } from '@/lib/utils/format';
import {
  textMessageWithQuickReply,
  buildSearchResultQuickReply,
  buildNoResultSearchSuggestions,
  buildSingleEventQuickReply,
  buildQuickReplies,
  buildSearchGuideQuickReply,
  buildSearchTypeGuideQuickReply,
} from '@/lib/line/templates';
import { Locale } from '@/lib/i18n';
import { formatEventForDisplay } from '@/lib/utils/event-formatter';
import { addFavorite, removeFavorite, getFavorites, getFavoriteCount } from './favorite.service';

function buildOpentixSearchUrl(query: string): string {
  const base = 'https://www.opentix.life/search?keyword=';
  return `${base}${encodeURIComponent(query.trim())}`;
}

/**
 * 處理動作並生成回應
 */
/**
 * 檢測並處理搜尋引導訊息
 */
function detectSearchGuideMessage(message: string, userLocale: Locale): { isGuide: boolean; type?: 'menu' | 'title' | 'artist' | 'venue' | 'category'; isMainMenu?: boolean } {
  const normalized = message.trim();
  const isZh = userLocale === 'zh-TW';
  
  // 檢查是否為主搜尋選單請求（搜尋按鈕）
  if (
    normalized === '搜尋' || 
    normalized === 'Search' || 
    normalized === '🔍 搜尋' ||
    normalized === '🔍 Search'
  ) {
    return { isGuide: true, type: 'menu', isMainMenu: false };
  }
  
  // 檢查是否為主選單按鈕（回到主畫面）
  if (
    normalized === '主選單' ||
    normalized === 'Main Menu' ||
    normalized === '🔙 Main Menu'
  ) {
    return { isGuide: false, isMainMenu: true };
  }
  
  // 檢查是否為具體搜尋類型選擇
  if (isZh) {
    if (normalized.includes('我想用演出全名搜尋') || normalized === '🎭 演出全名') {
      return { isGuide: true, type: 'title' };
    }
    if (normalized.includes('我想用藝人名稱搜尋') || normalized === '👤 藝人名稱') {
      return { isGuide: true, type: 'artist' };
    }
    if (normalized.includes('我想用場館名稱搜尋') || normalized === '🏛️ 場館名稱') {
      return { isGuide: true, type: 'venue' };
    }
    if (normalized.includes('我想用演出類型搜尋') || normalized === '🎵 演出類型') {
      return { isGuide: true, type: 'category' };
    }
    if (normalized === '🔙 重新選擇') {
      return { isGuide: true, type: 'menu', isMainMenu: false };
    }
  } else {
    // 英文检测：检查按钮实际发送的文本
    if (normalized.includes('Search by full title') || normalized === '🎭 Full Title' || normalized === '🎭 Search by full title') {
      return { isGuide: true, type: 'title' };
    }
    if (normalized.includes('Search by artist') || normalized === '👤 Artist Name' || normalized === '👤 Search by artist') {
      return { isGuide: true, type: 'artist' };
    }
    if (normalized.includes('Search by venue') || normalized === '🏛️ Venue' || normalized === '🏛️ Search by venue') {
      return { isGuide: true, type: 'venue' };
    }
    if (normalized.includes('Search by category') || normalized === '🎵 Category' || normalized === '🎵 Search by category') {
      return { isGuide: true, type: 'category' };
    }
    if (normalized === '🔙 Choose Again' || normalized === 'Choose Again') {
      return { isGuide: true, type: 'menu', isMainMenu: false };
    }
  }
  
  return { isGuide: false };
}

async function handleAction(
  action: { type: ActionType; data?: any },
  session: any,
  userLocale: Locale,
  message: string
): Promise<{ reply: string; quickReply?: any }> {
  // 優先檢測搜尋引導訊息
  const searchGuide = detectSearchGuideMessage(message, userLocale);
  
  // 如果是主選單按鈕，直接返回主選單
  if (searchGuide.isMainMenu) {
    return {
      reply: userLocale === 'zh-TW'
        ? '🎵 歡迎來到 Opentix 音樂演出諮詢小幫手！\n\n我可以協助您：\n✓ 搜尋音樂演出資訊（藝人、場館、類型）\n✓ 查詢演出詳情（地點、主辦單位、演出時長等）\n✓ 提供 Opentix 購票連結\n✓ 回答演出相關問題\n\n請直接告訴我您想找什麼演出，或選擇下方功能！'
        : '🎵 Welcome to Opentix Music Event Information Assistant!\n\nI can help you:\n✓ Search for music events (artists, venues, categories)\n✓ Query event details (venue, organizer, duration, etc.)\n✓ Provide Opentix ticket purchase links\n✓ Answer event-related questions\n\nPlease tell me what event you\'re looking for, or select a function below!',
      quickReply: buildQuickReplies(userLocale),
    };
  }
  
  if (searchGuide.isGuide) {
    if (searchGuide.type === 'menu') {
      const isZh = userLocale === 'zh-TW';
      return {
        reply: isZh
          ? '🔍 請選擇您的搜尋方式：\n\n您可以透過以下方式搜尋演出：'
          : '🔍 Please choose your search method:\n\nYou can search events by:',
        quickReply: buildSearchGuideQuickReply(userLocale),
      };
    } else {
      // 返回具體搜尋類型的範例和建議
      const guideData = buildSearchTypeGuideQuickReply(userLocale, searchGuide.type!);
      return {
        reply: guideData.message,
        quickReply: guideData.quickReply,
      };
    }
  }
  
  switch (action.type) {
    case 'SEARCH_EVENTS':
      return await handleSearchAction(action.data.query, userLocale, session.userId);
      
    case 'ANSWER_EVENT_QUESTION':
      return await handleAnswerEventQuestion(
        action.data,
        session,
        userLocale,
        message
      );
      
    case 'SHOW_EVENT_DETAILS':
      return await handleShowEventDetails(action.data, userLocale);
      
    case 'SHOW_EVENT_LIST':
      return await handleShowEventList(action.data, userLocale);
      
    case 'SHOW_FAQ':
      return await handleShowFAQ(action.data, userLocale);
      
    case 'SHOW_MAIN_MENU':
      return {
        reply: userLocale === 'zh-TW'
          ? '🎵 歡迎來到 Opentix 音樂演出諮詢小幫手！\n\n我可以協助您：\n✓ 搜尋音樂演出資訊（藝人、場館、類型）\n✓ 查詢演出詳情（地點、主辦單位、演出時長等）\n✓ 提供 Opentix 購票連結\n✓ 回答演出相關問題\n\n請直接告訴我您想找什麼演出，或選擇下方功能！'
          : '🎵 Welcome to Opentix Music Event Information Assistant!\n\nI can help you:\n✓ Search for music events (artists, venues, categories)\n✓ Query event details (venue, organizer, duration, etc.)\n✓ Provide Opentix ticket purchase links\n✓ Answer event-related questions\n\nPlease tell me what event you\'re looking for, or select a function below!',
        quickReply: buildQuickReplies(userLocale),
      };
      
    case 'GENERAL_QUESTION':
      return await handleGeneralQuestion(message, session, userLocale);
      
    case 'CLEAR_SESSION':
      await sessionManager.clearSession(session.userId);
      return {
        reply: userLocale === 'zh-TW'
          ? '已回到主選單'
          : 'Returned to main menu',
        quickReply: buildQuickReplies(userLocale),
      };
      
    default:
      return {
        reply: userLocale === 'zh-TW'
          ? '很抱歉，我無法理解您的問題。請重新輸入或選擇下方功能。'
          : 'Sorry, I cannot understand your question. Please try again or select a function below.',
        quickReply: buildQuickReplies(userLocale),
      };
  }
}

/**
 * 處理搜尋動作
 */
async function handleSearchAction(
  query: string,
  userLocale: Locale,
  userId?: string
): Promise<{ reply: string; quickReply?: any; events: any[] }> {
  const parsedQuery = await parseQuery(query);
  let searchResult: any = { events: [], total: 0, query };

  console.log('[Search Action] Query:', query);
  console.log('[Search Action] Parsed Query:', {
    queryType: parsedQuery.queryType,
    venues: parsedQuery.venues,
    artists: parsedQuery.artists,
    categories: parsedQuery.categories,
  });

  // 根據查詢類型選擇最適合的搜尋策略
  if (parsedQuery.queryType === 'artist' && parsedQuery.artists && parsedQuery.artists.length > 0) {
    const artistName = parsedQuery.artistInfo?.normalizedName || parsedQuery.artists[0];
    console.log('[Search Action] Using artist search for:', artistName);
    searchResult = await searchEventsByArtist(artistName, 5);
  } else if (parsedQuery.queryType === 'venue' && parsedQuery.venues && parsedQuery.venues.length > 0) {
    const venueName = parsedQuery.venues[0];
    console.log('[Search Action] Using venue search for:', venueName);
    searchResult = await searchEventsByVenue(venueName, 5);
  } else if (parsedQuery.queryType === 'category' && parsedQuery.categories && parsedQuery.categories.length > 0) {
    const category = parsedQuery.categories[0];
    console.log('[Search Action] Using category search for:', category);
    searchResult = await searchEventsByCategory(category, 5);
  } else if (parsedQuery.queryType === 'date' && parsedQuery.dateRange) {
    const { start, end } = parsedQuery.dateRange;
    if (start && end) {
      console.log('[Search Action] Using date range search:', start, end);
      searchResult = await searchEventsByDateRange(start, end, 5);
    }
  } else {
    const searchQuery = (parsedQuery.keywords && parsedQuery.keywords.length > 0)
      ? parsedQuery.keywords[0]
      : query;
    console.log('[Search Action] Using general search for:', searchQuery);
    searchResult = await searchEvents(searchQuery, 5);
  }

  const foundEvents = searchResult.events || [];
  
  // 【重要】立即儲存搜尋結果到 session，確保後續問題能使用最新的搜尋結果
  // 即使後面檢測到"沒有找到"，也會在那時清除 session
  if (userId && foundEvents.length > 0) {
    await sessionManager.saveSearchContext(userId, foundEvents, query);
    console.log('[Session] Pre-saved search context:', {
      userId,
      eventCount: foundEvents.length,
      firstEventTitle: foundEvents[0]?.title,
    });
  }
  
  // 生成回應
  const structuredResponse = buildStructuredResponse(parsedQuery, searchResult, userLocale);
  
  if (!structuredResponse.useLLM && structuredResponse.text) {
    const reply = structuredResponse.text;
    const opentixSearchUrl = buildOpentixSearchUrl(query);
    const finalReply = reply.includes('opentix.life')
      ? reply
      : `${reply}\n\n${userLocale === 'zh-TW' ? '更多資訊' : 'More info'}: ${opentixSearchUrl}`;
    
    // 檢查回覆內容，判斷是否真的找到了相關演出
    const replyLower = finalReply.toLowerCase();
    // 移除 emoji 和特殊字符，只保留文字進行檢測
    const replyForDetection = replyLower.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/[👋😊😅🙏😊]/g, '').trim();
    // 同時檢測繁體和簡體字
    // 更全面的检测：检查回复是否明确表示没有找到结果
    const hasNoResultKeywords = replyForDetection.includes('沒有找到') || 
                                 replyForDetection.includes('没有找到') || 
                                 replyForDetection.includes('找不到') || 
                                 replyForDetection.includes('還是沒有找到') ||
                                 replyForDetection.includes('还是没有找到') ||
                                 replyForDetection.includes('沒有找到與') ||
                                 replyForDetection.includes('没有找到与') ||
                                 replyForDetection.includes('相關的演出') ||
                                 replyForDetection.includes('相关的演出') ||
                                 replyForDetection.includes('目前沒有找到') ||
                                 replyForDetection.includes('目前没有找到') ||
                                 (replyForDetection.includes('很抱歉') && (replyForDetection.includes('沒有') || replyForDetection.includes('没有') || replyForDetection.includes('找不到'))) ||
                                 replyForDetection.includes('很抱歉,沒有找到') ||
                                 replyForDetection.includes('很抱歉，沒有找到') ||
                                 replyForDetection.includes('很抱歉,没有找到') ||
                                 replyForDetection.includes('很抱歉，没有找到') ||
                                 replyForDetection.includes('很抱歉沒有找到') ||
                                 replyForDetection.includes('很抱歉没有找到') ||
                                 (replyForDetection.includes('沒有找到') && replyForDetection.includes('相關')) ||
                                 (replyForDetection.includes('没有找到') && replyForDetection.includes('相关'));
    
    console.log('[Quick Reply Detection - Structured]', {
      replyPreview: finalReply.substring(0, 80),
      replyForDetection: replyForDetection.substring(0, 150),
      hasNoResultKeywords,
      foundEventsLength: foundEvents.length,
      willUseNoResultSuggestions: hasNoResultKeywords || foundEvents.length === 0,
    });
    
    // 如果回覆明確表示"沒有找到"，清除 session context
    if (hasNoResultKeywords && userId) {
      await sessionManager.clearSession(userId);
      console.log('[Session] Cleared session due to no results (Structured)');
    }
    
    // 生成 Quick Reply
    let quickReply;
    // 如果回覆明確表示沒有找到相關演出，使用引導性 quick reply
    if (hasNoResultKeywords || foundEvents.length === 0) {
      quickReply = buildSearchGuideQuickReply(userLocale);
    } else if (foundEvents.length === 1) {
      // 單一演出：傳入事件 URL 和 eventId
      const eventUrl = foundEvents[0].opentixUrl || foundEvents[0].url;
      const eventId = foundEvents[0].eventId;
      quickReply = buildSingleEventQuickReply(userLocale, foundEvents[0].title, eventUrl, eventId);
    } else if (foundEvents.length > 0) {
      quickReply = buildSearchResultQuickReply(userLocale);
    } else {
      quickReply = buildSearchGuideQuickReply(userLocale);
    }
    
    return { reply: finalReply, quickReply, events: foundEvents };
  } else {
    // 使用 LLM 生成回應
    const opentixSearchUrl = buildOpentixSearchUrl(query);
    let reply: string;
    let llmMetadata: { latency?: number; error?: string; llmProvider?: string } = {};
    
    try {
      reply = await generateAssistantReply(
        [],
        query,
        {
          opentixSearchUrl,
          foundEvents: foundEvents.length > 0 ? foundEvents : undefined,
          parsedQuery,
          userLocale: userLocale,
        }
      );
      llmMetadata = extractLLMMetadata(reply);
    } catch (err) {
      llmMetadata = extractLLMMetadata(err as Error);
      throw err; // 重新拋出，讓上層處理
    }
    
    const cleanedReply = cleanMarkdown(reply);
    
    // 檢查回覆內容，判斷是否真的找到了相關演出
    // 如果回覆中包含「沒有找到」、「找不到」等關鍵詞，即使 foundEvents.length > 0，也應該使用引導性 quick reply
    const replyLower = cleanedReply.toLowerCase();
    // 移除 emoji 和特殊字符，只保留文字進行檢測
    const replyForDetection = replyLower.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/[👋😊😅🙏😊]/g, '').trim();
    // 同時檢測繁體和簡體字
    // 更全面的检测：检查回复是否明确表示没有找到结果
    const hasNoResultKeywords = replyForDetection.includes('沒有找到') || 
                                 replyForDetection.includes('没有找到') || 
                                 replyForDetection.includes('找不到') || 
                                 replyForDetection.includes('還是沒有找到') ||
                                 replyForDetection.includes('还是没有找到') ||
                                 replyForDetection.includes('沒有找到與') ||
                                 replyForDetection.includes('没有找到与') ||
                                 replyForDetection.includes('相關的演出') ||
                                 replyForDetection.includes('相关的演出') ||
                                 replyForDetection.includes('目前沒有找到') ||
                                 replyForDetection.includes('目前没有找到') ||
                                 (replyForDetection.includes('很抱歉') && (replyForDetection.includes('沒有') || replyForDetection.includes('没有') || replyForDetection.includes('找不到'))) ||
                                 replyForDetection.includes('很抱歉,沒有找到') ||
                                 replyForDetection.includes('很抱歉，沒有找到') ||
                                 replyForDetection.includes('很抱歉,没有找到') ||
                                 replyForDetection.includes('很抱歉，没有找到') ||
                                 replyForDetection.includes('很抱歉沒有找到') ||
                                 replyForDetection.includes('很抱歉没有找到') ||
                                 (replyForDetection.includes('沒有找到') && replyForDetection.includes('相關')) ||
                                 (replyForDetection.includes('没有找到') && replyForDetection.includes('相关'));
    
    console.log('[Quick Reply Detection - LLM]', {
      replyPreview: cleanedReply.substring(0, 80),
      replyForDetection: replyForDetection.substring(0, 150),
      hasNoResultKeywords,
      foundEventsLength: foundEvents.length,
      willUseNoResultSuggestions: hasNoResultKeywords || foundEvents.length === 0,
    });
    
    // 如果回覆明確表示"沒有找到"，清除 session context
    if (hasNoResultKeywords && userId) {
      await sessionManager.clearSession(userId);
      console.log('[Session] Cleared session due to no results (LLM)');
    }
    
    // 生成 Quick Reply
    let quickReply;
    // 如果回覆明確表示沒有找到相關演出，使用引導性 quick reply
    if (hasNoResultKeywords || foundEvents.length === 0) {
      quickReply = buildSearchGuideQuickReply(userLocale);
    } else if (foundEvents.length === 1) {
      // 單一演出：傳入事件 URL 和 eventId
      const eventUrl = foundEvents[0].opentixUrl || foundEvents[0].url;
      const eventId = foundEvents[0].eventId;
      quickReply = buildSingleEventQuickReply(userLocale, foundEvents[0].title, eventUrl, eventId);
    } else if (foundEvents.length > 0) {
      quickReply = buildSearchResultQuickReply(userLocale);
    } else {
      quickReply = buildSearchGuideQuickReply(userLocale);
    }
    
    return { reply: cleanedReply, quickReply, events: foundEvents };
  }
}

/**
 * 處理回答事件問題
 */
async function handleAnswerEventQuestion(
  data: any,
  session: any,
  userLocale: Locale,
  message: string
): Promise<{ reply: string; quickReply?: any }> {
  try {
    // 優先使用 data 中的 event
    let event = data.event;
  
  // 如果沒有，從最近的對話消息中提取事件信息
  if (!event && session.conversationId) {
    const recentMessages = await MessageModel.find({
      conversationId: session.conversationId,
    })
      .sort({ timestamp: -1 })
      .limit(10) // 擴大範圍，確保能找到最近的事件
      .lean();
    
    // 從最近的助手消息中查找事件 URL 或事件信息
    // 優先查找包含事件列表的消息（通常是最新的搜索結果）
    // 只查找第一條助手消息（最新的），避免找到舊的事件
    for (const msg of recentMessages) {
      if (msg.role === 'assistant' && msg.content) {
        // 嘗試從消息中提取所有事件 URL
        const urlMatches = Array.from(msg.content.matchAll(/https:\/\/www\.opentix\.life\/event\/(\d+)/g));
        const eventIds: string[] = [];
        for (const match of urlMatches) {
          eventIds.push(match[1]);
        }
        
        // 如果找到事件 URL，優先使用第一個（通常是最相關的）
        if (eventIds.length > 0) {
          const eventId = eventIds[0]; // 使用第一個事件 ID
          // 從資料庫中查找該事件
          const { EventModel } = await import('@/models/Event');
          const foundEvent = await EventModel.findOne({ 
            $or: [
              { opentixId: eventId },
              { opentixUrl: { $regex: eventId } },
              { url: { $regex: eventId } }
            ]
          }).lean();
          if (foundEvent) {
            event = foundEvent;
            console.log('[Event Question] Found event from recent message:', foundEvent.title, 'URL:', foundEvent.opentixUrl || foundEvent.url);
            break; // 找到第一個匹配的事件就停止
          }
        }
        
        // 如果沒有找到 URL，嘗試從消息中提取事件標題
        // 通常助手消息的格式是：1. 事件標題\n   場館: ...\n   購票: ...
        if (!event) {
          const titleMatch = msg.content.match(/^\d+\.\s*([^\n]+)/m);
          if (titleMatch) {
            const eventTitle = titleMatch[1].trim();
            // 從資料庫中查找該事件
            const { EventModel } = await import('@/models/Event');
            const foundEvent = await EventModel.findOne({ 
              title: { $regex: eventTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
            }).lean();
            if (foundEvent) {
              event = foundEvent;
              console.log('[Event Question] Found event from title:', foundEvent.title);
              break;
            }
          }
        }
        
        // 如果找到事件，就停止搜索（只使用最新的助手消息）
        if (event) {
          break;
        }
      }
    }
  }
  
  // 如果還是沒有，從 session context 獲取
  if (!event && session.userId) {
    event = await sessionManager.getContextEvent(session.userId);
    console.log('[Event Question] Got event from session context:', event?.title);
  }
  if (!event && session.context) {
    event = session.context.selectedEvent || session.context.lastSearchResults?.[0];
    console.log('[Event Question] Got event from session.context:', event?.title);
  }
  
  if (!event) {
    console.log('[Event Question] No event found, userId:', session.userId);
    return {
      reply: userLocale === 'zh-TW'
        ? '很抱歉，我無法找到相關的演出資訊。請重新搜尋。'
        : 'Sorry, I cannot find the related event information. Please search again.',
      quickReply: buildQuickReplies(userLocale),
    };
  }
  
  console.log('[Event Question] Using event:', event.title);
  
  // 格式化事件資訊
  const formattedEvent = formatEventForDisplay(event, { keepFullDescription: false });
  
  // 根據問題類型生成回應
  const questionType = data.questionType || data.intent;
  let answer = '';
  
  if (questionType === 'ask_time' || questionType === 'ASK_TIME') {
    // 由於 Opentix 平台的資料安全機制，無法直接顯示即時的場次時間和剩餘票數
    // 統一返回資料安全說明，引導使用者前往購票頁面查看
    const ticketUrl = formattedEvent.url || formattedEvent.opentixUrl || 'https://www.opentix.life/';
      answer = userLocale === 'zh-TW'
      ? `很抱歉，由於 Opentix 平台的資料安全機制，我無法直接顯示即時的場次時間和剩餘票數。建議您前往購票頁面查看最新的票價、場次時間和剩餘票數：${ticketUrl}`
      : `Sorry, due to Opentix platform's data security mechanism, I cannot directly display real-time show times and remaining tickets. Please visit the ticket page to view the latest prices, show times, and remaining tickets: ${ticketUrl}`;
  } else if (questionType === 'ask_price' || questionType === 'ASK_PRICE') {
    answer = userLocale === 'zh-TW'
      ? `很抱歉，由於 Opentix 平台的資料安全機制，我無法直接顯示即時的票價資訊。建議您前往購票頁面查看最新的票價、場次時間和剩餘票數：${formattedEvent.url || formattedEvent.opentixUrl || 'https://www.opentix.life/'}`
      : `Sorry, due to Opentix platform's data security mechanism, I cannot directly display real-time ticket pricing. Please visit the ticket page to view the latest prices, show times, and remaining tickets: ${formattedEvent.url || formattedEvent.opentixUrl || 'https://www.opentix.life/'}`;
  } else if (questionType === 'ask_venue' || questionType === 'ASK_VENUE') {
    const eventTitle = formattedEvent.title || event.title || 'This event';
    const venue = formattedEvent.venue || event.venue || (userLocale === 'zh-TW' ? '資訊未提供' : 'Information not available');
    answer = userLocale === 'zh-TW'
      ? `「${eventTitle}」的演出地點：${venue}`
      : `"${eventTitle}" venue: ${venue}`;
    console.log('[Event Question] ASK_VENUE response:', { eventTitle, venue, userLocale, answer });
  } else if (questionType === 'ask_artist' || questionType === 'ASK_ARTIST') {
    const artists = formattedEvent.artists?.slice(0, 3).join(', ') || '資訊未提供';
    answer = userLocale === 'zh-TW'
      ? `「${formattedEvent.title}」的演出者：${artists}`
      : `"${formattedEvent.title}" performers: ${artists}`;
  } else {
    // 使用 LLM 回答一般問題
    const recentMessages = await MessageModel.find({
      conversationId: session.conversationId,
    })
      .sort({ timestamp: -1 })
      .limit(3)
      .lean();
    
    const contextForLLM = recentMessages
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }));
    
    let llmMetadata: { latency?: number; error?: string; llmProvider?: string } = {};
    try {
      answer = await generateAssistantReply(contextForLLM, message, {
        foundEvents: [event],
        userLocale: userLocale,
      });
      llmMetadata = extractLLMMetadata(answer);
      answer = cleanMarkdown(answer);
    } catch (err) {
      llmMetadata = extractLLMMetadata(err as Error);
      throw err; // 重新拋出，讓上層處理
    }
  }
  
  // 獲取事件 URL（優先使用 formattedEvent 中的 URL，確保是正確的事件）
  const eventUrl = formattedEvent.url || formattedEvent.opentixUrl || event.opentixUrl || event.url || 'https://www.opentix.life/';
  
  console.log('[Event Question] Using event:', formattedEvent.title, 'URL:', eventUrl);
  
  return {
    reply: answer,
    quickReply: buildSingleEventQuickReply(userLocale, formattedEvent.title, eventUrl, event.eventId),
  };
  } catch (error) {
    console.error('[Event Question] Error:', error);
    return {
      reply: userLocale === 'zh-TW'
        ? '很抱歉，處理您的請求時發生錯誤。請稍後再試或前往 Opentix 網站：https://www.opentix.life/'
        : 'Sorry, an error occurred while processing your request. Please try again later or visit Opentix website: https://www.opentix.life/',
      quickReply: buildQuickReplies(userLocale),
    };
  }
}

/**
 * 處理一般問題（使用 LLM）
 */
async function handleGeneralQuestion(
  message: string,
  session: any,
  userLocale: Locale
): Promise<{ reply: string; quickReply?: any }> {
  // 優先檢查是否為搜尋引導命令
  const searchGuide = detectSearchGuideMessage(message, userLocale);
  if (searchGuide.isGuide) {
    if (searchGuide.type === 'menu') {
      const isZh = userLocale === 'zh-TW';
      return {
        reply: isZh
          ? '🔍 請選擇您的搜尋方式：\n\n您可以透過以下方式搜尋演出：'
          : '🔍 Please choose your search method:\n\nYou can search events by:',
        quickReply: buildSearchGuideQuickReply(userLocale),
      };
    } else {
      // 返回具體搜尋類型的範例和建議
      const guideData = buildSearchTypeGuideQuickReply(userLocale, searchGuide.type!);
      return {
        reply: guideData.message,
        quickReply: guideData.quickReply,
      };
    }
  }
  
  try {
    // 獲取最近的對話歷史（最多 5 條）
    const recentMessages = session.conversationId
      ? await MessageModel.find({
          conversationId: session.conversationId,
        })
          .sort({ timestamp: -1 })
          .limit(5)
          .lean()
      : [];
    
    const contextForLLM = recentMessages
      .reverse()
      .map((m: any) => ({ role: m.role, content: m.content }));
    
    // 使用 LLM 回答一般問題
    const { generateAssistantReply } = await import('./llm.service');
    const { cleanMarkdown } = await import('@/lib/utils/format');
    
    let answer = await generateAssistantReply(contextForLLM, message, {
      userLocale: userLocale,
    });
    answer = cleanMarkdown(answer);
    
    // 確保回答在職責範圍內
    // 如果回答看起來不在職責範圍內，添加引導
    const answerLower = answer.toLowerCase();
    const isOutOfScope = 
      answerLower.includes('天氣') || 
      answerLower.includes('weather') ||
      (answerLower.includes('無法') && !answerLower.includes('演出')) ||
      (answerLower.includes('cannot') && !answerLower.includes('event'));
    
    if (isOutOfScope) {
      // 禮貌地引導回職責範圍
      const guidance = userLocale === 'zh-TW'
        ? '\n\n💡 我是 Opentix 音樂演出諮詢小幫手，主要協助您搜尋和查詢音樂演出相關資訊。如需其他協助，請選擇下方功能！'
        : '\n\n💡 I am the Opentix Music Event Information Assistant, specializing in helping you search and query music event information. For other assistance, please select a function below!';
      answer = answer + guidance;
    }
    
    return {
      reply: answer,
      quickReply: buildQuickReplies(userLocale),
    };
  } catch (error) {
    console.error('[General Question] Error:', error);
    return {
      reply: userLocale === 'zh-TW'
        ? '很抱歉，處理您的問題時發生錯誤。請稍後再試或選擇下方功能。'
        : 'Sorry, an error occurred while processing your question. Please try again later or select a function below.',
      quickReply: buildQuickReplies(userLocale),
    };
  }
}

/**
 * 處理顯示事件詳情
 */
async function handleShowEventDetails(
  data: any,
  userLocale: Locale
): Promise<{ reply: string; quickReply?: any }> {
  const event = data.event;
  const formattedEvent = formatEventForDisplay(event, { keepFullDescription: true });
  
  let reply = `${formattedEvent.title}\n`;
  if (formattedEvent.subtitle) reply += `${formattedEvent.subtitle}\n`;
  if (formattedEvent.artists && formattedEvent.artists.length > 0) {
    reply += `演出者: ${formattedEvent.artists.slice(0, 3).join(', ')}\n`;
  }
  if (formattedEvent.venue) reply += `場館: ${formattedEvent.venue}\n`;
  // 注意：不顯示演出時間，因為爬蟲無法取得準確的場次時間和剩餘票數
  // 這些資訊需要使用者前往購票頁面查看
  if (formattedEvent.url) reply += `購票: ${formattedEvent.url}`;
  
  // 獲取事件 URL
  const eventUrl = formattedEvent.url || formattedEvent.opentixUrl;
  
  return {
    reply,
    quickReply: buildSingleEventQuickReply(userLocale, formattedEvent.title, eventUrl, event.eventId),
  };
}

/**
 * 處理顯示事件列表
 */
async function handleShowEventList(
  data: any,
  userLocale: Locale
): Promise<{ reply: string; quickReply?: any }> {
  // 這個功能已經在 handleSearchAction 中處理
  return {
    reply: userLocale === 'zh-TW' ? '請選擇一個演出查看詳情' : 'Please select an event to view details',
    quickReply: buildSearchResultQuickReply(userLocale),
  };
}

/**
 * 處理顯示 FAQ
 */
async function handleShowFAQ(
  data: any,
  userLocale: Locale
): Promise<{ reply: string; quickReply?: any }> {
  // 這個功能應該由 section.service 處理
  return {
    reply: userLocale === 'zh-TW' ? 'FAQ 功能' : 'FAQ feature',
    quickReply: buildQuickReplies(userLocale),
  };
}

/**
 * 主要的訊息處理函數（使用狀態機架構）
 */
export async function handleUserMessageWithStateMachine(params: {
  userId: string;
  message: string;
  replyToken: string;
  locale?: string;
}) {
  await connectMongo();
  
  try {
    // 獲取或建立 session
    const session = await sessionManager.getOrCreateSession(params.userId);
    
    // 獲取使用者語言設定
    let userLocale: Locale = params.locale as Locale || session.context.language;
    if (!userLocale) {
      try {
        const { getUserLocale } = await import('@/services/locale.service');
        userLocale = await getUserLocale(params.userId);
      } catch (err) {
        userLocale = 'zh-TW';
      }
    }
    
    // 更新語言設定（如果需要）
    if (params.locale && params.locale !== session.context.language) {
      await sessionManager.updateLanguage(params.userId, params.locale as Locale);
      userLocale = params.locale as Locale;
    }
    
    // 儲存使用者訊息
    let conversation = await ConversationModel.findOne({ userId: params.userId });
    if (!conversation) {
      conversation = await ConversationModel.create({ userId: params.userId });
    }
    const conversationId = conversation._id;
    
    await MessageModel.create({
      conversationId,
      role: 'user',
      content: params.message,
    });
    
    // 檢查是否是收藏相關命令（優先處理）
    // 支持中英文命令
    if (params.message.startsWith('收藏:') || params.message.startsWith('Favorite:')) {
      return await handleAddFavorite(params.message, params.userId, userLocale);
    }
    
    if (params.message.startsWith('取消收藏:') || params.message.startsWith('Remove:') || params.message.startsWith('Unfavorite:')) {
      return await handleRemoveFavorite(params.message, params.userId, userLocale);
    }
    
    if (params.message === '我的收藏' || params.message === 'My Favorites' || params.message.toLowerCase() === 'favorites') {
      return await handleShowFavorites(params.userId, userLocale);
    }
    
    // 使用狀態機處理訊息
    const transition = await stateMachine.handleMessage(session, params.message);
    
    console.log('[State Machine] Transition:', {
      currentState: session.state,
      nextState: transition.nextState,
      actionType: transition.action.type,
      message: params.message,
    });
    
    // 更新 session 狀態
    await sessionManager.updateState(params.userId, transition.nextState);
    
    // 處理動作並生成回應
    const result = await handleAction(
      transition.action,
      { ...session, conversationId },
      userLocale,
      params.message
    );
    
    const { reply, quickReply } = result;
    
    // 如果動作是顯示事件詳情，更新選中的事件
    if (transition.action.type === 'SHOW_EVENT_DETAILS') {
      await sessionManager.selectEvent(params.userId, transition.action.data.index || 0);
    }
    
    // 提取 LLM 元數據（如果有的話）
    let llmMetadata: { latency?: number; error?: string; llmProvider?: string } = {};
    if ((reply as any).__metadata) {
      llmMetadata = (reply as any).__metadata;
    }
    
    // 儲存助手回應（包含元數據）
    await MessageModel.create({
      conversationId,
      role: 'assistant',
      content: typeof reply === 'string' ? reply : String(reply),
      metadata: {
        llmProvider: llmMetadata.llmProvider,
        latency: llmMetadata.latency,
        error: llmMetadata.error,
      },
    });
    
    // 更新對話統計
    await ConversationModel.updateOne(
      { _id: conversationId },
      { $set: { lastMessageAt: new Date() }, $inc: { messageCount: 2 } }
    );
    
    return {
      replyText: reply,
      quickReply,
    };
  } catch (error) {
    console.error('[handleUserMessageWithStateMachine] Error:', error);
    const { logger } = await import('@/lib/utils/logger');
    logger.error('State machine handler failed:', error);
    
    // 降級處理：嘗試使用舊的處理函數
    try {
      const { handleUserMessage } = await import('@/services/chat.service');
      return await handleUserMessage({
        userId: params.userId,
        message: params.message,
        replyToken: params.replyToken,
        locale: params.locale,
      });
    } catch (fallbackError) {
      console.error('[handleUserMessageWithStateMachine] Fallback also failed:', fallbackError);
      // 最後的降級：返回錯誤訊息
      const userLocale = params.locale || 'zh-TW';
      return {
        replyText: userLocale === 'zh-TW'
          ? '很抱歉，處理您的請求時發生錯誤。請稍後再試或直接前往 Opentix 官網：https://www.opentix.life/'
          : 'Sorry, an error occurred while processing your request. Please try again later or visit Opentix website: https://www.opentix.life/',
        quickReply: buildQuickReplies(userLocale),
      };
    }
  }
}

/**
 * 處理添加收藏
 */
async function handleAddFavorite(message: string, userId: string, userLocale: Locale) {
  const isZh = userLocale === 'zh-TW';
  
  // 提取 eventId（支持中英文命令）
  const eventId = message.replace('收藏:', '').replace('Favorite:', '').trim();
  
  if (!eventId) {
    return {
      replyText: isZh ? '收藏失敗：無法識別演出ID' : 'Failed: Cannot identify event ID',
      quickReply: buildQuickReplies(userLocale),
    };
  }
  
  console.log('[handleAddFavorite] Requested eventId:', eventId);
  
  try {
    // 優先從數據庫查詢，確保使用正確的事件ID
    const { EventModel } = await import('@/models/Event');
    const { connectMongo } = await import('@/lib/db/mongodb');
    
    await connectMongo();
    
    // 優先查詢 eventId 字段（精確匹配）
    let event = await EventModel.findOne({ eventId: eventId }).lean();
    
    // 如果 eventId 字段找不到，嘗試查詢 _id（僅當 eventId 看起來像 MongoDB ObjectId 時）
    if (!event) {
      // 檢查是否可能是 MongoDB ObjectId（24個十六進制字符）
      if (/^[0-9a-fA-F]{24}$/.test(eventId)) {
        try {
          const mongoose = await import('mongoose');
          const objectId = new mongoose.Types.ObjectId(eventId);
          event = await EventModel.findOne({ _id: objectId }).lean();
        } catch (idError) {
          // 如果 ObjectId 轉換失敗，忽略
          console.warn('[handleAddFavorite] Invalid ObjectId format:', eventId);
        }
      }
    }
    
    if (!event) {
      console.warn('[handleAddFavorite] Event not found in DB:', eventId);
      return {
        replyText: isZh ? '收藏失敗：找不到演出資訊，請重新查詢演出。' : 'Failed: Event not found. Please search again.',
        quickReply: buildQuickReplies(userLocale),
      };
    }
    
    // 使用從數據庫查詢到的事件信息，確保eventId正確
    const finalEventId = event.eventId || event._id?.toString();
    console.log('[handleAddFavorite] Found event:', {
      requestedId: eventId,
      foundEventId: finalEventId,
      foundMongoId: event._id?.toString(),
      title: event.title
    });
    
    // 嚴格驗證：查詢到的事件ID必須與請求的一致
    if (event.eventId && event.eventId !== eventId) {
      console.error('[handleAddFavorite] Event ID mismatch (eventId field):', {
        requested: eventId,
        found: event.eventId
      });
      return {
        replyText: isZh ? '收藏失敗：事件ID不匹配，請重新嘗試。' : 'Failed: Event ID mismatch. Please try again.',
        quickReply: buildQuickReplies(userLocale),
      };
    }
    
    // 如果通過 _id 查詢，也要驗證
    if (!event.eventId && event._id?.toString() !== eventId) {
      console.error('[handleAddFavorite] Event ID mismatch (_id field):', {
        requested: eventId,
        found: event._id?.toString()
      });
      return {
        replyText: isZh ? '收藏失敗：事件ID不匹配，請重新嘗試。' : 'Failed: Event ID mismatch. Please try again.',
        quickReply: buildQuickReplies(userLocale),
      };
    }
    
    // 添加收藏，使用查詢到的事件信息
    const result = await addFavorite(userId, {
      eventId: finalEventId, // 使用查詢到的事件ID，而不是用戶輸入的
      eventTitle: event.title,
      eventUrl: event.opentixUrl,
      venue: event.venue,
      category: event.category,
      imageUrl: event.imageUrl,
    }, userLocale);
    
    console.log('[handleAddFavorite] Favorite result:', result);
    
    return {
      replyText: result.message,
      quickReply: buildQuickReplies(userLocale),
    };
  } catch (error) {
    console.error('[handleAddFavorite] Error:', error);
    return {
      replyText: isZh ? '收藏失敗，請稍後再試。' : 'Failed to add favorite. Please try again.',
      quickReply: buildQuickReplies(userLocale),
    };
  }
}

/**
 * 處理取消收藏
 */
async function handleRemoveFavorite(message: string, userId: string, userLocale: Locale) {
  const isZh = userLocale === 'zh-TW';
  
  // 提取參數（可能是編號或 eventId，支持中英文命令）
  let param = message.replace('取消收藏:', '').replace('Remove:', '').replace('Unfavorite:', '').trim();
  
  if (!param) {
    return {
      replyText: isZh ? '取消收藏失敗：請提供編號或演出ID' : 'Failed: Please provide number or event ID',
      quickReply: buildQuickReplies(userLocale),
    };
  }
  
  try {
    let eventId = param;
    
    // 檢查是否為數字（編號）
    const indexNum = parseInt(param);
    if (!isNaN(indexNum) && indexNum > 0) {
      // 從 session 獲取收藏列表
      const session = await sessionManager.getOrCreateSession(userId);
      let favoritesList = session.context.favoritesList || [];
      
      // 如果 session 中沒有收藏列表，從數據庫重新獲取
      if (favoritesList.length === 0) {
        console.log('[Remove Favorite] favoritesList not in session, fetching from DB');
        const { favorites } = await getFavorites(userId, 10);
        favoritesList = favorites.map((fav: any) => ({
          eventId: fav.eventId,
          title: fav.eventTitle,
        }));
        
        // 更新 session 中的收藏列表
        if (favoritesList.length > 0) {
          await sessionManager.updateContext(userId, {
            ...session.context,
            favoritesList: favoritesList,
          });
        }
      }
      
      console.log(`[Remove Favorite] favoritesList length: ${favoritesList.length}, indexNum: ${indexNum}`);
      
      // 檢查編號是否有效
      if (favoritesList.length === 0) {
        return {
          replyText: isZh 
            ? `您目前沒有收藏任何演出。\n\n點擊「🎵 熱門演出」開始探索精彩的音樂演出！` 
            : `You don't have any favorites yet.\n\nClick '🎵 Popular Events' to start exploring!`,
          quickReply: buildQuickReplies(userLocale),
        };
      }
      
      if (indexNum > favoritesList.length) {
        return {
          replyText: isZh 
            ? `編號 ${indexNum} 無效。您目前有 ${favoritesList.length} 個收藏。\n請先輸入「我的收藏」查看列表。` 
            : `Number ${indexNum} is invalid. You have ${favoritesList.length} favorites.\nPlease type "My Favorites" to see the list.`,
          quickReply: buildQuickReplies(userLocale),
        };
      }
      
      // 獲取對應的 eventId
      eventId = favoritesList[indexNum - 1].eventId;
      console.log(`[Remove Favorite] Using index ${indexNum} -> eventId: ${eventId}`);
    }
    
    // 執行刪除
    const result = await removeFavorite(userId, eventId, userLocale);
    
    // 清除 session 中的收藏列表快取，讓用戶下次查看時獲取最新的
    if (result.success) {
      const session = await sessionManager.getOrCreateSession(userId);
      await sessionManager.updateContext(userId, {
        ...session.context,
        favoritesList: undefined,
      });
    }
    
    return {
      replyText: result.message,
      quickReply: buildQuickReplies(userLocale),
    };
  } catch (error) {
    console.error('[handleRemoveFavorite] Error:', error);
    return {
      replyText: isZh ? '取消收藏失敗，請稍後再試。' : 'Failed to remove favorite. Please try again.',
      quickReply: buildQuickReplies(userLocale),
    };
  }
}

/**
 * 處理顯示收藏列表
 */
async function handleShowFavorites(userId: string, userLocale: Locale) {
  const isZh = userLocale === 'zh-TW';
  
  try {
    const result = await getFavorites(userId, 10);
    const favorites = result.favorites || [];
    const total = favorites.length;
    
    console.log(`[Show Favorites] User ${userId} has ${total} favorites`);
    
    if (total === 0) {
      return {
        replyText: isZh 
          ? '您還沒有收藏任何演出。\n\n點擊「🎵 熱門演出」開始探索精彩的音樂演出！' 
          : "You haven't added any favorites yet.\n\nClick '🎵 Popular Events' to start exploring!",
        quickReply: buildQuickReplies(userLocale),
      };
    }
    
    // 將收藏列表存儲到 session context，供取消收藏時使用
    const session = await sessionManager.getOrCreateSession(userId);
    await sessionManager.updateContext(userId, {
      ...session.context,
      favoritesList: favorites.map((fav: any) => ({
        eventId: fav.eventId,
        title: fav.eventTitle,
      })),
    });
    
    // 構建收藏列表回覆（精簡版，使用編號）
    let reply = isZh 
      ? `⭐ 您的收藏（共 ${total} 個）\n\n` 
      : `⭐ Your Favorites (${total} total)\n\n`;
    
    favorites.forEach((fav: any, idx: number) => {
      reply += `${idx + 1}. ${fav.eventTitle}\n`;
      reply += `   ${fav.eventUrl}\n\n`;
    });
    
    // 添加取消收藏說明（使用編號，根據語言使用不同命令）
    if (isZh) {
      reply += `💡 取消收藏方式：\n`;
      reply += `請鍵入「取消收藏:編號」\n`;
      reply += `例如：取消收藏:1`;
    } else {
      reply += `💡 To remove a favorite:\n`;
      reply += `Type "Remove:number"\n`;
      reply += `Example: Remove:1`;
    }
    
    return {
      replyText: reply,
      quickReply: buildQuickReplies(userLocale),
    };
  } catch (error) {
    console.error('[handleShowFavorites] Error:', error);
    return {
      replyText: isZh ? '獲取收藏列表失敗，請稍後再試。' : 'Failed to get favorites. Please try again.',
      quickReply: buildQuickReplies(userLocale),
    };
  }
}

