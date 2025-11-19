import { connectMongo } from '@/lib/db/mongodb';
import { ConversationModel } from '@/models/Conversation';
import { MessageModel } from '@/models/Message';
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
} from '@/lib/line/templates';
import { Locale } from '@/lib/i18n';

// 檢查是否包含後續問題關鍵字
function hasFollowUpKeyword(message: string): boolean {
  const q = message.trim().toLowerCase();
  const followUpKeywords = [
    '票價', '價格', '多少錢', '價錢', 'price', 'cost', 'ticket price',
    '時間', '日期', '什麼時候', 'when', 'date', 'time',
    '地點', '在哪裡', 'where', 'location', 'venue',
    '詳情', '詳細', '介紹', '簡介', '說明', '講', '內容', '是什麼', '關於',
    'details', 'info', 'information', 'introduce', 'introduction', 'about', 'describe', 'description', 'tell me about',
    '如何', '怎麼', 'how', '怎麼買', '如何購票',
  ];
  return followUpKeywords.some((keyword) => q.includes(keyword));
}

// 檢查是否包含具體的演出/藝人/場館名稱（至少 3 個中文字或 5 個英文字母）
function hasSpecificContent(message: string): boolean {
  const q = message.trim();
  
  // 移除後續問題關鍵字，檢查剩餘內容
  const cleanedMessage = q
    .replace(/(票價|價格|多少錢|價錢|時間|日期|什麼時候|何時|何時開始|何時結束|地點|在哪裡|詳情|詳細|介紹|簡介|說明|講|內容|是什麼|關於|如何|怎麼|怎麼買|如何購票|是多少|price|cost|ticket price|when|date|time|where|location|venue|details|info|information|introduce|introduction|about|describe|description|tell me about|how|一下|給我|跟我|開始|結束|start|end)/gi, '')
    .replace(/[\s\?\？]/g, '')
    .trim();
  
  // 移除指示詞（這個、那個、它、他等）
  const finalMessage = cleanedMessage
    .replace(/^(這個|那個|它|他|她|該|此|本)/, '')
    .trim();
  
  // 檢查是否有足夠的具體內容
  const chineseChars = finalMessage.match(/[\u4e00-\u9fa5]/g);
  const englishLetters = finalMessage.match(/[a-zA-Z]/g);
  
  // 至少 2 個中文字或 3 個英文字母（降低門檻，因為已經移除了指示詞）
  // 或者如果包含「表演」、「演出」、「節目」等詞，也視為有具體內容
  const hasEventKeyword = /(表演|演出|節目|音樂會|演唱會|concert|show|event)/i.test(finalMessage);
  
  return (
    hasEventKeyword ||
    (chineseChars && chineseChars.length >= 2) ||
    (englishLetters && englishLetters.length >= 3)
  );
}

// 判斷是否是後續問題
function isFollowUpQuestion(msg: string): boolean {
  const q = msg.trim().toLowerCase();
  const followUpKeywords = [
    '票價', '價格', '多少錢', '價錢', 'price', 'cost', 'ticket price',
    '時間', '日期', '什麼時候', '何時', '何時開始', '何時結束', 'when', 'date', 'time', 'start', 'end',
    '地點', '在哪裡', 'where', 'location', 'venue',
    '詳情', '詳細', '介紹', 'details', 'info', 'information',
    '如何', '怎麼', 'how', '怎麼買', '如何購票',
    '開始', '結束', '演出時間', '表演時間', '演出日期', '表演日期',
  ];
  return followUpKeywords.some((keyword) => q.includes(keyword));
}

function shouldSearchEvents(message: string): boolean {
  const q = message.trim().toLowerCase();
  if (!q || q.length < 1) return false;
  
  // 排除純指令詞（這些應該由 webhook 層級處理）
  const commandWords = ['搜尋', 'search', '幫助', 'help', 'menu', '找', '查', '搜'];
  if (commandWords.includes(q)) {
    return false;
  }
  
  // 排除無意義的單字回應
  const meaninglessWords = ['是', '否', '對', '錯', '好', '不好', '可以', '不行', 'ok', 'yes', 'no'];
  if (meaninglessWords.includes(q)) {
    return false;
  }
  
  // **關鍵邏輯改進**：區分「純後續問題」和「帶演出名稱的後續問題」
  // 如果包含後續問題關鍵字（如「票價」、「何時開始」）
  if (hasFollowUpKeyword(message)) {
    // 檢查是否包含指向對話歷史的指示詞（這兩場、這些、剛才等）
    const hasContextPronoun = /(這兩場|這些|剛才|之前|上面|下面|剛才的|之前的|上面的|下面的|這兩|這些|the\s+two|these|those|above|below|previous)/i.test(message);
    
    if (hasContextPronoun) {
      // 包含指向對話歷史的指示詞：例如「是否可以告訴我這兩場的表演時間」
      // 這種情況應該依賴對話歷史，不進行新的搜尋
      console.log('[Search Decision] Follow-up question with context pronoun, will use context (no search)');
      return false;
    }
    
    // **新增：檢查是否包含引號包圍的完整演出名稱（如「「XXX」的演出時間是什麼時候」）**
    // 這種情況應該視為純後續問題，不觸發搜尋
    const hasQuotedEventName = /[「"「『]([^」"」』]+)[」"」』].*(?:的|演出時間|表演時間|票價|價格|地點|在哪裡|演出者|表演者)/i.test(message) ||
                                /(?:的|演出時間|表演時間|票價|價格|地點|在哪裡|演出者|表演者).*[「"「『]([^」"」』]+)[」"」』]/i.test(message);
    
    if (hasQuotedEventName) {
      // 包含引號包圍的完整演出名稱的後續問題：例如「「XXX」的演出時間是什麼時候」
      // 這種情況應該依賴對話歷史，不進行新的搜尋
      console.log('[Search Decision] Follow-up question with quoted event name, will use context (no search)');
      return false;
    }
    
    // 檢查是否同時包含具體的演出/藝人/場館名稱
    if (hasSpecificContent(message)) {
      // 包含具體內容：例如「愛與遠方～日本武尊篇 票價是多少」
      // **但需要排除已經在對話歷史中的演出名稱**
      // 如果問題格式是「XXX 的 YYY」（如「XXX 的演出時間是什麼時候」），可能是後續問題
      const hasPossessivePattern = /(.+?)\s*(?:的|of)\s*(?:演出時間|表演時間|票價|價格|地點|在哪裡|演出者|表演者|show\s+time|ticket\s+price|location|venue|performers)/i.test(message);
      
      if (hasPossessivePattern) {
        // 這種格式通常是後續問題（「XXX 的 YYY」），應該依賴上下文
        console.log('[Search Decision] Follow-up question with possessive pattern, will use context (no search)');
        return false;
      }
      
      // 其他包含具體內容的情況：例如「愛與遠方～日本武尊篇 票價是多少」（沒有「的」）
      // 這種情況應該搜尋資料庫（先找到演出，再回答票價問題）
      console.log('[Search Decision] Follow-up question with specific content, will search database');
      return true;
    } else {
      // 純後續問題：例如「票價是多少」、「在哪裡」、「這個表演何時開始」
      // 檢查是否包含指示詞（這個、那個等）
      const hasPronoun = /^(這個|那個|它|他|她|該|此|本|the|this|that|it)/i.test(message.trim());
      
      if (hasPronoun) {
        // 包含指示詞的後續問題：例如「這個表演何時開始」
        // 這種情況應該依賴對話歷史，不進行新的搜尋
        console.log('[Search Decision] Follow-up question with pronoun, will use context (no search)');
        return false;
      } else {
        // 純後續問題但沒有指示詞：例如「票價是多少」
        // 這種情況也依賴對話歷史，不搜尋
        console.log('[Search Decision] Pure follow-up question without specific content, will use context');
        return false;
      }
    }
  }
  
  // 判斷是否為演出查詢
  const keywords = [
    '演唱會',
    '音樂會',
    '演出',
    '表演',
    'concert',
    'show',
    '音樂家',
    '鋼琴家',
    '有嗎',
  ];
  
  // 常見場館名稱（即使沒有關鍵字也應該搜尋）
  const venueKeywords = [
    '衛武營',
    '國家音樂廳',
    '國家戲劇院',
    '兩廳院',
    '臺北表演藝術中心',
    '臺中國家歌劇院',
    '苗北',
    '新竹',
    '桃園',
    '高雄',
  ];
  
  // 如果包含關鍵字、場館名稱、或至少 2 個英文字母（可能是藝人名稱或場館），就應該搜尋
  return (
    keywords.some((k) => q.includes(k)) ||
    venueKeywords.some((v) => q.includes(v)) ||
    /[a-zA-Z]{2,}/.test(q) ||
    /[\u4e00-\u9fa5]{2,}/.test(q) // 至少 2 個中文字（可能是場館或藝人名稱）
  );
}

function extractArtistName(message: string): string | null {
  // 改進的提取邏輯：處理各種格式的藝人名稱
  
  // 常見的疑問詞和助詞，應該被排除
  const stopWords = new Set([
    'are', 'there', 'any', 'is', 'what', 'who', 'where', 'when', 'how',
    'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
    '有', '找', '查', '搜', '有沒有', '想找', '想看', '的', '嗎', '？'
  ]);

  // 優先匹配：專有名詞（首字母大寫的單詞組合，如 "Eric Lu"）
  const properNounPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/;
  const properNounMatch = message.match(properNounPattern);
  if (properNounMatch) {
    const name = properNounMatch[1].trim();
    // 排除常見疑問詞開頭的組合
    const firstWord = name.split(/\s+/)[0].toLowerCase();
    if (!stopWords.has(firstWord) && name.length >= 3) {
      return name;
    }
  }

  // 匹配：在 "Eric lu" 或 "eric lu" 這種格式（第一個單詞首字母大寫或全小寫）
  const namePattern1 = /\b([A-Z][a-z]+|eric|lu|lin|chen|wang|li|zhang)\s+([a-z]{2,})\b/i;
  const nameMatch1 = message.match(namePattern1);
  if (nameMatch1) {
    const name = `${nameMatch1[1]} ${nameMatch1[2]}`.trim();
    const firstWord = name.split(/\s+/)[0].toLowerCase();
    if (!stopWords.has(firstWord) && name.length >= 3) {
      return name;
    }
  }

  // 匹配：在「有/找/查」之後的名稱（中文）
  // 例如：「有齊瑪曼的音樂會嗎」→ 提取「齊瑪曼」（不是「齊瑪曼的」）
  const chinesePattern = /(?:有|找|查|搜|有沒有|想找|想看)([\u4e00-\u9fa5]{2,6})(?:的|演出|音樂會|演唱會|演奏|消息|訊息|嗎|？|\?)/;
  const chineseMatch = message.match(chinesePattern);
  if (chineseMatch && chineseMatch[1]) {
    const name = chineseMatch[1].trim();
    // 確保名稱不包含「的」字
    return name.replace(/的$/, '');
  }

  // 匹配：在 "Eric lu's" 或 "Eric lu concert" 這種格式
  const possessivePattern = /\b([A-Z][a-z]+\s+[a-z]+)['']s/i;
  const possessiveMatch = message.match(possessivePattern);
  if (possessiveMatch) {
    const name = possessiveMatch[1].trim();
    const firstWord = name.split(/\s+/)[0].toLowerCase();
    if (!stopWords.has(firstWord) && name.length >= 3) {
      return name;
    }
  }

  // 匹配：在 "concert by Eric lu" 或 "Eric lu concert" 這種格式
  const byPattern = /(?:by|from|of)\s+([A-Z][a-z]+\s+[a-z]+)/i;
  const byMatch = message.match(byPattern);
  if (byMatch) {
    const name = byMatch[1].trim();
    const firstWord = name.split(/\s+/)[0].toLowerCase();
    if (!stopWords.has(firstWord) && name.length >= 3) {
      return name;
    }
  }

  // 最後嘗試：提取所有英文單詞，排除疑問詞，取最後兩個單詞作為可能的藝人名稱
  const words = message.split(/\s+/);
  const englishWords = words
    .filter((w) => /^[A-Za-z]{2,}$/.test(w))
    .filter((w) => !stopWords.has(w.toLowerCase()));
  
  if (englishWords.length >= 2) {
    // 取最後兩個單詞（通常是藝人名稱）
    const candidate = englishWords.slice(-2).join(' ');
    if (candidate.length >= 3) {
      return candidate;
    }
  }

  return null;
}

function buildOpentixSearchUrl(query: string): string {
  const base = 'https://www.opentix.life/search?keyword=';
  return `${base}${encodeURIComponent(query.trim())}`;
}

export async function handleUserMessage(params: {
  userId: string;
  message: string;
  replyToken: string;
  locale?: string;
}) {
  await connectMongo();

  // 獲取使用者語言設定（優先使用傳入的 locale，否則從資料庫獲取）
  let userLocale: Locale;
  if (params.locale) {
    userLocale = params.locale as Locale;
  } else {
    try {
      const { getUserLocale } = await import('@/services/locale.service');
      userLocale = await getUserLocale(params.userId);
    } catch (err) {
      console.warn('Failed to get user locale, using default:', err);
      userLocale = 'zh-TW';
    }
  }

  let conversation = await ConversationModel.findOne({ userId: params.userId }).lean();
  if (!conversation) {
    conversation = await ConversationModel.create({ userId: params.userId });
  }

  const conversationId = (conversation as any)._id;

  const recent = await MessageModel.find({ conversationId })
    .sort({ timestamp: -1 })
    .limit(10)
    .lean();

  await MessageModel.create({
    conversationId,
    role: 'user',
    content: params.message,
  });

  let reply: string;
  let foundEvents: any[] = [];
  let llmMetadata: { latency?: number; error?: string; llmProvider?: string } = {}; // 在函數級別定義，以便在所有地方訪問
  // userLocale 已在上面定義

  try {
    // 先嘗試在資料庫中搜尋演出
    if (shouldSearchEvents(params.message)) {
      // 使用新的查詢解析器
      const parsedQuery = await parseQuery(params.message);
      console.log('[Event Search] Parsed query:', {
        queryType: parsedQuery.queryType,
        venues: parsedQuery.venues,
        artists: parsedQuery.artists,
        categories: parsedQuery.categories,
        keywords: parsedQuery.keywords,
      });
      
      console.log('[Query Parser] Parsed query:', {
        type: parsedQuery.queryType,
        artists: parsedQuery.artists,
        artistInfo: parsedQuery.artistInfo,
        venues: parsedQuery.venues,
        categories: parsedQuery.categories,
        dateRange: parsedQuery.dateRange,
      });

      let searchResult: any = { events: [], total: 0, query: params.message };

      // 根據查詢類型選擇最適合的搜尋策略
      if (parsedQuery.queryType === 'artist' && parsedQuery.artists && parsedQuery.artists.length > 0) {
        // 藝人搜尋：優先使用藝人搜尋 API
        // 如果有知識庫資訊，使用標準化名稱；否則使用原始名稱
        const artistName = parsedQuery.artistInfo?.normalizedName || parsedQuery.artists[0];
        console.log('[Event Search] Using artist search for:', artistName);
        if (parsedQuery.artistInfo) {
          console.log('[Event Search] Artist info:', {
            profession: parsedQuery.artistInfo.profession,
            aliases: parsedQuery.artistInfo.aliases,
          });
        }
        searchResult = await searchEventsByArtist(artistName, 5);
        console.log('[Event Search] Artist search results:', searchResult.events.length);
        
        // 如果藝人搜尋沒有結果，嘗試更寬鬆的搜尋策略
        if (searchResult.events.length === 0) {
          console.log('[Event Search] No results from artist search, trying fallback strategies');
          
          // 策略 1: 嘗試用原始查詢中的藝人名稱做一次一般搜尋
          const fallbackResult = await searchEvents(artistName, 10);
          console.log('[Event Search] Fallback general search results:', fallbackResult.events.length);
          
          if (fallbackResult.events.length > 0) {
            // 使用相關性檢查過濾
            const { isEventRelevantToArtist } = await import('@/lib/utils/event-formatter');
            const relevantEvents = fallbackResult.events.filter((event: any) => {
              return isEventRelevantToArtist(event, artistName);
            });
            console.log('[Event Search] Relevant events after filtering:', relevantEvents.length);
            
            if (relevantEvents.length > 0) {
              searchResult = { ...fallbackResult, events: relevantEvents };
              console.log('[Event Search] Using fallback search results:', relevantEvents.length);
            } else {
              // 策略 2: 如果還是沒有結果，嘗試只匹配單個單詞（更寬鬆）
              const words = artistName.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
              if (words.length > 0) {
                console.log('[Event Search] Trying single-word match:', words);
                const singleWordResults = fallbackResult.events.filter((event: any) => {
                  const title = (event.title || '').toLowerCase();
                  const artists = (event.artists || []).join(' ').toLowerCase();
                  const desc = (event.description || '').toLowerCase();
                  return words.some((w) => title.includes(w) || artists.includes(w) || desc.includes(w));
                });
                if (singleWordResults.length > 0) {
                  searchResult = { ...fallbackResult, events: singleWordResults };
                  console.log('[Event Search] Found events with single-word match:', singleWordResults.length);
                }
              }
            }
          }
        }
      } else if (parsedQuery.queryType === 'venue' && parsedQuery.venues && parsedQuery.venues.length > 0) {
        // 場館搜尋：使用場館搜尋 API
        const venueName = parsedQuery.venues[0];
        console.log('[Event Search] Using venue search for:', venueName);
        searchResult = await searchEventsByVenue(venueName, 5);
        console.log('[Event Search] Venue search results:', searchResult.events.length);
        
        // 如果場館搜尋沒有結果，不要降級到一般搜尋（避免返回錯誤的場館）
        if (searchResult.events.length === 0) {
          console.log('[Event Search] No results from venue search, keeping empty result');
        }
      } else if (parsedQuery.queryType === 'category' && parsedQuery.categories && parsedQuery.categories.length > 0) {
        // 類型搜尋：使用類型搜尋 API
        const category = parsedQuery.categories[0];
        searchResult = await searchEventsByCategory(category, 5);
        console.log('[Event Search] Category search results:', searchResult.events.length);
      } else if (parsedQuery.queryType === 'date' && parsedQuery.dateRange) {
        // 時間搜尋：使用時間範圍搜尋 API
        const { start, end } = parsedQuery.dateRange;
        if (start && end) {
          searchResult = await searchEventsByDateRange(start, end, 5);
          console.log('[Event Search] Date range search results:', searchResult.events.length);
        }
      } else if (parsedQuery.queryType === 'mixed') {
        // 複合查詢：使用進階搜尋 API
        searchResult = await searchEventsAdvanced({
          artists: parsedQuery.artists,
          venues: parsedQuery.venues,
          categories: parsedQuery.categories,
          dateRange: parsedQuery.dateRange,
          keywords: parsedQuery.keywords,
          limit: 5,
        });
        console.log('[Event Search] Advanced search results:', searchResult.events.length);
      } else {
        // 一般搜尋：使用全文搜尋
        // 如果 parseQuery 提取了 keywords（例如從「帶演出名稱的後續問題」中提取），優先使用 keywords
        const searchQuery = (parsedQuery.keywords && parsedQuery.keywords.length > 0)
          ? parsedQuery.keywords[0]
          : params.message;
        console.log('[Event Search] General search with query:', searchQuery);
        searchResult = await searchEvents(searchQuery, 5);
        console.log('[Event Search] General search results:', searchResult.events.length);
      }

      foundEvents = searchResult.events || [];
      console.log('[Event Search] Final found events:', foundEvents.length);

      // 【重要】立即儲存搜尋結果到 session，確保後續問題能使用最新的搜尋結果
      if (foundEvents.length > 0) {
        const { sessionManager } = await import('@/services/session-manager.service');
        await sessionManager.saveSearchContext(params.userId, foundEvents, params.message);
        console.log('[Session - Chat Service] Saved search context:', {
          userId: params.userId,
          eventCount: foundEvents.length,
          firstEventTitle: foundEvents[0]?.title,
        });
      }

      // 嘗試使用結構化回應（減少 LLM 調用）
      const structuredResponse = buildStructuredResponse(parsedQuery, searchResult, userLocale);
      
      if (!structuredResponse.useLLM && structuredResponse.text) {
        // 直接使用結構化回應，不需要 LLM
        // 特別處理：日期查詢、場館查詢、類型查詢、藝人查詢有結果時，直接返回
        reply = structuredResponse.text;
        const opentixSearchUrl = buildOpentixSearchUrl(params.message);
        if (!reply.includes('opentix.life')) {
          reply += `\n\n${userLocale === 'zh-TW' ? '更多資訊' : 'More info'}: ${opentixSearchUrl}`;
        }
      } else {
        // 需要 LLM 處理（無結果或複雜查詢）
        const opentixSearchUrl = buildOpentixSearchUrl(params.message);
        
        // 特殊處理：日期查詢沒有結果時，直接返回友好回覆，不依賴 LLM
        if (parsedQuery.queryType === 'date' && foundEvents.length === 0) {
          const dateRange = parsedQuery.dateRange;
          let dateRangeText = '';
          if (dateRange && dateRange.start && dateRange.end) {
            const startDate = new Date(dateRange.start).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
            const endDate = new Date(dateRange.end).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
            dateRangeText = `${startDate} 到 ${endDate}`;
          } else {
            dateRangeText = params.message;
          }
          
          reply = userLocale === 'zh-TW'
            ? `很抱歉，在您指定的日期範圍（${dateRangeText}）內目前沒有找到相關演出。\n\n建議您可以：\n• 嘗試擴大日期範圍\n• 或前往 Opentix 官網查看其他日期的演出：${opentixSearchUrl}`
            : `Sorry, no events found in the specified date range (${dateRangeText}).\n\nSuggestions:\n• Try expanding the date range\n• Or visit Opentix website to view events on other dates: ${opentixSearchUrl}`;
        } else {
          // 檢查問題是否過於抽象
          const isAbstractQuery = (msg: string): boolean => {
            const q = msg.trim().toLowerCase();
            if (q.length <= 1) return true;
            if (['搜尋', 'search', '找', '查', '搜'].includes(q)) return true;
            if (['是', '否', '對', '錯', '好', '不好', '可以', '不行'].includes(q)) return true;
            return false;
          };

          if (isAbstractQuery(params.message)) {
            reply = params.locale === 'zh-TW'
              ? '很抱歉，您的問題可能過於抽象，請提供更具體的資訊，例如：\n• 藝人名稱（如：Eric Lu）\n• 演出類型（如：鋼琴演奏會）\n• 場館名稱（如：國家音樂廳）\n\n或選擇下方功能按鈕！'
              : 'Sorry, your question might be too abstract. Please provide more specific information, for example:\n• Artist name (e.g., Eric Lu)\n• Event type (e.g., Piano Concert)\n• Venue name (e.g., National Concert Hall)\n\nOr select a function button below!';
          } else {
          // 對於日期查詢沒有結果的情況，提供更精準的 prompt
          const isDateQuery = parsedQuery.queryType === 'date';
          
          // 使用 LLM 生成回覆（只在必要時）
          const recentForLLM = recent
            .reverse()
            .slice(0, 1)
            .map((m) => ({ role: m.role, content: m.content })) as any;
          
          try {
            reply = await generateAssistantReply(recentForLLM, params.message, {
              opentixSearchUrl,
              foundEvents: foundEvents.length > 0 ? foundEvents : undefined,
              parsedQuery: parsedQuery, // 傳遞解析後的查詢資訊（包含知識庫資訊、日期範圍等）
            });
            llmMetadata = extractLLMMetadata(reply);
            // 清理 Markdown 格式
            reply = cleanMarkdown(reply);
          } catch (err) {
            llmMetadata = extractLLMMetadata(err as Error);
            throw err; // 重新拋出，讓上層處理
          }

          // 驗證回覆相關性（特別是藝人搜尋和日期查詢）
          const messageLower = params.message.toLowerCase();
          const replyLower = reply.toLowerCase();
          
          // 如果是日期查詢但沒有結果，確保回覆明確告知
          if (parsedQuery.queryType === 'date' && foundEvents.length === 0) {
            // 檢查回覆中是否明確提到沒有找到
            const hasNoResultMention = replyLower.includes('沒有找到') || 
                                      replyLower.includes('找不到') || 
                                      replyLower.includes('no events found') ||
                                      replyLower.includes('no results') ||
                                      replyLower.includes('沒有相關演出');
            
            if (!hasNoResultMention) {
              // 提取日期範圍
              const dateRange = parsedQuery.dateRange;
              let dateRangeText = '';
              if (dateRange && dateRange.start && dateRange.end) {
                const startDate = new Date(dateRange.start).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
                const endDate = new Date(dateRange.end).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
                dateRangeText = `${startDate} 到 ${endDate}`;
              } else {
                dateRangeText = params.message;
              }
              
              // 強制使用明確的「沒有找到」回覆
              reply = params.locale === 'zh-TW'
                ? `很抱歉，在您指定的日期範圍（${dateRangeText}）內目前沒有找到相關演出。\n\n建議您可以：\n• 嘗試擴大日期範圍\n• 或前往 Opentix 官網查看其他日期的演出：${opentixSearchUrl}`
                : `Sorry, no events found in the specified date range (${dateRangeText}).\n\nSuggestions:\n• Try expanding the date range\n• Or visit Opentix website to view events on other dates: ${opentixSearchUrl}`;
            } else if (!reply.includes('opentix.life')) {
              reply += `\n\n${userLocale === 'zh-TW' ? '更多資訊' : 'More info'}: ${opentixSearchUrl}`;
            }
          } else if (parsedQuery.queryType === 'artist' && foundEvents.length === 0) {
            // 如果是藝人搜尋但沒有結果，確保回覆明確告知
            // 提取藝人名稱
            const artistName = parsedQuery.artists?.[0] || params.message;
            // 檢查回覆中是否明確提到沒有找到
            const hasNoResultMention = replyLower.includes('沒有找到') || 
                                      replyLower.includes('找不到') || 
                                      replyLower.includes('no events found') ||
                                      replyLower.includes('no results');
            
            if (!hasNoResultMention) {
              // 強制使用明確的「沒有找到」回覆
              reply = params.locale === 'zh-TW'
                ? `很抱歉，目前沒有找到與「${artistName}」相關的演出資訊。\n\n建議：\n• 確認藝人名稱是否正確\n• 或選擇下方功能按鈕查看熱門演出\n\n更多資訊：${opentixSearchUrl}`
                : `Sorry, no events found related to "${artistName}".\n\nSuggestions:\n• Please verify the artist name is correct\n• Or select a function button below to view popular events\n\nMore info: ${opentixSearchUrl}`;
            } else if (!reply.includes('opentix.life')) {
              reply += `\n\n${userLocale === 'zh-TW' ? '更多資訊' : 'More info'}: ${opentixSearchUrl}`;
            }
          } else {
            // 一般相關性檢查
            const hasRelevance =
              foundEvents.length > 0 ||
              messageLower.split(/\s+/).some((word) => word.length > 2 && replyLower.includes(word)) ||
              /[\u4e00-\u9fa5]/.test(messageLower);

            if (!hasRelevance && foundEvents.length === 0) {
              reply = params.locale === 'zh-TW'
                ? `很抱歉，沒有找到與「${params.message}」相關的演出資訊。\n\n請嘗試：\n• 提供更具體的資訊（如藝人名稱、演出類型）\n• 或選擇下方功能按鈕查看熱門演出\n\n更多資訊：${opentixSearchUrl}`
                : `Sorry, no events found related to "${params.message}".\n\nPlease try:\n• Providing more specific information (e.g., artist name, event type)\n• Or select a function button below to view popular events\n\nMore info: ${opentixSearchUrl}`;
            } else if (foundEvents.length > 0 && !reply.includes('opentix.life')) {
              reply += `\n\n${userLocale === 'zh-TW' ? '更多資訊' : 'More info'}: ${opentixSearchUrl}`;
            } else if (foundEvents.length === 0 && shouldSearchEvents(params.message) && !reply.includes('opentix.life')) {
              reply += `\n\n${userLocale === 'zh-TW' ? '更多資訊' : 'More info'}: ${opentixSearchUrl}`;
            }
          }
          }
        }
      }
    } else {
      // 不是搜尋查詢，使用 LLM 處理
      // 如果是後續問題，嘗試從最近的對話中找到相關演出
      if (isFollowUpQuestion(params.message) && foundEvents.length === 0) {
        // 查找最近的 assistant 回覆，看看是否有提到演出
        const recentAssistantMessages = recent
          .filter((m) => m.role === 'assistant')
          .slice(0, 3); // 檢查最近 3 條 assistant 回覆
        
        // 嘗試從回覆中提取演出資訊（簡單的啟發式方法）
        // 如果最近的回覆包含「找到了」或「演出」，可能是搜尋結果
        for (const msg of recentAssistantMessages) {
          const content = (msg.content || '').toLowerCase();
          if (content.includes('找到了') || content.includes('演出') || content.includes('event')) {
            // 這可能是搜尋結果，但我們無法直接提取演出資訊
            // 所以我們需要告訴 LLM 這是後續問題
            console.log('[Context] Detected follow-up question, recent assistant message found');
            break;
          }
        }
      }
      
      const opentixSearchUrl = buildOpentixSearchUrl(params.message);
      // 對於後續問題，傳遞更多上下文（最近 3 條對話）
      const recentForLLM = recent
        .reverse()
        .slice(0, isFollowUpQuestion(params.message) ? 3 : 1)
        .map((m) => ({ role: m.role, content: m.content })) as any;
      
      try {
        reply = await generateAssistantReply(recentForLLM, params.message, {
          opentixSearchUrl,
          foundEvents: foundEvents.length > 0 ? foundEvents : undefined,
        });
        llmMetadata = extractLLMMetadata(reply);
        reply = cleanMarkdown(reply);
      } catch (err) {
        llmMetadata = extractLLMMetadata(err as Error);
        throw err; // 重新拋出，讓上層處理
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[Error in handleUserMessage]', {
      error: err,
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
      userId: params.userId,
      userMessage: params.message,
      foundEventsCount: foundEvents.length,
    });
    
    // LLM 失敗時的降級處理
    if (!reply) {
      const opentixSearchUrl = buildOpentixSearchUrl(params.message);
      
      // 檢測特定錯誤類型並提供對應的錯誤訊息
      if (errorMessage === 'LLM_RATE_LIMIT' || errorMessage === 'LINE_API_RATE_LIMIT') {
        // 429 Rate Limit 錯誤
        reply = userLocale === 'zh-TW'
          ? `目前使用人數較多，系統暫時無法處理您的請求。請稍後再試，或直接前往 Opentix 官網搜尋：${opentixSearchUrl}`
          : `The system is currently experiencing high traffic. Please try again later, or visit Opentix website: ${opentixSearchUrl}`;
      } else if (errorMessage === 'LLM_SERVICE_UNAVAILABLE' || errorMessage === 'LINE_API_SERVICE_UNAVAILABLE') {
        // 503 Service Unavailable 錯誤
        reply = userLocale === 'zh-TW'
          ? `服務暫時無法使用，請稍後再試。您也可以直接前往 Opentix 官網搜尋：${opentixSearchUrl}`
          : `Service is temporarily unavailable. Please try again later, or visit Opentix website: ${opentixSearchUrl}`;
      } else if (errorMessage === 'LLM_QUOTA_EXCEEDED') {
        // Quota Exceeded 錯誤
        reply = userLocale === 'zh-TW'
          ? `智能客服暫時無法使用，請直接前往 Opentix 官網搜尋：${opentixSearchUrl}`
          : `AI service is temporarily unavailable. Please visit Opentix website: ${opentixSearchUrl}`;
      } else {
        // 其他錯誤：嘗試獲取 parsedQuery（如果之前沒有獲取）
        let parsedQueryForFallback = parsedQuery;
        if (!parsedQueryForFallback && shouldSearchEvents(params.message)) {
          try {
            parsedQueryForFallback = await parseQuery(params.message);
          } catch (parseErr) {
            console.warn('[Fallback] Failed to parse query:', parseErr);
          }
        }
        
        // 如果是日期查詢，提供專門的降級回覆
        if (parsedQueryForFallback?.queryType === 'date' && foundEvents.length === 0) {
          const dateRange = parsedQueryForFallback.dateRange;
          let dateRangeText = '';
          if (dateRange && dateRange.start && dateRange.end) {
            const startDate = new Date(dateRange.start).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
            const endDate = new Date(dateRange.end).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
            dateRangeText = `${startDate} 到 ${endDate}`;
          } else {
            dateRangeText = params.message;
          }
          
          reply = userLocale === 'zh-TW'
            ? `很抱歉，在您指定的日期範圍（${dateRangeText}）內目前沒有找到相關演出。\n\n建議您可以：\n• 嘗試擴大日期範圍\n• 或前往 Opentix 官網查看其他日期的演出：${opentixSearchUrl}`
            : `Sorry, no events found in the specified date range (${dateRangeText}).\n\nSuggestions:\n• Try expanding the date range\n• Or visit Opentix website to view events on other dates: ${opentixSearchUrl}`;
        } else if (parsedQueryForFallback?.queryType === 'artist' && foundEvents.length === 0) {
          // 藝人查詢沒有結果的降級回覆
          const artistName = parsedQueryForFallback.artists?.[0] || params.message;
          reply = userLocale === 'zh-TW'
            ? `很抱歉，目前沒有找到與「${artistName}」相關的演出資訊。\n\n建議：\n• 確認藝人名稱是否正確\n• 或前往 Opentix 官網搜尋：${opentixSearchUrl}`
            : `Sorry, no events found related to "${artistName}".\n\nSuggestions:\n• Please verify the artist name is correct\n• Or visit Opentix website to search: ${opentixSearchUrl}`;
        } else {
          // 一般降級訊息
          reply = userLocale === 'zh-TW'
            ? `很抱歉，目前無法處理您的查詢。\n\n建議您可以：\n• 重新輸入查詢（如藝人名稱、演出類型、場館名稱）\n• 或前往 Opentix 官網搜尋：${opentixSearchUrl}`
            : `Sorry, I'm unable to process your query at the moment.\n\nSuggestions:\n• Please try again with a different query (e.g., artist name, event type, venue name)\n• Or visit Opentix website to search: ${opentixSearchUrl}`;
        }
      }
    }
  }

  // 如果 reply 有 __metadata，優先使用（備用方案）
  if ((reply as any).__metadata && !llmMetadata.latency) {
    llmMetadata = (reply as any).__metadata;
  }

  const saved = await MessageModel.create({
    conversationId,
    role: 'assistant',
    content: reply,
    metadata: {
      llmProvider: llmMetadata.llmProvider,
      latency: llmMetadata.latency,
      error: llmMetadata.error,
    },
  });

  await ConversationModel.updateOne(
    { _id: conversationId },
    { $set: { lastMessageAt: new Date() }, $inc: { messageCount: 2 } }
  );

  // 檢查回覆內容，判斷是否真的找到了相關演出
  // 如果回覆中包含「沒有找到」、「找不到」等關鍵詞，即使 foundEvents.length > 0，也應該使用引導性 quick reply
  const replyLower = saved.content.toLowerCase();
  // 移除 emoji 和特殊字符，只保留文字進行檢測
  const replyForDetection = replyLower.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/[👋😊😅🙏😊]/g, '').trim();
  // 同時檢測繁體和簡體字
  const hasNoResultKeywords = replyForDetection.includes('沒有找到') || 
                               replyForDetection.includes('没有找到') || 
                               replyForDetection.includes('找不到') || 
                               replyForDetection.includes('沒有找到與') ||
                               replyForDetection.includes('没有找到与') ||
                               (replyForDetection.includes('很抱歉') && (replyForDetection.includes('沒有') || replyForDetection.includes('没有') || replyForDetection.includes('找不到'))) ||
                               replyForDetection.includes('很抱歉,沒有找到') ||
                               replyForDetection.includes('很抱歉，沒有找到') ||
                               replyForDetection.includes('很抱歉,没有找到') ||
                               replyForDetection.includes('很抱歉，没有找到') ||
                               replyForDetection.includes('很抱歉沒有找到') ||
                               replyForDetection.includes('很抱歉没有找到');
  
  console.log('[Quick Reply Detection - Chat Service]', {
    replyPreview: saved.content.substring(0, 80),
    replyForDetection: replyForDetection.substring(0, 100),
    hasNoResultKeywords,
    foundEventsLength: foundEvents.length,
    willUseNoResultSuggestions: hasNoResultKeywords || foundEvents.length === 0,
  });
  
  // 如果回覆明確表示"沒有找到"，清除 session context
  if (hasNoResultKeywords) {
    const { sessionManager } = await import('@/services/session-manager.service');
    await sessionManager.clearSession(params.userId);
    console.log('[Session - Chat Service] Cleared session due to no results');
  }

  // 判斷是否應該附加 Quick Reply
  // 包括：搜尋相關、找到演出、後續問題
  const shouldAddQuickReply =
    shouldSearchEvents(params.message) || foundEvents.length > 0 || isFollowUpQuestion(params.message);

  // 根據搜尋結果和查詢類型選擇不同的 Quick Reply
  let quickReply;
  if (shouldAddQuickReply) {
    // 如果回覆明確表示沒有找到相關演出，使用引導性 quick reply
    if (hasNoResultKeywords || foundEvents.length === 0) {
      quickReply = buildNoResultSearchSuggestions(userLocale);
    } else if (isFollowUpQuestion(params.message)) {
      // 後續問題：提供搜尋結果相關的 Quick Reply（如果之前有搜尋結果）
      if (foundEvents.length === 1) {
        // 單一事件：提供詳細資訊查詢選項
        const eventTitle = foundEvents[0].title;
        const eventUrl = foundEvents[0].opentixUrl || foundEvents[0].url;
        const eventId = foundEvents[0].eventId;
        quickReply = buildSingleEventQuickReply(userLocale, eventTitle, eventUrl, eventId);
      } else if (foundEvents.length > 0) {
        quickReply = buildSearchResultQuickReply(userLocale);
      } else {
        // 沒有找到演出，但這是後續問題：提供搜尋選項
        quickReply = buildNoResultSearchSuggestions(userLocale);
      }
    } else if (foundEvents.length > 0) {
      // 有找到演出：判斷是單一事件還是多個事件
      if (foundEvents.length === 1) {
        // 單一事件：提供詳細資訊查詢選項
        const eventTitle = foundEvents[0].title;
        const eventUrl = foundEvents[0].opentixUrl || foundEvents[0].url;
        const eventId = foundEvents[0].eventId;
        quickReply = buildSingleEventQuickReply(userLocale, eventTitle, eventUrl, eventId);
      } else {
        // 多個事件：判斷是場館搜尋還是藝人搜尋
        const isVenueSearch = /(衛武營|國家音樂廳|國家戲劇院|兩廳院|臺北表演藝術中心|臺中國家歌劇院|苗北|新竹|桃園|高雄)/i.test(params.message);
        
        if (isVenueSearch) {
          // 場館搜尋結果：提供其他場館選項
          const { buildVenueSearchQuickReply } = await import('@/lib/line/templates');
          const venueName = params.message.match(/(衛武營|國家音樂廳|國家戲劇院|兩廳院|臺北表演藝術中心|臺中國家歌劇院|苗北|新竹|桃園|高雄)/i)?.[0];
          quickReply = buildVenueSearchQuickReply(userLocale, venueName);
        } else {
          // 一般搜尋結果：使用標準的搜尋結果 Quick Reply
          quickReply = buildSearchResultQuickReply(userLocale);
        }
      }
    } else {
      // 沒有找到演出：使用熱門搜尋建議 Quick Reply
      quickReply = buildNoResultSearchSuggestions(userLocale);
    }
  }

  return {
    replyText: saved.content,
    quickReply,
  };
}

/**
 * 儲存 FAQ 規則式回覆到資料庫
 */
export async function saveFAQMessage(userId: string, userMessage: string, faqReply: string) {
  await connectMongo();

  let conversation = await ConversationModel.findOne({ userId }).lean();
  if (!conversation) {
    conversation = await ConversationModel.create({ userId });
  }

  const conversationId = (conversation as any)._id;

  // 儲存使用者訊息
  await MessageModel.create({
    conversationId,
    role: 'user',
    content: userMessage,
  });

  // 儲存 FAQ 回覆
  await MessageModel.create({
    conversationId,
    role: 'assistant',
    content: faqReply,
    metadata: {
      messageType: 'faq',
      llmProvider: 'rule-based',
    },
  });

  // 更新對話統計
  await ConversationModel.updateOne(
    { _id: conversationId },
    { $set: { lastMessageAt: new Date() }, $inc: { messageCount: 2 } }
  );
}
