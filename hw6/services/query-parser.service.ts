/**
 * 查詢解析服務
 * 從使用者輸入中提取結構化資訊（藝人、場館、時間、類型等）
 */

export interface ParsedQuery {
  artists?: string[]; // 藝人名稱列表
  artistInfo?: {
    normalizedName: string; // 標準化名稱
    profession: string[]; // 職業（如：鋼琴家、小提琴家）
    aliases: string[]; // 別名
  };
  venues?: string[]; // 場館名稱列表
  categories?: string[]; // 演出類型（音樂、戲劇、舞蹈等）
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  keywords?: string[]; // 其他關鍵字
  queryType: 'artist' | 'venue' | 'category' | 'date' | 'general' | 'mixed';
  originalQuery: string;
}

/**
 * 場館名稱映射（英文 -> 中文標準名稱）
 */
const VENUE_NAME_MAPPING: Record<string, string> = {
  // 國家兩廳院
  'national concert hall': '國家音樂廳',
  'concert hall': '國家音樂廳',
  'national theater': '國家戲劇院',
  'national theatre': '國家戲劇院',
  'theater': '國家戲劇院',
  'theatre': '國家戲劇院',
  'ntch': '兩廳院',
  'national performing arts center': '兩廳院',
  
  // 衛武營
  'weiwuying': '衛武營',
  'wei wu ying': '衛武營',
  'national kaohsiung center for the arts': '衛武營',
  'weiwuying center for the arts': '衛武營',
  
  // 其他場館
  'taipei performing arts center': '臺北表演藝術中心',
  'tpac': '臺北表演藝術中心',
  'national taichung theater': '臺中國家歌劇院',
  'taichung opera house': '臺中國家歌劇院',
  'taipei arena': '小巨蛋',
  'ticc': 'TICC',
  'legacy': 'Legacy',
};

/**
 * 常見場館名稱列表（中文）
 */
const VENUE_KEYWORDS = [
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
  'Legacy',
  'TICC',
  '小巨蛋',
  '紅樓',
  '華山',
  '松菸',
];

/**
 * 常見演出類型關鍵字
 */
const CATEGORY_KEYWORDS = [
  '音樂會',
  '演唱會',
  '音樂',
  '戲劇',
  '舞蹈',
  '歌劇',
  '音樂劇',
  '獨奏會',
  '協奏曲',
  '交響樂',
  '室內樂',
  '爵士',
  '搖滾',
  '流行',
  '古典',
  '鋼琴',
  '小提琴',
  '大提琴',
  '管弦樂',
  'concert',
  'show',
  'musical',
  'opera',
  'dance',
  'theater',
];

/**
 * 時間相關關鍵字
 */
const DATE_KEYWORDS = [
  '今天',
  '明天',
  '本週',
  '下週',
  '這個月',
  '下個月',
  '今天',
  '明天',
  '後天',
  'today',
  'tomorrow',
  'this week',
  'next week',
  'this month',
  'next month',
];

/**
 * 解析使用者查詢，提取結構化資訊
 */
export async function parseQuery(query: string): Promise<ParsedQuery> {
  const normalized = query.trim();
  const lower = normalized.toLowerCase();
  
  const result: ParsedQuery = {
    artists: [],
    venues: [],
    categories: [],
    keywords: [],
    queryType: 'general',
    originalQuery: normalized,
  };

  // **特殊處理1：「介紹一下/說說/講講...」模式**
  // 提取演出名稱（如「介紹一下：舒伯特《冬之旅》」→「舒伯特《冬之旅》」）
  // 支持多種格式：「介紹一下：XXX」、「介紹 XXX」、「介紹XXX」
  const introducePatternMatch = normalized.match(/^(?:介紹|介绍|说说|說說|講講|讲讲|跟我說|告訴我|查一下|找一下|搜尋|搜索|查詢|查询)(?:一下|看看)?[：:：\s]*(.+)/);
  if (introducePatternMatch && introducePatternMatch[1]) {
    let extractedName = introducePatternMatch[1].trim();
    // 移除尾部的標點符號
    extractedName = extractedName.replace(/[。！？\.,;，。！？；：:\s]+$/, '');
    // 排除太短或明顯不是演出名稱的
    if (extractedName.length >= 2 && !/^(的|嗎|？|表演|演出|音樂會|演唱會|節目)$/.test(extractedName)) {
      console.log('[Query Parser] Detected "介紹/說說..." pattern, extracted:', extractedName);
      // 直接用提取的名稱繼續解析
      return parseQuery(extractedName);
    }
  }

  // **特殊處理2：「有沒有...的表演/演出」模式**
  // 提取藝人名稱或類型（如「有沒有魏德曼的表演」→「魏德曼」，「有鋼琴的嗎」→「鋼琴」）
  // 擴展支持：演奏、獨奏、協奏、演唱等
  // 注意：必須從句首開始匹配，避免誤匹配（如「理查克萊德門」中的「查」、「查理布朗」中的「查」）
  // 移除單獨的「查」，只保留「查一下」、「查看看」等完整短語
  const hasPatternMatch = normalized.match(/^(?:有沒有|有没有|查一下|查看看|找一下|找看看|有|找)(?:一下|看看)?\s*([\u4e00-\u9fa5a-zA-Z\s]+?)(?:的)?(?:表演|演出|演奏|獨奏|独奏|協奏|协奏|演唱|音樂會|音乐会|演唱會|演唱会|節目|节目|嗎|吗|？|$)/);
  if (hasPatternMatch && hasPatternMatch[1]) {
    let extractedName = hasPatternMatch[1].trim();
    // 移除可能殘留的助詞
    extractedName = extractedName.replace(/^(一下|看看|給我|跟我|幫我)\s*/, '');
    // 排除太短、明顯不是名字的、或是演出類型詞彙（但保留類型關鍵字如"鋼琴"、"音樂"等）
    if (extractedName.length >= 2 && extractedName.length <= 20 && 
        !/^(的|嗎|吗|？|有|沒|没|沒有|没有)$/.test(extractedName)) {
      console.log('[Query Parser] Detected "有沒有...的表演/演出/演奏" pattern, extracted:', extractedName);
      // 直接用提取的名稱繼續解析（可能是藝人名稱或類型關鍵字）
      // 如果是類型關鍵字（如"鋼琴"、"音樂"），應該使用類型搜索
      const categoryKeywords = ['鋼琴', '小提琴', '大提琴', '音樂', '音樂會', '演唱會', 'piano', 'violin', 'cello', 'music', 'concert'];
      const isCategoryKeyword = categoryKeywords.some(keyword => 
        extractedName === keyword || extractedName.includes(keyword) || keyword.includes(extractedName)
      );
      
      if (isCategoryKeyword) {
        // 如果是類型關鍵字，設置為類型查詢
        const parsed = await parseQuery(extractedName);
        // 如果解析後沒有類型，手動添加
        if (!parsed.categories || parsed.categories.length === 0) {
          parsed.categories = [extractedName];
        }
        parsed.queryType = 'category';
        console.log('[Query Parser] Set query type to category for:', extractedName);
        return parsed;
      }
      
      // 不是類型關鍵字，繼續正常解析（可能是藝人名稱）
      return parseQuery(extractedName);
    }
  }

  // **特殊處理3：帶演出名稱的後續問題（如「愛與遠方～日本武尊篇 演出何時開始」）**
  // 先檢查是否包含後續問題關鍵字
  const followUpKeywords = [
    '票價', '價格', '多少錢', '價錢', 'price', 'cost', 'ticket price',
    '時間', '日期', '什麼時候', '何時', '何時開始', '何時結束', 'when', 'date', 'time', 'start', 'end',
    '地點', '在哪裡', 'where', 'location', 'venue',
    '詳情', '詳細', '介紹', 'details', 'info', 'information',
    '如何', '怎麼', 'how', '怎麼買', '如何購票', '是多少', '是什麼',
    '開始', '結束', '演出時間', '表演時間', '演出日期', '表演日期',
    '這個表演', '這個演出', '這場表演', '這場演出', '該表演', '該演出',
  ];
  
  const hasFollowUpKeyword = followUpKeywords.some((keyword) => lower.includes(keyword));
  
  if (hasFollowUpKeyword) {
    // 檢查是否包含指示詞（這個、那個、它等），這表示是後續問題
    const hasReferenceWord = /^(這個|那個|它|他|她|該|此|本)/.test(normalized) || 
                            /(這個|那個|它|他|她|該|此|本)\s+(表演|演出|音樂會|演唱會)/.test(normalized);
    
    // 移除後續問題關鍵字，提取演出名稱/關鍵字
    // 注意：保留「演出」、「表演」等詞，因為它們可能是事件名稱的一部分
    let eventNameQuery = normalized;
    
    // 只移除明確的後續問題關鍵字（不包括「演出」、「表演」等）
    const questionKeywords = [
      '票價', '價格', '多少錢', '價錢', 'price', 'cost', 'ticket price',
      '時間', '日期', '什麼時候', '何時', '何時開始', '何時結束', 'when', 'date', 'time', 'start', 'end',
      '地點', '在哪裡', 'where', 'location', 'venue',
      '詳情', '詳細', '介紹', 'details', 'info', 'information',
      '如何', '怎麼', 'how', '怎麼買', '如何購票', '是多少', '是什麼',
      '開始', '結束', '演出時間', '表演時間', '演出日期', '表演日期',
      '這個表演', '這個演出', '這場表演', '這場演出', '該表演', '該演出',
    ];
    
    questionKeywords.forEach((keyword) => {
      // 使用正則表達式不區分大小寫地移除關鍵字（作為完整單詞）
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      eventNameQuery = eventNameQuery.replace(regex, '');
    });
    
    // 清理多餘的空白和標點符號
    eventNameQuery = eventNameQuery.replace(/[\s\?\？]+$/, '').trim();
    
    // 過濾掉明顯不是事件名稱的問題（如"我可以怎麼問你問題"）
    const generalQuestionPatterns = [
      /^(我可以|我能|我想|我要|請告訴|請說|請介紹|請說明|請解釋|請教|請問)/i,
      /(怎麼問|如何問|怎樣問|可以問|能問|要問)/i,
      /(你能|你會|你可以|你會幫|你能幫)/i,
      /(什麼是|什麼叫|什麼意思|什麼意思)/i,
      /(help|how can|how do|what can|what do|can you|could you)/i,
    ];
    
    const isGeneralQuestion = generalQuestionPatterns.some(pattern => pattern.test(normalized));
    
    console.log('[Query Parser] Detected follow-up question, extracted event name:', eventNameQuery, 'isGeneralQuestion:', isGeneralQuestion);
    
    // 如果是明顯的一般問題，不要當作後續問題處理
    if (isGeneralQuestion) {
      result.queryType = 'general';
      result.keywords = [normalized];
      return result;
    }
    
    // 如果包含指示詞或提取的演出名稱足夠長，視為後續問題
    if (hasReferenceWord || eventNameQuery.length >= 2) {
      // 如果包含指示詞，標記為後續問題（將在 state machine 中處理）
      if (hasReferenceWord) {
        result.queryType = 'follow-up';
        result.keywords = [normalized]; // 保留原始查詢，讓 state machine 處理
        return result;
      }
    
    // 將提取的演出名稱作為關鍵字（用於搜尋）
      result.keywords = [eventNameQuery];
      result.queryType = 'general';
      
      // 嘗試從演出名稱中提取場館資訊
      for (const venue of VENUE_KEYWORDS) {
        if (eventNameQuery.includes(venue)) {
          result.venues!.push(venue);
          result.queryType = 'venue';
        }
      }
      
      // 如果沒有找到場館，檢查是否是藝人名稱（英文或中文）
      if (result.venues!.length === 0) {
        const extractedArtists = extractArtistNames(eventNameQuery);
        if (extractedArtists.length > 0) {
          result.artists = extractedArtists;
          result.queryType = 'artist';
        }
      }
      
      return result;
    }
  }

  // 1. 提取場館名稱（支持中英文）
  // 步驟1：檢查是否匹配英文場館名稱
  let matchedEnglishVenue = false;
  const englishVenueEntries = Object.entries(VENUE_NAME_MAPPING).sort((a, b) => b[0].length - a[0].length);
  
  for (const [englishName, chineseName] of englishVenueEntries) {
    // 完整匹配英文名稱（不區分大小寫）
    if (lower === englishName || lower === englishName.replace(/\s+/g, '')) {
      result.venues = [chineseName]; // 只保留精確匹配的場館
      matchedEnglishVenue = true;
      console.log(`[Query Parser] Matched English venue name "${englishName}" -> "${chineseName}"`);
      break;
    }
  }
  
  // 步驟2：如果沒有匹配到英文名稱，檢查中文場館名稱
  if (!matchedEnglishVenue) {
    // 按長度排序，優先匹配較長的場館名稱（例如「國家音樂廳」優先於「音樂廳」）
    const sortedVenues = [...VENUE_KEYWORDS].sort((a, b) => b.length - a.length);
    
    for (const venue of sortedVenues) {
      const venueLower = venue.toLowerCase();
      // 精確匹配或包含完整場館名稱
      if (normalized === venue || normalized.includes(venue) || lower.includes(venueLower)) {
        // 避免重複添加
        if (!result.venues!.includes(venue)) {
          result.venues!.push(venue);
        }
        // 如果找到完整匹配，可以提前結束（避免部分匹配）
        if (normalized === venue || normalized.trim() === venue) {
          result.venues = [venue]; // 只保留精確匹配的場館
          break;
        }
      }
    }
  }

  // 2. 提取演出類型（但如果是場館名稱的一部分，不要提取）
  // 例如：「國家音樂廳」包含「音樂」，但不應該被識別為類型查詢
  const isVenueName = result.venues!.length > 0;
  if (!isVenueName) {
    // 只有在不是場館查詢時，才提取類型
    for (const category of CATEGORY_KEYWORDS) {
      if (lower.includes(category.toLowerCase())) {
        result.categories!.push(category);
      }
    }
  }

  // 3. 提取藝人名稱（改進的邏輯）
  // 重要：只有在不是場館查詢時，才嘗試識別藝人
  // 避免將場館名稱（如「國家音樂廳」）誤識別為藝人
  if (result.venues!.length === 0) {
    // 只有在沒有識別到場館時，才嘗試使用知識庫識別藝人
    try {
      const { identifyArtist, getArtistInfo } = await import('@/services/knowledge-base.service');
      
      // 嘗試識別整個查詢或查詢的一部分是否為藝人
      const identifiedArtist = await identifyArtist(normalized);
      if (identifiedArtist) {
        // 額外檢查：確保識別到的不是場館名稱
        const identifiedNameLower = identifiedArtist.name.toLowerCase();
        const isVenue = VENUE_KEYWORDS.some(v => v.toLowerCase() === identifiedNameLower || identifiedNameLower.includes(v.toLowerCase()));
        
        if (!isVenue) {
          // 找到匹配的藝人，使用標準化名稱
          result.artists = [identifiedArtist.name];
          result.artistInfo = {
            normalizedName: identifiedArtist.name,
            profession: identifiedArtist.profession,
            aliases: identifiedArtist.aliases,
          };
          console.log('[Query Parser] Identified artist from knowledge base:', identifiedArtist.name, identifiedArtist.profession);
        } else {
          console.log('[Query Parser] Rejected artist identification - appears to be a venue:', identifiedArtist.name);
        }
      } else {
        // 如果知識庫沒有匹配，使用原有的提取邏輯
        const artistNames = extractArtistNames(normalized);
        if (artistNames.length > 0) {
          result.artists = artistNames;
          
          // 嘗試為提取的藝人名稱查找知識庫資訊
          for (const artistName of artistNames) {
            const artistInfo = await getArtistInfo(artistName);
            if (artistInfo) {
              result.artistInfo = artistInfo;
              console.log('[Query Parser] Found artist info for:', artistName, artistInfo);
              break;
            }
          }
        }
      }
    } catch (error) {
      // 如果知識庫服務失敗，降級到原有邏輯
      console.warn('[Query Parser] Knowledge base service failed, using fallback:', error);
      const artistNames = extractArtistNames(normalized);
      if (artistNames.length > 0) {
        result.artists = artistNames;
      }
    }
  } else {
    // 如果已經識別到場館，不要嘗試識別藝人
    console.log('[Query Parser] Venue identified, skipping artist identification');
  }

  // 4. 提取時間資訊（簡單版本，可擴展）
  const dateInfo = extractDateInfo(normalized);
  if (dateInfo) {
    result.dateRange = dateInfo;
  }

  // 5. 提取其他關鍵字（排除已識別的）
  const allIdentified = [
    ...result.venues!,
    ...result.categories!,
    ...result.artists!,
  ];
  const words = normalized.split(/\s+/).filter(
    (w) =>
      w.length > 1 &&
      !allIdentified.some((id) => w.includes(id) || id.includes(w)) &&
      !DATE_KEYWORDS.some((d) => w.includes(d))
  );
  if (words.length > 0) {
    result.keywords = words;
  }

  // 6. 判斷查詢類型（優先順序：完整演出名稱 > 日期 > 場館 > 藝人 > 類型）
  // 先檢查是否為完整演出名稱（包含特殊符號和年份）
  const hasEventNameFeatures = /【.*】|《.*》|「.*」|『.*』|\d{4}|週年|音樂節|藝術節/.test(query);
  const isLongWithSpecialChars = query.length >= 15 && /[【】《》「」『』（）\(\)－—&＆]/.test(query);
  
  if (hasEventNameFeatures && isLongWithSpecialChars) {
    // 這是完整的演出名稱，優先使用一般搜尋
    result.queryType = 'general';
    console.log('[Query Parser] Detected complete event name (has special chars + long), treating as general search');
  } else if (result.dateRange) {
    // 日期查詢優先級第二高，因為日期查詢通常很明確
    result.queryType = 'date';
    console.log('[Query Parser] Date query detected, queryType set to "date"');
  } else if (result.venues!.length > 0 && result.artists!.length === 0 && result.categories!.length === 0) {
    result.queryType = 'venue';
  } else if (result.artists!.length > 0 && result.venues!.length === 0 && result.categories!.length === 0) {
    result.queryType = 'artist';
  } else if (result.categories!.length > 0 && result.artists!.length === 0 && result.venues!.length === 0) {
    // 特殊處理：如果查詢包含藝人名稱 + 類型（如"蔡依林演唱會"），應該視為藝人搜索
    // 優先檢查是否有藝人名稱模式（中文2-6字 + 類型，或英文全名 + 類型）
    const artistNamePattern = /([\u4e00-\u9fa5]{2,6})|(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b)/;
    const artistNameMatch = query.match(artistNamePattern);
    
    if (artistNameMatch) {
      // 檢查是否同時包含類型關鍵字（演唱會、音樂會等）
      const hasCategoryKeyword = /(演唱會|音樂會|演出|表演|concert|show)/.test(query);
      if (hasCategoryKeyword) {
        // 提取藝人名稱
        const artistName = artistNameMatch[1] || artistNameMatch[2];
        // 排除類型關鍵字本身
        const categoryWords = ['演唱會', '音樂會', '演出', '表演', 'concert', 'show'];
        const isCategoryWord = categoryWords.includes(artistName);
        
        if (!isCategoryWord && artistName.length >= 2) {
          console.log('[Query Parser] Detected artist name in category query, extracted:', artistName);
          result.artists = [artistName];
          result.categories = []; // 清除類型，優先使用藝人搜索
          result.queryType = 'artist';
        } else {
          // 如果提取的是類型關鍵字本身，繼續使用類型搜索
          const isLongQuery = query.length >= 8;
          const hasSubstantialContent = result.keywords && result.keywords.length > 0;
          
          if (isLongQuery && hasSubstantialContent) {
            result.queryType = 'general';
          } else {
            result.queryType = 'category';
          }
        }
      } else {
        // 沒有類型關鍵字，使用類型搜索
        const isLongQuery = query.length >= 8;
        const hasSubstantialContent = result.keywords && result.keywords.length > 0;
        
        if (isLongQuery && hasSubstantialContent) {
          result.queryType = 'general';
        } else {
          result.queryType = 'category';
        }
      }
    } else {
      // 沒有藝人名稱模式，使用類型搜索
    const isLongQuery = query.length >= 8;
    const hasSubstantialContent = result.keywords && result.keywords.length > 0;
    
    if (isLongQuery && hasSubstantialContent) {
      result.queryType = 'general';
      console.log('[Query Parser] Long query with category keyword, treating as general search');
    } else {
      result.queryType = 'category';
      }
    }
  } else if (result.artists!.length > 0 || result.venues!.length > 0 || result.categories!.length > 0) {
    result.queryType = 'mixed';
  }

  return result;
}

/**
 * 提取藝人名稱（改進版本）
 */
function extractArtistNames(query: string): string[] {
  const artists: string[] = [];
  
  // 常見的疑問詞和助詞
  const stopWords = new Set([
    'are', 'there', 'any', 'is', 'what', 'who', 'where', 'when', 'how',
    'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
    '有', '找', '查', '搜', '有沒有', '想找', '想看', '的', '嗎', '？',
    '音樂會', '演唱會', '演出', '表演', 'concert', 'show',
  ]);

  // 1. 專有名詞（首字母大寫的單詞組合，如 "Eric Lu"）
  const properNounPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  let match;
  while ((match = properNounPattern.exec(query)) !== null) {
    const name = match[1].trim();
    const firstWord = name.split(/\s+/)[0].toLowerCase();
    if (!stopWords.has(firstWord) && name.length >= 3) {
      artists.push(name);
    }
  }

  // 1.5. 小寫專有名詞（如 "eric lu"）- 改進：支援小寫輸入
  // 匹配兩個連續的英文單詞（每個至少 2 個字母），排除常見疑問詞
  const lowercaseNamePattern = /\b([a-z]{2,})\s+([a-z]{2,})\b/g;
  let lowercaseMatch;
  while ((lowercaseMatch = lowercaseNamePattern.exec(query)) !== null) {
    const firstWord = lowercaseMatch[1].toLowerCase();
    const secondWord = lowercaseMatch[2].toLowerCase();
    // 排除常見疑問詞和助詞
    if (!stopWords.has(firstWord) && !stopWords.has(secondWord)) {
      // 檢查上下文（擴大範圍）
      const beforeMatch = query.substring(Math.max(0, lowercaseMatch.index - 10), lowercaseMatch.index);
      const afterMatch = query.substring(lowercaseMatch.index + lowercaseMatch[0].length, Math.min(query.length, lowercaseMatch.index + lowercaseMatch[0].length + 10));
      // 更寬鬆的條件：如果在「有/找/查/是否」之後，或包含「的」字，或後面有「的/嗎/？/表演/音樂會」等
      if (beforeMatch.includes('有') || beforeMatch.includes('找') || beforeMatch.includes('查') || beforeMatch.includes('是否') ||
          afterMatch.includes('的') || afterMatch.includes('嗎') || afterMatch.includes('？') || afterMatch.includes('表演') || afterMatch.includes('音樂會') || afterMatch.includes('演出')) {
        // 將首字母大寫（標準化）
        const normalizedName = `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1)} ${secondWord.charAt(0).toUpperCase() + secondWord.slice(1)}`;
        artists.push(normalizedName);
        console.log('[Query Parser] Extracted lowercase artist name:', normalizedName, 'from query:', query);
      }
    }
  }

  // 2. 中文藝人名稱（2-6 個中文字，排除常見詞）
  // 先檢查是否包含日期查詢，如果包含則跳過藝人提取（避免誤判）
  const hasDateQuery = /(\d{1,2})[月/]|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i.test(query);
  
  // 常見的地名、國家名稱等，不應該被識別為藝人
  const commonPlaceNames = ['日本', '中國', '台灣', '美國', '英國', '法國', '德國', '韓國', '香港', '新加坡', '馬來西亞', '泰國', '越南', '印尼', '菲律賓'];
  
  if (!hasDateQuery) {
    const chineseNamePattern = /([\u4e00-\u9fa5]{2,6})/g;
    const chineseMatches = query.matchAll(chineseNamePattern);
    for (const match of chineseMatches) {
      const name = match[1];
      // 排除常見詞、場館名稱、日期相關詞、地名
      const dateRelatedWords = ['月', '日', '年', '到', '至', '之間', '給我', '所有', '在', '的', '表演', '演出'];
      if (
        !stopWords.has(name) &&
        !commonPlaceNames.includes(name) && // 排除常見地名
        !VENUE_KEYWORDS.some((v) => v.includes(name) || name.includes(v)) &&
        !CATEGORY_KEYWORDS.some((c) => c.includes(name) || name.includes(c)) &&
        !dateRelatedWords.some((d) => name.includes(d) || d.includes(name)) &&
        name.length >= 2 &&
        name.length <= 6
      ) {
        // 進一步檢查：如果前面有「的」或後面有「的」，可能是藝人名稱
        // 但如果是完整的演出名稱（包含特殊字符如「～」、「《》」等），不要提取部分詞作為藝人
        const context = query.substring(Math.max(0, match.index! - 2), Math.min(query.length, match.index! + name.length + 2));
        const hasSpecialChars = /[「」《》～~\-－]/.test(query); // 檢查是否包含特殊字符（可能是完整演出名稱）
        
        // 如果查詢包含特殊字符且長度較長，可能是完整演出名稱，不要提取部分詞作為藝人
        if (hasSpecialChars && query.length >= 8) {
          // 完整演出名稱，不提取部分詞作為藝人
          continue;
        }
        
        if (context.includes('的') || context.includes('有') || context.includes('找')) {
          artists.push(name);
        }
      }
    }
  }

  // 去重
  return Array.from(new Set(artists));
}

/**
 * 提取時間資訊（改進版本，支援多種日期格式）
 */
function extractDateInfo(query: string): { start?: Date; end?: Date } | null {
  const lower = query.toLowerCase();
  const now = new Date();
  const currentYear = now.getFullYear();
  
  if (lower.includes('今天') || lower.includes('today')) {
    return { start: now, end: new Date(now.getTime() + 24 * 60 * 60 * 1000) };
  }
  if (lower.includes('明天') || lower.includes('tomorrow')) {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return { start: tomorrow, end: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) };
  }
  if (lower.includes('本週') || lower.includes('this week')) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return { start: weekStart, end: weekEnd };
  }
  if (lower.includes('下週') || lower.includes('next week')) {
    const nextWeekStart = new Date(now);
    nextWeekStart.setDate(now.getDate() - now.getDay() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
    return { start: nextWeekStart, end: nextWeekEnd };
  }

  // 嘗試解析具體日期（如 "2024-12-25" 或 "12/25/2024"）
  const datePattern = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;
  const dateMatch = query.match(datePattern);
  if (dateMatch) {
    const year = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1;
    const day = parseInt(dateMatch[3]);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return { start: date, end: new Date(date.getTime() + 24 * 60 * 60 * 1000) };
    }
  }

  // 嘗試解析英文月份格式（如 "Nov 20", "November 20", "Nov 20, 2024"）
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  // 匹配 "Nov 20" 或 "November 20" 或 "Nov 20, 2024" 或 "November 20, 2024"
  const englishDatePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:\s*,\s*(\d{4}))?\b/i;
  const englishDateMatch = query.match(englishDatePattern);
  if (englishDateMatch) {
    const monthStr = englishDateMatch[1].toLowerCase();
    const day = parseInt(englishDateMatch[2]);
    const year = englishDateMatch[3] ? parseInt(englishDateMatch[3]) : currentYear;
    
    // 找到月份索引
    let monthIndex = monthAbbr.indexOf(monthStr);
    if (monthIndex === -1) {
      monthIndex = monthNames.indexOf(monthStr);
    }
    
    if (monthIndex !== -1 && day >= 1 && day <= 31) {
      const date = new Date(year, monthIndex, day);
      if (!isNaN(date.getTime())) {
        console.log(`[Date Parser] Parsed English date: ${monthStr} ${day}, ${year} -> ${date.toISOString()}`);
        return { start: date, end: new Date(date.getTime() + 24 * 60 * 60 * 1000) };
      }
    }
  }

  // 嘗試解析中文日期範圍格式（如 "11月15到11月30" 或 "11月15日至11月30日"）
  const chineseDateRangePattern = /(\d{1,2})[月/](\d{1,2})(?:日)?\s*(?:到|至|-|~)\s*(\d{1,2})[月/](\d{1,2})(?:日)?(?:\s*[年/]?\s*(\d{4}))?/;
  const chineseDateRangeMatch = query.match(chineseDateRangePattern);
  if (chineseDateRangeMatch) {
    const startMonth = parseInt(chineseDateRangeMatch[1]) - 1;
    const startDay = parseInt(chineseDateRangeMatch[2]);
    const endMonth = parseInt(chineseDateRangeMatch[3]) - 1;
    const endDay = parseInt(chineseDateRangeMatch[4]);
    const year = chineseDateRangeMatch[5] ? parseInt(chineseDateRangeMatch[5]) : currentYear;
    
    if (startMonth >= 0 && startMonth <= 11 && startDay >= 1 && startDay <= 31 &&
        endMonth >= 0 && endMonth <= 11 && endDay >= 1 && endDay <= 31) {
      const startDate = new Date(year, startMonth, startDay);
      const endDate = new Date(year, endMonth, endDay);
      // 結束日期應該是當天的結束時間（23:59:59）
      endDate.setHours(23, 59, 59, 999);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate) {
        console.log(`[Date Parser] Parsed Chinese date range: ${startMonth + 1}月${startDay}日到${endMonth + 1}月${endDay}日, ${year}`);
        return { start: startDate, end: endDate };
      }
    }
  }

  // 嘗試解析英文日期範圍格式（如 "Nov 15 to Nov 30" 或 "November 15 - November 30"）
  const englishDateRangePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:\s*,\s*(\d{4}))?\s*(?:to|-|~)\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:\s*,\s*(\d{4}))?\b/i;
  const englishDateRangeMatch = query.match(englishDateRangePattern);
  if (englishDateRangeMatch) {
    const startMonthStr = englishDateRangeMatch[1].toLowerCase();
    const startDay = parseInt(englishDateRangeMatch[2]);
    const startYear = englishDateRangeMatch[3] ? parseInt(englishDateRangeMatch[3]) : currentYear;
    const endMonthStr = englishDateRangeMatch[4].toLowerCase();
    const endDay = parseInt(englishDateRangeMatch[5]);
    const endYear = englishDateRangeMatch[6] ? parseInt(englishDateRangeMatch[6]) : currentYear;
    
    let startMonthIndex = monthAbbr.indexOf(startMonthStr);
    if (startMonthIndex === -1) {
      startMonthIndex = monthNames.indexOf(startMonthStr);
    }
    let endMonthIndex = monthAbbr.indexOf(endMonthStr);
    if (endMonthIndex === -1) {
      endMonthIndex = monthNames.indexOf(endMonthStr);
    }
    
    if (startMonthIndex !== -1 && endMonthIndex !== -1 && 
        startDay >= 1 && startDay <= 31 && endDay >= 1 && endDay <= 31) {
      const startDate = new Date(startYear, startMonthIndex, startDay);
      const endDate = new Date(endYear, endMonthIndex, endDay);
      endDate.setHours(23, 59, 59, 999);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate) {
        console.log(`[Date Parser] Parsed English date range: ${startMonthStr} ${startDay} to ${endMonthStr} ${endDay}`);
        return { start: startDate, end: endDate };
      }
    }
  }

  // 嘗試解析單個中文日期格式（如 "11月20日" 或 "11/20"）
  const chineseDatePattern = /(\d{1,2})[月/](\d{1,2})(?:日)?(?:\s*[年/]?\s*(\d{4}))?/;
  const chineseDateMatch = query.match(chineseDatePattern);
  if (chineseDateMatch) {
    const month = parseInt(chineseDateMatch[1]) - 1; // JavaScript 月份從 0 開始
    const day = parseInt(chineseDateMatch[2]);
    const year = chineseDateMatch[3] ? parseInt(chineseDateMatch[3]) : currentYear;
    
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        console.log(`[Date Parser] Parsed Chinese date: ${month + 1}月${day}日, ${year} -> ${date.toISOString()}`);
        return { start: date, end: new Date(date.getTime() + 24 * 60 * 60 * 1000) };
      }
    }
  }

  return null;
}

