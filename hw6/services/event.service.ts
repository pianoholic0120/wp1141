import { connectMongo } from '@/lib/db/mongodb';
import { EventModel } from '@/models/Event';

export interface SearchEventsResult {
  events: any[];
  total: number;
  query: string;
}

/**
 * 搜尋演出事件
 */
export async function searchEvents(query: string, limit = 5): Promise<SearchEventsResult> {
  await connectMongo();

  if (!query || query.trim().length < 2) {
    return { events: [], total: 0, query };
  }

  const searchTerm = query.trim();

  // 優先使用精確匹配（標題或副標題包含完整查詢字串）
  // 轉義特殊字符，避免正則表達式錯誤
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // 嘗試將長查詢拆分為關鍵詞（處理 title + subtitle 的情況）
  const keywords = searchTerm.split(/[—\-&]+/).map(k => k.trim()).filter(k => k.length > 3);
  
  const exactMatchResults = await EventModel.find({
    $or: [
      { title: { $regex: escapedSearchTerm, $options: 'i' } },
      { subtitle: { $regex: escapedSearchTerm, $options: 'i' } },
      // 如果有多個關鍵詞，嘗試匹配任一關鍵詞
      ...(keywords.length > 1 ? keywords.map(keyword => ({
        $or: [
          { title: { $regex: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
          { subtitle: { $regex: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        ]
      })) : []),
    ],
    // 排除已下架的節目
    $nor: [{ title: { $regex: /已下架|下架/i } }, { description: { $regex: /已下架|下架/i } }],
  })
    .limit(limit)
    .lean();

  // 使用 MongoDB 全文搜尋（排除已下架）
  let textSearchResults: any[] = [];
  try {
    textSearchResults = await EventModel.find(
    {
      $text: { $search: searchTerm },
      // 排除已下架的節目
      $nor: [{ title: { $regex: /已下架|下架/i } }, { description: { $regex: /已下架|下架/i } }],
    },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit * 2) // 多查一些，因為可能有些會被過濾掉
    .lean();
  } catch (error) {
    // 如果全文索引不存在，跳過全文搜尋
    console.warn('[Event Search] Text index not available, skipping text search');
  }

  // 如果精確匹配有結果，優先使用精確匹配
  let results = exactMatchResults.length > 0 ? exactMatchResults : textSearchResults;
  
  // 如果結果不足，使用模糊匹配（包含場館搜尋）
  if (results.length < limit) {
    const fuzzyResults = await EventModel.find({
      $or: [
        { title: { $regex: escapedSearchTerm, $options: 'i' } },
        { subtitle: { $regex: escapedSearchTerm, $options: 'i' } },
        { artists: { $in: [new RegExp(escapedSearchTerm, 'i')] } },
        { venue: { $regex: escapedSearchTerm, $options: 'i' } }, // 加入場館搜尋
        { description: { $regex: escapedSearchTerm, $options: 'i' } },
        { category: { $regex: escapedSearchTerm, $options: 'i' } },
      ],
      // 排除已下架的節目
      $nor: [{ title: { $regex: /已下架|下架/i } }, { description: { $regex: /已下架|下架/i } }],
    })
      .limit((limit - results.length) * 2)
      .lean();

    // 合併結果，避免重複，優先保留精確匹配
    const existingIds = new Set(results.map((e: any) => e.eventId || e._id?.toString()));
    const uniqueFuzzy = fuzzyResults.filter((e: any) => !existingIds.has(e.eventId || e._id?.toString()));
    results = [...results, ...uniqueFuzzy];
  }

  // 添加相關性評分並排序（改進版：更精確的匹配）
  results = results.map((event: any) => {
    let relevanceScore = 0;
    const lowerSearchTerm = searchTerm.toLowerCase();
    const lowerTitle = (event.title || '').toLowerCase();
    const lowerSubtitle = (event.subtitle || '').toLowerCase();
    
    // 提取搜尋詞中的關鍵字（去除常見詞）
    // 先按分隔符分割，然後進一步分割數字和文字
    const searchKeywords = lowerSearchTerm
      .split(/[\s\-－—&＆]+/)
      .flatMap(part => {
        // 對每個部分，進一步分割數字和文字（如「黎卓宇2026」→「黎卓宇」+「2026」）
        const matches = part.match(/[\u4e00-\u9fa5]+|[a-z]+|\d+/gi) || [];
        return matches;
      })
      .filter(w => {
        // 過濾條件：長度 >= 2 且不是常見詞或組合詞
        const commonWords = ['獨奏會', '音樂會', '演唱會', '演出', '表演', '鋼琴', '小提琴', '大提琴', 
                            '音樂', '會', '鋼琴獨奏會', '小提琴獨奏會', '音樂會', 
                            'concert', 'recital', 'show', 'piano', 'violin', 'music'];
        // 也過濾掉包含通用詞的組合（如「鋼琴獨奏會」）
        const hasCommonWord = commonWords.some(common => w.includes(common) || common.includes(w));
        return w.length >= 2 && !hasCommonWord;
      });
    
    // 計算標題中包含的搜尋關鍵字數量
    const titleKeywordMatches = searchKeywords.filter(keyword => lowerTitle.includes(keyword)).length;
    const subtitleKeywordMatches = searchKeywords.filter(keyword => lowerSubtitle.includes(keyword)).length;
    
    // 標題完全匹配（最高分）
    if (lowerTitle === lowerSearchTerm || lowerSubtitle === lowerSearchTerm) {
      relevanceScore += 1000;
    }
    // 標題包含完整搜尋詞（高分）
    else if (lowerTitle.includes(lowerSearchTerm)) {
      relevanceScore += 500;
    }
    // 副標題包含完整搜尋詞（中高分）
    else if (lowerSubtitle.includes(lowerSearchTerm)) {
      relevanceScore += 300;
    }
    // 標題包含多個搜尋關鍵字（按匹配數量加分）
    else if (titleKeywordMatches > 0) {
      relevanceScore += 200 + (titleKeywordMatches * 50);
    }
    // 副標題包含多個搜尋關鍵字
    else if (subtitleKeywordMatches > 0) {
      relevanceScore += 150 + (subtitleKeywordMatches * 30);
    }
    // 藝人匹配（中分）
    else if (Array.isArray(event.artists) && event.artists.some((a: string) => a.toLowerCase().includes(lowerSearchTerm))) {
      relevanceScore += 100;
    }
    // 場館匹配（中低分）
    else if ((event.venue || '').toLowerCase().includes(lowerSearchTerm)) {
      relevanceScore += 50;
    }
    // 描述匹配（最低分）
    else if ((event.description || '').toLowerCase().includes(lowerSearchTerm) || 
             (event.discountInfo || '').toLowerCase().includes(lowerSearchTerm)) {
      relevanceScore += 10;
    }
    
    return { ...event, relevanceScore };
  }).sort((a: any, b: any) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  console.log('[Event Search] Results with relevance scores:', results.slice(0, 3).map((e: any) => ({
    title: e.title,
    score: e.relevanceScore
  })));

  // 再次過濾已下架節目（確保標題和描述都沒有「已下架」）
  results = results
    .filter((event: any) => {
      const title = (event.title || '').toLowerCase();
      const desc = (event.description || '').toLowerCase();
      return (
        !title.includes('已下架') &&
        !title.includes('下架') &&
        !desc.includes('已下架') &&
        !desc.includes('下架')
      );
    });
  
  // 對結果進行排序：優先顯示標題包含完整查詢字串的結果
  const searchTermLower = searchTerm.toLowerCase();
  results.sort((a: any, b: any) => {
    const aTitle = (a.title || '').toLowerCase();
    const bTitle = (b.title || '').toLowerCase();
    const aContains = aTitle.includes(searchTermLower);
    const bContains = bTitle.includes(searchTermLower);
    
    // 標題包含完整查詢字串的優先
    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;
    
    // 如果都包含或都不包含，按標題長度排序（較短的優先，因為通常更精確）
    return aTitle.length - bTitle.length;
  });
  
  results = results.slice(0, limit); // 只取前 limit 個

  // 格式化結果，清理冗長內容
  const { formatEventForDisplay } = await import('@/lib/utils/event-formatter');
  const formattedEvents = results.map((event: any) => {
    // 確保 dates 欄位正確傳遞（從資料庫查詢結果中提取）
    let dates = event.dates || [];
    // 如果 dates 是 Mongoose 文檔，轉換為普通對象
    if (dates && typeof dates.map === 'function') {
      dates = dates.map((d: any) => {
        if (d && typeof d.toObject === 'function') {
          return d.toObject();
        }
        return d;
      });
    }
    
    return formatEventForDisplay({
      eventId: event.eventId,
      title: event.title,
      subtitle: event.subtitle,
      category: event.category,
      venue: event.venue,
      artists: event.artists || [],
      imageUrl: event.imageUrl,
      opentixUrl: event.opentixUrl,
      description: event.description,
      dates: dates, // 確保 dates 正確傳遞
    });
  });

  return {
    events: formattedEvents,
    total: formattedEvents.length,
    query: searchTerm,
  };
}

/**
 * 根據藝人名稱搜尋（更靈活的匹配）
 */
export async function searchEventsByArtist(
  artistName: string,
  limit = 5
): Promise<SearchEventsResult> {
  await connectMongo();

  // 正規化搜尋詞：去除多餘空格，轉小寫用於匹配
  const normalized = artistName.trim().toLowerCase();
  const words = normalized.split(/\s+/).filter((w) => w.length >= 2);
  
  // 建立多種搜尋模式
  // 1. 完整匹配（允許空格變為任意字符）
  const fullMatchRegex = new RegExp(normalized.replace(/\s+/g, '.*'), 'i');
  // 2. 單詞匹配（每個單詞都要出現，使用單詞邊界確保完整單詞匹配）
  // 避免 "Lang Lang" 匹配到 "Klangbrücke"
  const wordMatchRegex = words.length > 0 ? new RegExp(
    words.map(w => `\\b${w}\\b`).join('|'), 'i'
  ) : null;
  
  console.log('[Event Search] Artist search:', {
    artistName,
    normalized,
    words,
    fullMatchRegex: fullMatchRegex.toString(),
    wordMatchRegex: wordMatchRegex?.toString(),
    searchConditionsCount: 0,  // 将在后面更新
  });

  // 多種搜尋策略（排除已下架）
  // 優先使用精確匹配，避免返回不相關的結果
  const searchConditions: any[] = [];
  
  // 1. 在 artists 陣列中搜尋（最高優先級，完整匹配）
  // 對於多個單詞的藝人名稱，優先使用完整匹配
  if (words.length > 1) {
    // 多個單詞：要求完整匹配或所有單詞都出現
    // 使用更精確的正則：確保所有單詞都出現
    const strictRegex = new RegExp(
      words.map(w => `(?=.*${w})`).join(''),
      'i'
    );
    searchConditions.push({ artists: { $regex: strictRegex } });
    // 也嘗試完整匹配
    searchConditions.push({ artists: { $regex: fullMatchRegex } });
  } else {
    // 單個單詞：直接匹配
    searchConditions.push({ artists: { $regex: fullMatchRegex } });
  }
  
  // 2. 在標題中搜尋（次優先級）
  if (words.length > 1) {
    const strictRegex = new RegExp(
      words.map(w => `(?=.*${w})`).join(''),
      'i'
    );
    searchConditions.push({ title: { $regex: strictRegex } });
  }
  searchConditions.push({ title: { $regex: fullMatchRegex } });
  
  // 3. 在 subtitle 中搜尋
  if (words.length > 1) {
    const strictRegex = new RegExp(
      words.map(w => `(?=.*${w})`).join(''),
      'i'
    );
    searchConditions.push({ subtitle: { $regex: strictRegex } });
  }
  searchConditions.push({ subtitle: { $regex: fullMatchRegex } });
  
  // 4. 在描述中搜尋（最低優先級，包括藝人名稱搜尋）
  // Eric Lu 等藝人可能只出現在描述中
  searchConditions.push({ description: { $regex: fullMatchRegex } });

  console.log('[Event Search] Total search conditions:', searchConditions.length, 'for artist:', artistName);

  const results = await EventModel.find({
    $or: searchConditions,
    // 排除已下架的節目
    $nor: [{ title: { $regex: /已下架|下架/i } }, { description: { $regex: /已下架|下架/i } }],
  })
    .limit(limit * 3) // 多查一些，因為可能有些會被過濾掉
    .sort({ createdAt: -1 })
    .lean();
  
  console.log('[Event Search] MongoDB query for artist completed');
  console.log('[Event Search] Initial MongoDB results:', results.length);
  if (results.length === 0) {
    console.log('[Event Search] ⚠️ No results found for artist:', artistName);
    console.log('[Event Search] Search regex was:', fullMatchRegex.toString());
  } else {
    console.log('[Event Search] ✅ Found results, sample titles:', results.slice(0, 3).map((e: any) => e.title));
  }

  // 不再使用寬鬆的單詞匹配，因為這會導致返回不相關的結果
  // 如果精確匹配沒有結果，應該返回空結果而不是返回不相關的演出
  let finalResults = results;

  // 最終過濾：已下架 + 相關性檢查
  const { isEventRelevantToArtist } = await import('@/lib/utils/event-formatter');
  
  console.log('[Event Search] Before relevance filtering:', finalResults.length);
  
  finalResults = finalResults
    .filter((event: any) => {
      // 過濾已下架
      const title = (event.title || '').toLowerCase();
      const desc = (event.description || '').toLowerCase();
      if (title.includes('已下架') || title.includes('下架') ||
          desc.includes('已下架') || desc.includes('下架')) {
        return false;
      }
      
      // 相關性檢查：確保事件真的與藝人相關
      const isRelevant = isEventRelevantToArtist(event, artistName);
      if (!isRelevant) {
        console.log('[Event Search] Filtered out event (not relevant):', {
          title: event.title,
          artists: event.artists,
          reason: 'isEventRelevantToArtist returned false',
        });
      }
      return isRelevant;
    })
    .slice(0, limit); // 只取前 limit 個
  
  console.log('[Event Search] After relevance filtering:', finalResults.length);

  // 格式化事件資料，清理冗長內容
  const { formatEventForDisplay } = await import('@/lib/utils/event-formatter');
  const formattedEvents = finalResults.map((event: any) => {
    const formatted = formatEventForDisplay({
      eventId: event.eventId,
      title: event.title,
      subtitle: event.subtitle,
      category: event.category,
      venue: event.venue,
      artists: event.artists || [],
      imageUrl: event.imageUrl,
      opentixUrl: event.opentixUrl,
      description: event.description,
      dates: event.dates || [],
    });
    return formatted;
  });

  return {
    events: formattedEvents,
    total: formattedEvents.length,
    query: artistName,
  };
}

/**
 * 場館名稱標準化映射
 * 處理同一場館的不同寫法
 */
const VENUE_NAME_MAPPING: Record<string, string[]> = {
  '國家音樂廳': ['國家音樂廳', '國家音樂廳一樓大廳', '臺北國家音樂廳', '台北國家音樂廳'],
  // 注意：不包含「國家兩廳院演奏廳」，因為這是不同的場館
  '國家戲劇院': ['國家戲劇院', '臺北國家戲劇院', '台北國家戲劇院'],
  '兩廳院': ['兩廳院', '國家兩廳院', '國家音樂廳', '國家戲劇院', '國家兩廳院演奏廳'],
  '衛武營': ['衛武營', '衛武營國家藝術文化中心', '衛武營國家音樂廳', '衛武營音樂廳'],
  '臺北表演藝術中心': ['臺北表演藝術中心', '台北表演藝術中心', 'TPAC'],
  '臺中國家歌劇院': ['臺中國家歌劇院', '台中國家歌劇院', 'NTT', '臺中國家歌劇院大劇院', '臺中國家歌劇院小劇場', '台中國家歌劇院大劇院', '台中國家歌劇院小劇場'],
};

/**
 * 取得場館的所有可能名稱
 */
function getVenueVariants(venueName: string): string[] {
  // 先檢查映射表
  for (const [key, variants] of Object.entries(VENUE_NAME_MAPPING)) {
    if (variants.includes(venueName) || key === venueName) {
      return variants;
    }
  }
  // 如果沒有映射，返回原始名稱
  return [venueName];
}

/**
 * 檢查場館名稱是否匹配（精確或部分匹配）
 */
function isVenueMatch(eventVenue: string, searchVenue: string): boolean {
  if (!eventVenue) return false;
  
  const eventVenueLower = eventVenue.toLowerCase().trim();
  const searchVenueLower = searchVenue.toLowerCase().trim();
  
  // 精確匹配
  if (eventVenueLower === searchVenueLower) return true;
  
  // 取得場館的所有可能名稱
  const venueVariants = getVenueVariants(searchVenue);
  
  // 對於已知場館（在映射表中的），使用嚴格匹配
  const isKnownVenue = VENUE_NAME_MAPPING[searchVenue] !== undefined;
  
  for (const variant of venueVariants) {
    const variantLower = variant.toLowerCase();
    
    // 精確匹配
    if (eventVenueLower === variantLower) return true;
    
    // 對於已知場館，必須包含完整的場館名稱（避免部分匹配）
    // 例如：「國家音樂廳」應該匹配「國家音樂廳一樓大廳」，但不應該匹配「高雄市音樂館」
    if (isKnownVenue) {
      // 必須包含完整的場館名稱作為子字串
      if (eventVenueLower.includes(variantLower)) {
        // 額外檢查：確保不是部分匹配
        // 例如：「國家音樂廳」不應該匹配「音樂館」或「音樂廳」（如果沒有「國家」）
        // 但可以匹配「國家音樂廳一樓大廳」
        
        // 對於「國家音樂廳」，確保不會匹配到其他包含「音樂廳」但沒有「國家」的場館
        if (variantLower.includes('國家音樂廳')) {
          // 必須包含「國家音樂廳」完整字串
          if (!eventVenueLower.includes('國家音樂廳')) {
            console.log(`[Venue Match] Rejecting "${eventVenue}" - does not contain "國家音樂廳"`);
            return false;
          }
          
          // 嚴格排除：如果場館名稱包含以下關鍵字，直接排除
          // 這些關鍵字不應該出現在「國家音樂廳」相關的場館名稱中
          const strictExclusions = [
            '陽明交通大學', '陽明校區', '陽明', 
            '新莊文化藝術中心', '新莊', 
            '高雄市音樂館', '高雄市',
            '臺中國家歌劇院', '台中國家歌劇院', '國家歌劇院', '歌劇院', 'ntt',
            '衛武營國家藝術文化中心', '衛武營',
            '誠品表演廳', '誠品',
            '國家兩廳院演奏廳', '兩廳院演奏廳', '演奏廳' // 這是不同的場館
          ];
          
          for (const excluded of strictExclusions) {
            const excludedLower = excluded.toLowerCase();
            // 如果場館名稱包含排除關鍵字，直接返回 false
            // 例如：「陽明交通大學陽明校區表演廳」包含「陽明」，應該被排除
            // 「國家兩廳院演奏廳」包含「演奏廳」，應該被排除
            // 「臺中國家歌劇院大劇院」包含「臺中國家歌劇院」，應該被排除
            // 「衛武營國家藝術文化中心音樂廳」包含「衛武營」，應該被排除
            if (eventVenueLower.includes(excludedLower)) {
              console.log(`[Venue Match] Rejecting "${eventVenue}" because it contains "${excluded}"`);
              return false;
            }
          }
          
          // 額外檢查：如果只包含「表演廳」或「演藝廳」但沒有「國家音樂廳」，排除
          if ((eventVenueLower.includes('表演廳') || eventVenueLower.includes('演藝廳')) &&
              !eventVenueLower.includes('國家音樂廳')) {
            console.log(`[Venue Match] Rejecting "${eventVenue}" - contains 表演廳/演藝廳 but not 國家音樂廳`);
            return false;
          }
          
          // 如果通過所有檢查，返回 true
          console.log(`[Venue Match] Accepting "${eventVenue}" - matches 國家音樂廳`);
          return true;
        }
        
        // 對於「國家戲劇院」，確保不會匹配到其他包含「戲劇院」但沒有「國家」的場館
        if (variantLower.includes('國家戲劇院')) {
          if (!eventVenueLower.includes('國家戲劇院')) {
            return false;
          }
        }
        
        // 對於「臺中國家歌劇院」，確保只匹配包含「臺中國家歌劇院」或「台中國家歌劇院」的場館
        if (variantLower.includes('臺中國家歌劇院') || variantLower.includes('台中國家歌劇院') || variantLower.includes('ntt')) {
          // 必須包含「臺中國家歌劇院」或「台中國家歌劇院」完整字串
          if (!eventVenueLower.includes('臺中國家歌劇院') && !eventVenueLower.includes('台中國家歌劇院')) {
            return false;
          }
          
          // 嚴格排除：如果場館名稱包含以下關鍵字，直接排除
          // 這些關鍵字不應該出現在「臺中國家歌劇院」相關的場館名稱中
          const strictExclusions = [
            '國家音樂廳', '國家戲劇院', 
            '國家兩廳院演奏廳', '兩廳院演奏廳', '演奏廳', '兩廳院', '國家兩廳院',
            '誠品表演廳', '誠品',
            '衛武營國家藝術文化中心', '衛武營',
            '陽明交通大學', '陽明', 
            '新莊文化藝術中心', '新莊', 
            '高雄市音樂館', '高雄市'
          ];
          
          for (const excluded of strictExclusions) {
            const excludedLower = excluded.toLowerCase();
            // 如果場館名稱包含排除關鍵字，直接返回 false
            // 例如：「國家兩廳院演奏廳」包含「演奏廳」，應該被排除
            // 「誠品表演廳」包含「誠品」，應該被排除
            if (eventVenueLower.includes(excludedLower)) {
              return false;
            }
          }
          
          // 如果通過所有檢查，返回 true
          return true;
        }
        
        // 對於「兩廳院」，可以匹配「國家音樂廳」或「國家戲劇院」
        if (variantLower === '兩廳院' || variantLower.includes('兩廳院')) {
          if (eventVenueLower.includes('國家音樂廳') || 
              eventVenueLower.includes('國家戲劇院') ||
              eventVenueLower.includes('兩廳院')) {
            return true;
          }
          return false;
        }
        
        return true;
      }
    } else {
      // 未知場館：使用寬鬆匹配
      if (eventVenueLower.includes(variantLower) || variantLower.includes(eventVenueLower)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 根據場館搜尋演出（精確匹配）
 */
export async function searchEventsByVenue(
  venueName: string,
  limit = 5
): Promise<SearchEventsResult> {
  await connectMongo();

  // 取得場館的所有可能名稱
  const venueVariants = getVenueVariants(venueName);
  
  // 建立精確匹配的正則表達式
  // 對於已知場館，使用更嚴格的匹配（必須包含完整場館名稱）
  const venuePatterns = venueVariants.map(v => {
    // 轉義特殊字符
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped;
  });
  
  // 對於已知場館（在映射表中的），使用更嚴格的查詢
  const isKnownVenue = VENUE_NAME_MAPPING[venueName] !== undefined;
  
  let venueQuery: any;
  
  if (isKnownVenue) {
    // 已知場館：必須包含完整的場館名稱（更嚴格）
    // 對於「國家音樂廳」，必須包含「國家音樂廳」完整字串，且排除其他場館
    if (venueName === '國家音樂廳') {
      // 使用更精確的查詢：必須包含「國家音樂廳」，且明確排除其他場館
      // 使用 $and 和 $not 來精確匹配
      venueQuery = {
        $and: [
          // 必須包含「國家音樂廳」
          { venue: { $regex: /國家音樂廳/i } },
          // 明確排除其他場館
          { venue: { $not: /國家兩廳院演奏廳/i } },
          { venue: { $not: /兩廳院演奏廳/i } },
          { venue: { $not: /臺中國家歌劇院/i } },
          { venue: { $not: /台中國家歌劇院/i } },
          { venue: { $not: /衛武營/i } },
          { venue: { $not: /陽明/i } },
          { venue: { $not: /新莊/i } },
          { venue: { $not: /高雄市音樂館/i } },
          { venue: { $not: /誠品/i } },
        ],
        // 排除已下架的節目
        $nor: [
          { title: { $regex: /已下架|下架/i } },
          { description: { $regex: /已下架|下架/i } },
        ],
      };
    } else if (venueName === '臺中國家歌劇院' || venueName === '台中國家歌劇院') {
      // 對於「臺中國家歌劇院」，必須包含「臺中國家歌劇院」或「台中國家歌劇院」，且明確排除其他場館
      venueQuery = {
        $and: [
          { 
            $or: [
              { venue: { $regex: /臺中國家歌劇院/i } },
              { venue: { $regex: /台中國家歌劇院/i } }
            ]
          },
          // 明確排除其他場館（使用 $not 確保這些場館不會被匹配）
          { venue: { $not: /國家音樂廳/i } },
          { venue: { $not: /國家戲劇院/i } },
          { venue: { $not: /國家兩廳院演奏廳/i } },
          { venue: { $not: /兩廳院演奏廳/i } },
          { venue: { $not: /兩廳院/i } },
          { venue: { $not: /誠品表演廳/i } },
          { venue: { $not: /誠品/i } },
          { venue: { $not: /衛武營/i } },
          { venue: { $not: /陽明/i } },
          { venue: { $not: /新莊/i } },
          { venue: { $not: /高雄市音樂館/i } },
        ],
        // 排除已下架的節目
        $nor: [
          { title: { $regex: /已下架|下架/i } },
          { description: { $regex: /已下架|下架/i } },
        ],
      };
    } else {
      // 其他已知場館：使用包含匹配
      venueQuery = {
        $or: venuePatterns.map(pattern => ({
          venue: { $regex: new RegExp(pattern, 'i') }
        })),
        // 排除已下架的節目
        $nor: [{ title: { $regex: /已下架|下架/i } }, { description: { $regex: /已下架|下架/i } }],
      };
    }
  } else {
    // 未知場館：使用寬鬆匹配
    venueQuery = {
      $or: venuePatterns.map(pattern => ({
        venue: { $regex: new RegExp(pattern, 'i') }
      })),
      // 排除已下架的節目
      $nor: [{ title: { $regex: /已下架|下架/i } }, { description: { $regex: /已下架|下架/i } }],
    };
  }

  console.log(`[Venue Search] Query for "${venueName}":`, JSON.stringify(venueQuery, null, 2));
  
  const results = await EventModel.find(venueQuery)
    .limit(limit * 3) // 多查一些，因為後面會過濾
    .sort({ createdAt: -1 })
    .lean();

  console.log(`[Venue Search] MongoDB returned ${results.length} events before filtering`);
  if (results.length > 0) {
    const sampleVenues = results.slice(0, 10).map((e: any) => e.venue);
    console.log(`[Venue Search] Sample venues from MongoDB:`, sampleVenues);
    
    // 特別檢查：如果有不相關的場館，記錄警告
    if (venueName === '國家音樂廳') {
      const irrelevantVenues = sampleVenues.filter((v: string) => 
        v && !v.includes('國家音樂廳') && 
        (v.includes('臺中國家歌劇院') || v.includes('台中國家歌劇院') || v.includes('衛武營'))
      );
      if (irrelevantVenues.length > 0) {
        console.warn(`[Venue Search] WARNING: MongoDB returned irrelevant venues for "國家音樂廳":`, irrelevantVenues);
      }
    }
  }

  // 精確過濾：確保場館欄位完全匹配
  const filtered = results
    .filter((event: any) => {
      // 先過濾已下架
      const title = (event.title || '').toLowerCase();
      const desc = (event.description || '').toLowerCase();
      if (title.includes('已下架') || title.includes('下架') || 
          desc.includes('已下架') || desc.includes('下架')) {
        return false;
      }
      
      // 確保場館欄位匹配（這是關鍵過濾）
      const eventVenue = (event.venue || '').trim();
      if (!eventVenue) {
        return false; // 沒有場館資訊的演出不應該出現
      }
      
      const isMatch = isVenueMatch(eventVenue, venueName);
      
      // Debug logging for venue matching
      if (venueName === '國家音樂廳' || venueName === '臺中國家歌劇院' || venueName === '台中國家歌劇院') {
        if (isMatch) {
          console.log(`[Venue Filter] Accepted: "${eventVenue}" matches "${venueName}"`);
        } else {
          console.log(`[Venue Filter] Rejected: "${eventVenue}" does not match "${venueName}"`);
        }
      }
      
      return isMatch;
    })
    .slice(0, limit);
  
  console.log(`[Venue Search] After filtering: ${filtered.length} events match venue "${venueName}"`);
  
  // 特別檢查：如果過濾後仍有不相關的場館，記錄警告
  if (venueName === '國家音樂廳' && filtered.length > 0) {
    const irrelevantVenues = filtered
      .map((e: any) => e.venue)
      .filter((v: string) => 
        v && !v.includes('國家音樂廳') && 
        (v.includes('臺中國家歌劇院') || v.includes('台中國家歌劇院') || v.includes('衛武營'))
      );
    if (irrelevantVenues.length > 0) {
      console.error(`[Venue Search] ERROR: Filtered results still contain irrelevant venues:`, irrelevantVenues);
    }
  }

  const formattedEvents = filtered.map((event: any) => ({
    eventId: event.eventId,
    title: event.title,
    subtitle: event.subtitle,
    category: event.category,
    venue: event.venue,
    artists: event.artists || [],
    imageUrl: event.imageUrl,
    opentixUrl: event.opentixUrl,
    description:
      event.description?.substring(0, 200) + (event.description?.length > 200 ? '...' : ''),
    dates: event.dates || [],
  }));

  return {
    events: formattedEvents,
    total: formattedEvents.length,
    query: venueName,
  };
}

/**
 * 根據演出類型搜尋
 */
export async function searchEventsByCategory(
  category: string,
  limit = 5
): Promise<SearchEventsResult> {
  await connectMongo();

  const searchRegex = new RegExp(category.replace(/\s+/g, '.*'), 'i');

  const results = await EventModel.find({
    $or: [
      { category: { $regex: searchRegex } },
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
    ],
    // 排除已下架的節目
    $nor: [{ title: { $regex: /已下架|下架/i } }, { description: { $regex: /已下架|下架/i } }],
  })
    .limit(limit * 2)
    .sort({ createdAt: -1 })
    .lean();

  const filtered = results
    .filter((event: any) => {
      const title = (event.title || '').toLowerCase();
      const desc = (event.description || '').toLowerCase();
      return (
        !title.includes('已下架') &&
        !title.includes('下架') &&
        !desc.includes('已下架') &&
        !desc.includes('下架')
      );
    })
    .slice(0, limit);

  const formattedEvents = filtered.map((event: any) => ({
    eventId: event.eventId,
    title: event.title,
    subtitle: event.subtitle,
    category: event.category,
    venue: event.venue,
    artists: event.artists || [],
    imageUrl: event.imageUrl,
    opentixUrl: event.opentixUrl,
    description:
      event.description?.substring(0, 200) + (event.description?.length > 200 ? '...' : ''),
    dates: event.dates || [],
  }));

  return {
    events: formattedEvents,
    total: formattedEvents.length,
    query: category,
  };
}

/**
 * 根據時間範圍搜尋
 */
export async function searchEventsByDateRange(
  startDate: Date,
  endDate: Date,
  limit = 5
): Promise<SearchEventsResult> {
  await connectMongo();

  // 正確的日期範圍查詢邏輯：
  // Event model 只有 dates 陣列，沒有 startDate/endDate
  // 查詢任何一個 dates.date 在查詢範圍內的演出
  const results = await EventModel.find({
    $and: [
      {
        // 演出的任何一個 dates.date 在查詢範圍內
        'dates.date': {
          $gte: startDate,
          $lte: endDate,
        },
      },
      // 排除已下架的節目
      {
        $nor: [
          { title: { $regex: /已下架|下架/i } },
          { description: { $regex: /已下架|下架/i } },
        ],
      },
    ],
  })
    .limit(limit * 2)
    .lean();
  
  // 計算每個演出的最早和最晚日期，用於排序
  const eventsWithDateRange = results.map((event: any) => {
    if (event.dates && event.dates.length > 0) {
      const dates = event.dates
        .map((d: any) => {
          if (d.date) return new Date(d.date);
          return null;
        })
        .filter((d: any) => d !== null)
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());
      
      if (dates.length > 0) {
        return {
          ...event,
          _earliestDate: dates[0],
        };
      }
    }
    return {
      ...event,
      _earliestDate: new Date(0), // 沒有日期時排到最後
    };
  });
  
  // 按最早日期排序
  eventsWithDateRange.sort((a: any, b: any) => {
    return a._earliestDate.getTime() - b._earliestDate.getTime();
  });
  
  const sortedResults = eventsWithDateRange.map(({ _earliestDate, ...event }) => event);

  console.log(`[Date Search] Query: ${startDate.toISOString()} to ${endDate.toISOString()}, Found: ${sortedResults.length} events`);

  const filtered = sortedResults
    .filter((event: any) => {
      const title = (event.title || '').toLowerCase();
      const desc = (event.description || '').toLowerCase();
      return (
        !title.includes('已下架') &&
        !title.includes('下架') &&
        !desc.includes('已下架') &&
        !desc.includes('下架')
      );
    })
    .slice(0, limit);

  const formattedEvents = filtered.map((event: any) => ({
    eventId: event.eventId,
    title: event.title,
    subtitle: event.subtitle,
    category: event.category,
    venue: event.venue,
    artists: event.artists || [],
    imageUrl: event.imageUrl,
    opentixUrl: event.opentixUrl,
    description:
      event.description?.substring(0, 200) + (event.description?.length > 200 ? '...' : ''),
    dates: event.dates || [],
  }));

  return {
    events: formattedEvents,
    total: formattedEvents.length,
    query: `${startDate.toISOString()} to ${endDate.toISOString()}`,
  };
}

/**
 * 複合查詢（多條件）
 */
export async function searchEventsAdvanced(params: {
  artists?: string[];
  venues?: string[];
  categories?: string[];
  dateRange?: { start?: Date; end?: Date };
  keywords?: string[];
  limit?: number;
}): Promise<SearchEventsResult> {
  await connectMongo();

  const limit = params.limit || 5;
  const query: any = {
    // 排除已下架的節目
    $nor: [{ title: { $regex: /已下架|下架/i } }, { description: { $regex: /已下架|下架/i } }],
  };

  const orConditions: any[] = [];

  // 藝人條件
  if (params.artists && params.artists.length > 0) {
    const artistRegex = new RegExp(params.artists.join('|'), 'i');
    orConditions.push(
      { artists: { $in: [artistRegex] } },
      { title: { $regex: artistRegex } },
      { description: { $regex: artistRegex } }
    );
  }

  // 場館條件
  if (params.venues && params.venues.length > 0) {
    const venueRegex = new RegExp(params.venues.join('|'), 'i');
    orConditions.push({ venue: { $regex: venueRegex } });
  }

  // 類型條件
  if (params.categories && params.categories.length > 0) {
    const categoryRegex = new RegExp(params.categories.join('|'), 'i');
    orConditions.push(
      { category: { $regex: categoryRegex } },
      { title: { $regex: categoryRegex } },
      { description: { $regex: categoryRegex } }
    );
  }

  // 關鍵字條件
  if (params.keywords && params.keywords.length > 0) {
    const keywordRegex = new RegExp(params.keywords.join('|'), 'i');
    orConditions.push(
      { title: { $regex: keywordRegex } },
      { description: { $regex: keywordRegex } }
    );
  }

  if (orConditions.length > 0) {
    query.$or = orConditions;
  }

  // 時間範圍條件
  if (params.dateRange) {
    const dateConditions: any[] = [];
    if (params.dateRange.start) {
      dateConditions.push({ startDate: { $gte: params.dateRange.start } });
      dateConditions.push({ endDate: { $gte: params.dateRange.start } });
      dateConditions.push({ 'dates.date': { $gte: params.dateRange.start } });
    }
    if (params.dateRange.end) {
      dateConditions.push({ startDate: { $lte: params.dateRange.end } });
      dateConditions.push({ endDate: { $lte: params.dateRange.end } });
      dateConditions.push({ 'dates.date': { $lte: params.dateRange.end } });
    }
    if (dateConditions.length > 0) {
      query.$and = query.$and || [];
      query.$and.push({ $or: dateConditions });
    }
  }

  const results = await EventModel.find(query)
    .limit(limit * 2)
    .sort({ createdAt: -1 })
    .lean();

  const filtered = results
    .filter((event: any) => {
      const title = (event.title || '').toLowerCase();
      const desc = (event.description || '').toLowerCase();
      return (
        !title.includes('已下架') &&
        !title.includes('下架') &&
        !desc.includes('已下架') &&
        !desc.includes('下架')
      );
    })
    .slice(0, limit);

  const formattedEvents = filtered.map((event: any) => ({
    eventId: event.eventId,
    title: event.title,
    subtitle: event.subtitle,
    category: event.category,
    venue: event.venue,
    artists: event.artists || [],
    imageUrl: event.imageUrl,
    opentixUrl: event.opentixUrl,
    description:
      event.description?.substring(0, 200) + (event.description?.length > 200 ? '...' : ''),
    dates: event.dates || [],
  }));

  return {
    events: formattedEvents,
    total: formattedEvents.length,
    query: JSON.stringify(params),
  };
}

/**
 * 取得熱門演出（過濾已下架節目）
 */
export async function getPopularEvents(limit = 5): Promise<any[]> {
  try {
    await connectMongo();
  } catch (error) {
    // 如果連接失敗，返回空陣列（讓調用者處理降級）
    console.warn('MongoDB connection failed in getPopularEvents, returning empty array');
    return [];
  }

  try {
    // 查詢即將到來的演出，排除已下架的
    const results = await EventModel.find({
      status: 'upcoming',
      // 排除標題或描述中包含「已下架」的節目
      $nor: [{ title: { $regex: /已下架|下架/i } }, { description: { $regex: /已下架|下架/i } }],
    })
      .limit(limit * 2) // 多查一些，因為可能有些會被過濾掉
      .sort({ createdAt: -1 })
      .lean();

    // 再次過濾（確保標題和描述都沒有「已下架」）
    const filtered = results
      .filter((event: any) => {
        const title = (event.title || '').toLowerCase();
        const desc = (event.description || '').toLowerCase();
        return (
          !title.includes('已下架') &&
          !title.includes('下架') &&
          !desc.includes('已下架') &&
          !desc.includes('下架')
        );
      })
      .slice(0, limit); // 只取前 limit 個

    return filtered.map((event: any) => ({
      eventId: event.eventId,
      title: event.title,
      subtitle: event.subtitle,
      category: event.category,
      venue: event.venue,
      artists: event.artists || [],
      imageUrl: event.imageUrl,
      opentixUrl: event.opentixUrl,
      description:
        event.description?.substring(0, 150) + (event.description?.length > 150 ? '...' : ''),
    }));
  } catch (error) {
    // 如果查詢失敗，返回空陣列（讓調用者處理降級）
    console.warn('MongoDB query failed in getPopularEvents, returning empty array:', error);
    return [];
  }
}
