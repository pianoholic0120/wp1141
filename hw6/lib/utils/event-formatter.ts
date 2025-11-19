/**
 * 事件資料格式化工具
 * 清理和格式化事件資料，移除冗長和不相關的內容
 */

/**
 * 清理演出者資訊
 * 移除 URL、圖片連結、冗長描述等不相關內容
 */
export function cleanArtists(artists: string[]): string[] {
  if (!artists || artists.length === 0) return [];

  return artists
    .map((artist) => {
      // 移除 URL
      let cleaned = artist.replace(/https?:\/\/[^\s]+/g, '');
      // 移除圖片 URL（s3.resource.opentix.life 等）
      cleaned = cleaned.replace(/s3\.resource\.[^\s]+/g, '');
      // 移除 Markdown 圖片語法
      cleaned = cleaned.replace(/!\[.*?\]\([^)]+\)/g, '');
      // 移除開頭的斜線和標點（如「//,」）
      cleaned = cleaned.replace(/^[\/\\,，。、；;：:\s]+/g, '');
      // 移除多餘的標點和空格
      cleaned = cleaned.replace(/[，,。、；;：:]+/g, ',');
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      
      // 過濾掉明顯不是藝人名稱的內容
      // 1. 場館名稱（包含「廳」、「Hall」、「Theatre」等）
      if (/廳|館|Hall|Theatre|Theater|Center|Centre|Philharmonic/i.test(cleaned)) {
        return null;
      }
      // 2. 比賽或組織名稱（包含「Competition」、「大賽」等）
      if (/Competition|Contest|大賽|比賽|Festival|音樂節|藝術節/i.test(cleaned)) {
        return null;
      }
      // 3. 曲目名稱模式（如「降b小調第二號鋼琴奏鳴曲，作品 35」）
      if (/[降升][a-g]?[小大]?調|作品\s*\d+|Op\.\s*\d+|No\.\s*\d+|作品\s*\d+\s*之\s*\d+/i.test(cleaned)) {
        return null;
      }
      // 2. 過長的描述（超過 50 個字符的可能是描述而非藝人名稱）
      if (cleaned.length > 50) {
        // 嘗試提取前 50 個字符，或找到第一個逗號/句號
        const firstComma = cleaned.indexOf(',');
        const firstPeriod = cleaned.indexOf('。');
        const cutPoint = Math.min(
          firstComma > 0 ? firstComma : cleaned.length,
          firstPeriod > 0 ? firstPeriod : cleaned.length,
          50
        );
        cleaned = cleaned.substring(0, cutPoint).trim();
        // 如果截斷後仍然包含曲目模式，過濾掉
        if (/[降升][a-g]?[小大]?調|作品\s*\d+|Op\.\s*\d+/i.test(cleaned)) {
          return null;
        }
      }
      return cleaned;
    })
    .filter((artist) => {
      if (!artist) return false;
      // 過濾掉空字串、純標點、或太短的內容
      const trimmed = artist.trim();
      if (trimmed.length < 2) return false;
      // 過濾掉明顯不是藝人名稱的內容（如純數字、純標點等）
      if (/^[\d\s,，。、；;：:]+$/.test(trimmed)) return false;
      // 過濾掉包含明顯 URL 模式的內容
      if (/\.(com|org|net|life|jpg|jpeg|png|gif)/i.test(trimmed)) return false;
      // 過濾掉明顯是曲目或作品描述的內容
      if (/[降升][a-g]?[小大]?調|作品\s*\d+|Op\.\s*\d+|No\.\s*\d+|作品\s*\d+\s*之\s*\d+|奏鳴曲|練習曲|夜曲|波蘭舞曲|圓舞曲/i.test(trimmed)) {
        return false;
      }
      // 過濾掉以「他的」、「讓人」等開頭的描述性文字
      if (/^(他的|讓人|這|那|此|該|其|「|『|")/i.test(trimmed)) {
        return false;
      }
      // 過濾掉包含日期、時間、地點等描述性內容（如「30_ 於國家音樂廳演出之」）
      if (/\d+[年月日]|於.*演出|購買.*優惠|享\d+折|中午\d+|下午\d+|晚上\d+/i.test(trimmed)) {
        return false;
      }
      // 過濾掉包含「交響樂團」但後面跟著描述性文字的（如「芝加哥交響樂團, 30_ 於...」）
      if (/交響樂團.*[,，]/.test(trimmed) && trimmed.length > 15) {
        // 如果包含「交響樂團」但後面還有其他內容，只保留「交響樂團」之前的部分
        const orchestraMatch = trimmed.match(/^([^,，]+交響樂團)/);
        if (orchestraMatch) {
          return orchestraMatch[1];
        }
        return false;
      }
      // 過濾掉包含數字和下劃線的（如「30_」）
      if (/\d+_/.test(trimmed)) {
        return false;
      }
      
      // 過濾掉明顯是比賽的描述（優先檢查，因為這些通常不包含人名）
      if (/^(the\s+)?(international|national|world|european|asian)\s+(chopin|piano|music|dance|theater|theatre|competition|contest|festival)/i.test(trimmed)) {
        return false;
      }
      
      // 過濾掉場館名稱模式（如 "Warsaw Philharmonic Hall", "National Concert Hall", "Grand Theatre"）
      // 檢查是否以場館關鍵字結尾或包含場館關鍵字但沒有人名
      const venuePatterns = [
        /\b(philharmonic|symphony|orchestra|hall|theater|theatre|center|centre|venue|auditorium|grand\s+theatre|grand\s+theater)\b/i,
        /^(warsaw|national|grand|royal|metropolitan|carnegie)\s+(philharmonic|symphony|orchestra|hall|theater|theatre|center|centre)/i,
      ];
      
      const hasVenueKeyword = venuePatterns.some(pattern => pattern.test(trimmed));
      if (hasVenueKeyword) {
        // 檢查是否包含人名（如 "Eric Lu" 或 "陸逸軒"）
        // 人名模式：英文全名（兩個大寫字母開頭的單詞）或中文姓名（2-4個中文字）
        const hasPersonName = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/.test(trimmed) || 
                             /[\u4e00-\u9fa5]{2,4}/.test(trimmed);
        if (!hasPersonName) {
          return false; // 沒有包含人名，是純場館名稱
        }
      }
      
      // 過濾掉比賽名稱（如 "Chopin Piano Competition"）
      if (/\b(chopin|piano|music|dance)\s+(competition|contest|festival)\b/i.test(trimmed) && 
          !/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/.test(trimmed) && 
          !/[\u4e00-\u9fa5]{2,4}/.test(trimmed)) {
        return false;
      }
      
      return true;
    })
    .slice(0, 5); // 最多保留 5 個演出者
}

/**
 * 檢查事件是否與藝人相關
 * 改進：更寬鬆的匹配邏輯，確保不會過濾掉相關結果
 */
export function isEventRelevantToArtist(event: any, artistName: string): boolean {
  const artistLower = artistName.toLowerCase().trim();
  const words = artistLower.split(/\s+/).filter((w) => w.length >= 2);
  
  // 如果沒有有效的單詞，返回 false
  if (words.length === 0) {
    return false;
  }

  // 對於多個單詞的藝人名稱（如 "Eric Lu"），需要更嚴格的匹配
  // 要求：所有單詞都必須出現，且順序正確（或至少非常接近）
  const requiresStrictMatch = words.length > 1;

  // 3. 檢查演出者陣列（最重要，優先檢查）
  const artists = (event.artists || []).map((a: string) => a.toLowerCase().trim());
  for (const eventArtist of artists) {
    // 完整匹配（最高優先級）
    if (eventArtist === artistLower || eventArtist.includes(artistLower)) {
      return true;
    }
    
    // 對於多個單詞，檢查是否所有單詞都出現且順序正確
    if (requiresStrictMatch) {
      // 檢查是否包含所有單詞
      const allWordsPresent = words.every((w) => eventArtist.includes(w));
      if (allWordsPresent) {
        // 進一步檢查順序：確保單詞的順序大致正確
        // 例如 "Eric Lu" 應該匹配 "Eric Lu" 或 "Lu, Eric" 但不應該匹配 "Lu Eric"（如果中間有其他詞）
        const firstWordIndex = eventArtist.indexOf(words[0]);
        const lastWordIndex = eventArtist.indexOf(words[words.length - 1]);
        
        // 如果第一個和最後一個單詞都找到，且最後一個在第一個之後，則認為匹配
        if (firstWordIndex >= 0 && lastWordIndex >= firstWordIndex) {
          // 檢查中間是否有太多其他字符（超過 10 個字符可能表示不相關）
          const middleText = eventArtist.substring(firstWordIndex + words[0].length, lastWordIndex);
          if (middleText.length <= 10) {
            return true;
          }
        }
      }
    } else {
      // 單個單詞：直接檢查是否包含
      if (eventArtist.includes(words[0])) {
        return true;
      }
    }
  }

  // 1. 檢查標題（次優先級）
  const title = (event.title || '').toLowerCase();
  if (title.includes(artistLower)) {
    return true; // 完整匹配
  }
  // 如果有多個單詞，檢查是否所有單詞都在標題中且順序正確
  if (requiresStrictMatch) {
    const allWordsPresent = words.every((w) => title.includes(w));
    if (allWordsPresent) {
      const firstWordIndex = title.indexOf(words[0]);
      const lastWordIndex = title.indexOf(words[words.length - 1]);
      if (firstWordIndex >= 0 && lastWordIndex >= firstWordIndex && 
          (lastWordIndex - firstWordIndex) <= 50) { // 單詞之間不超過 50 個字符
        return true;
      }
    }
  } else if (title.includes(words[0])) {
    return true;
  }

  // 2. 檢查副標題
  const subtitle = (event.subtitle || '').toLowerCase();
  if (subtitle.includes(artistLower)) {
    return true;
  }
  if (requiresStrictMatch) {
    const allWordsPresent = words.every((w) => subtitle.includes(w));
    if (allWordsPresent) {
      const firstWordIndex = subtitle.indexOf(words[0]);
      const lastWordIndex = subtitle.indexOf(words[words.length - 1]);
      if (firstWordIndex >= 0 && lastWordIndex >= firstWordIndex && 
          (lastWordIndex - firstWordIndex) <= 50) {
        return true;
      }
    }
  } else if (subtitle.includes(words[0])) {
    return true;
  }

  // 4. 檢查描述（權重較低，但也要檢查）
  const desc = (event.description || '').toLowerCase();
  if (desc.includes(artistLower)) {
    // 對於描述中的匹配，需要更嚴格的檢查
    const artistIndex = desc.indexOf(artistLower);
    const context = desc.substring(
      Math.max(0, artistIndex - 20),
      Math.min(desc.length, artistIndex + artistLower.length + 20)
    );
    // 如果上下文包含相關關鍵字，認為是相關的（包括得主、winner等）
    if (
      /演出者|藝術家|鋼琴家|音樂家|演奏家|指揮|得主|獲獎|conductor|pianist|musician|artist|performer|表演者|winner|prize|medalist/i.test(
        context
      )
    ) {
      return true;
    }
  }
  
  // 對於多個單詞，檢查是否所有單詞都在描述中且順序正確
  if (requiresStrictMatch) {
    const allWordsPresent = words.every((w) => desc.includes(w));
    if (allWordsPresent) {
      // 檢查是否在介紹藝人的段落中
      const firstWordIndex = desc.indexOf(words[0]);
      if (firstWordIndex >= 0) {
        const lastWordIndex = desc.indexOf(words[words.length - 1]);
        if (lastWordIndex >= firstWordIndex && (lastWordIndex - firstWordIndex) <= 50) {
          const descContext = desc.substring(
            Math.max(0, firstWordIndex - 30),
            Math.min(desc.length, lastWordIndex + 50)
          );
          if (
            /演出者|藝術家|鋼琴家|音樂家|演奏家|指揮|conductor|pianist|musician|artist|performer|表演者|得主|winner|medalist/i.test(
              descContext
            )
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * 清理場館資訊
 * 移除描述性文字、Markdown 連結殘留等
 */
export function cleanVenue(venue: string): string {
  if (!venue) return '';
  
  let cleaned = venue;
  
  // 移除 Markdown 連結殘留（如 "國家音樂廳](https://..."）
  cleaned = cleaned.replace(/\]\([^)]+\)/g, '');
  
  // 移除 URL
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  
  // 如果包含過多標點符號或過長（超過100字），可能是描述文字而非場館名稱
  // 嘗試提取前面的場館名稱部分
  if (cleaned.length > 100 || (cleaned.match(/[。！？，、；：]/g) || []).length > 3) {
    // 嘗試找到第一個場館名稱（通常在前面，後面跟著描述）
    // 常見模式：「國家音樂廳盛大歡慶，讓更多...」-> 取「國家音樂廳」
    const venuePattern = /([\u4e00-\u9fa5]{2,15}(?:廳|館|中心|劇院|廳院|Center|Hall|Theatre|Theater))/;
    const match = cleaned.match(venuePattern);
    if (match) {
      cleaned = match[1];
    } else {
      // 如果沒有匹配到場館模式，取前50個字符的第一句話
      const firstSentence = cleaned.split(/[，。、；：！？\n]/)[0];
      if (firstSentence && firstSentence.length < 50) {
        cleaned = firstSentence;
      } else {
        cleaned = cleaned.substring(0, 50);
      }
    }
  }
  
  // 移除多餘的空格和標點
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[，。、；：！？\s]+|[，。、；：！？\s]+$/g, '');
  
  return cleaned;
}

/**
 * 清理和格式化日期資訊
 * 過濾掉過去的日期，去重，並限制顯示數量
 */
function cleanDates(dates: any[]): any[] {
  if (!dates || dates.length === 0) return [];
  
  const now = new Date();
  now.setHours(0, 0, 0, 0); // 只比較日期，不比較時間
  
  // 過濾掉過去的日期，並轉換為統一的格式
  const validDates = dates
    .map((d: any) => {
      let dateObj: Date | null = null;
      
      if (d.date instanceof Date) {
        dateObj = d.date;
      } else if (typeof d.date === 'string') {
        try {
          dateObj = new Date(d.date);
          if (isNaN(dateObj.getTime())) {
            return null;
          }
        } catch {
          return null;
        }
      } else {
        return null;
      }
      
      // 只保留未來的日期（包括今天）
      const dateOnly = new Date(dateObj);
      dateOnly.setHours(0, 0, 0, 0);
      
      if (dateOnly < now) {
        return null; // 過濾掉過去的日期
      }
      
      return {
        date: dateObj,
        time: d.time || undefined,
        venue: d.venue || undefined,
      };
    })
    .filter((d: any) => d !== null);
  
  // 去重：相同日期（不考慮時間）只保留一個，優先保留有時間的
  const dateMap = new Map<string, any>();
  
  for (const d of validDates) {
    const dateKey = d.date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, d);
    } else {
      // 如果已存在，優先保留有時間的
      const existing = dateMap.get(dateKey);
      if (!existing.time && d.time) {
        dateMap.set(dateKey, d);
      } else if (existing.time && !d.time) {
        // 保持原有的（有時間的）
      } else if (existing.time && d.time) {
        // 如果都有時間，保留時間較早的（通常是第一場）
        const existingTime = existing.time.split(':').map(Number);
        const newTime = d.time.split(':').map(Number);
        if (newTime[0] < existingTime[0] || (newTime[0] === existingTime[0] && newTime[1] < existingTime[1])) {
          dateMap.set(dateKey, d);
        }
      }
    }
  }
  
  // 轉換回陣列，按日期排序
  const uniqueDates = Array.from(dateMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5); // 最多顯示 5 個日期
  
  return uniqueDates;
}

/**
 * 格式化事件資料，清理冗長內容
 * @param event 事件資料
 * @param options 選項：keepFullDescription - 是否保留完整描述（用於單一節目查詢）
 */
/**
 * 從標題和副標題中提取演出者名稱
 * 用於 artists 字段為空或包含錯誤信息時
 */
export function extractArtistsFromTitle(title: string, subtitle?: string): string[] {
  const artists: string[] = [];
  
  // 提取中文人名（常見模式：「金獎得主陸逸軒」、「銀獎得主陳禹同」）
  // 中文人名通常是 2-3 個字，在名字後面通常會跟著非人名關鍵詞或非中文字符
  const chineseNamePattern = /(?:金獎|銀獎|銅獎|首獎|特獎)(?:得主)?\s*([\u4e00-\u9fa5]{2,3})(?=[^\u4e00-\u9fa5]|鋼琴|音樂|獨奏|協奏|$)/g;
  let match;
  while ((match = chineseNamePattern.exec(title)) !== null) {
    const name = match[1].trim();
    // 排除常見的非人名詞彙
    if (name.length >= 2 && 
        !/得主|大賽|比賽/.test(name) && 
        !artists.includes(name)) {
      artists.push(name);
    }
  }
  
  // 提取英文人名（如 "Eric Lu", "Kevin Chen", "Jörg Widmann"）
  // 只從副標題中提取，因為副標題通常有更明確的人名
  // 支持带特殊字符的名字（如 ö, é 等）
  if (subtitle) {
    // 支持特殊字符的英文名（如 Jörg, André）
    const englishNamePattern = /\b([A-ZÀ-ÿ][a-zà-ÿ]+\s+[A-ZÀ-ÿ][a-zà-ÿ]+)\b/g;
    while ((match = englishNamePattern.exec(subtitle)) !== null) {
      const name = match[1].trim();
      // 排除常見的非人名詞彙（包括 Medalist）
      if (!/Competition|Concert|Hall|Theatre|Festival|Piano|Music|Medalist|Winner|Prize/i.test(name) && 
          !artists.includes(name)) {
        artists.push(name);
      }
    }
  }
  
  return artists;
}

export function formatEventForDisplay(event: any, options?: { keepFullDescription?: boolean }): any {
  let description = event.description;
  if (description) {
    // 清理 URL 和圖片連結
    description = description
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/s3\.resource\.[^\s]+/g, '')
      .replace(/!\[.*?\]\([^)]+\)/g, '')
      .trim();
    
    // 如果不是保留完整描述，截斷到 150 個字符
    if (!options?.keepFullDescription) {
      description = description.substring(0, 150);
    }
  }
  
  let artists = cleanArtists(event.artists || []);
  
  // 如果清理後沒有演出者，嘗試從標題中提取
  if (artists.length === 0) {
    const extractedArtists = extractArtistsFromTitle(event.title, event.subtitle);
    if (extractedArtists.length > 0) {
      console.log('[Event Formatter] Extracted artists from title:', extractedArtists);
      artists = extractedArtists;
    }
  }
  
  return {
    ...event,
    artists: artists,
    description: description || undefined,
    // 清理場館資訊
    venue: event.venue ? cleanVenue(event.venue) : undefined,
    // 清理和格式化日期資訊
    dates: cleanDates(event.dates || []),
  };
}

