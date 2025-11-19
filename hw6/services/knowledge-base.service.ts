/**
 * 知識庫服務
 * 從網站資料中提取並管理藝人、場館、演出等實體資訊
 */

import fs from 'fs';
import path from 'path';

export interface Artist {
  name: string; // 主要名稱（中文或英文）
  aliases: string[]; // 別名（如：Eric Lu, 陸逸軒）
  profession: string[]; // 職業（如：鋼琴家、小提琴家）
  description?: string; // 簡介
  achievements?: string[]; // 成就
  relatedEvents?: string[]; // 相關事件 ID
}

export interface Venue {
  name: string; // 主要名稱
  aliases: string[]; // 別名
  location?: string; // 地點
  type?: string; // 類型（音樂廳、劇院等）
}

export interface KnowledgeBase {
  artists: Map<string, Artist>; // key: 標準化名稱（小寫）
  venues: Map<string, Venue>; // key: 標準化名稱（小寫）
}

let knowledgeBase: KnowledgeBase | null = null;
const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), 'data', 'knowledge-base.json');

/**
 * 初始化知識庫（從網站資料中提取）
 */
export async function initializeKnowledgeBase(): Promise<KnowledgeBase> {
  if (knowledgeBase) {
    return knowledgeBase;
  }

  // 嘗試從快取檔案載入
  try {
    if (fs.existsSync(KNOWLEDGE_BASE_PATH)) {
      const cached = JSON.parse(fs.readFileSync(KNOWLEDGE_BASE_PATH, 'utf-8'));
      knowledgeBase = {
        artists: new Map(cached.artists),
        venues: new Map(cached.venues),
      };
      console.log('[Knowledge Base] Loaded from cache');
      return knowledgeBase;
    }
  } catch (error) {
    console.warn('[Knowledge Base] Failed to load cache, will rebuild:', error);
  }

  // 從網站資料中提取
  knowledgeBase = await extractKnowledgeFromWebsite();
  
  // 儲存快取
  try {
    const dir = path.dirname(KNOWLEDGE_BASE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      KNOWLEDGE_BASE_PATH,
      JSON.stringify({
        artists: Array.from(knowledgeBase.artists.entries()),
        venues: Array.from(knowledgeBase.venues.entries()),
      }, null, 2),
      'utf-8'
    );
    console.log('[Knowledge Base] Saved to cache');
  } catch (error) {
    console.warn('[Knowledge Base] Failed to save cache:', error);
  }

  return knowledgeBase;
}

/**
 * 從網站資料中提取知識
 */
async function extractKnowledgeFromWebsite(): Promise<KnowledgeBase> {
  const artists = new Map<string, Artist>();
  const venues = new Map<string, Venue>();

  const outputSitePath = path.join(process.cwd(), 'output_site', 'pages');
  
  if (!fs.existsSync(outputSitePath)) {
    console.warn('[Knowledge Base] output_site/pages not found, using empty knowledge base');
    return { artists, venues };
  }

  // 讀取所有 event_*.md 檔案
  const files = fs.readdirSync(outputSitePath).filter(f => f.startsWith('event_') && f.endsWith('.md'));
  
  console.log(`[Knowledge Base] Processing ${files.length} event files...`);

  for (const file of files) {
    try {
      const filePath = path.join(outputSitePath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const eventId = file.replace('event_', '').replace('.md', '');
      
      // 提取藝人資訊
      extractArtistsFromEvent(content, eventId, artists);
      
      // 提取場館資訊
      extractVenuesFromEvent(content, eventId, venues);
    } catch (error) {
      console.warn(`[Knowledge Base] Failed to process ${file}:`, error);
    }
  }

  console.log(`[Knowledge Base] Extracted ${artists.size} artists and ${venues.size} venues`);
  
  return { artists, venues };
}

/**
 * 從事件內容中提取藝人資訊
 */
function extractArtistsFromEvent(
  content: string,
  eventId: string,
  artists: Map<string, Artist>
): void {
  // 排除場館名稱列表（避免將場館誤識別為藝人）
  const venueKeywords = [
    '國家音樂廳', '國家戲劇院', '兩廳院', '臺中國家歌劇院', '台中國家歌劇院',
    '衛武營', '衛武營國家藝術文化中心', '臺北表演藝術中心', '台北表演藝術中心',
    '誠品表演廳', '新莊文化藝術中心', '陽明交通大學', '高雄市音樂館'
  ];
  
  // 模式 1: **鋼琴｜陸逸軒** 或 **Piano｜Eric LU**
  const professionPattern = /\*\*([^｜]+)｜([^*]+)\*\*/g;
  let match;
  
  while ((match = professionPattern.exec(content)) !== null) {
    const profession = match[1].trim();
    const name = match[2].trim();
    
    // 檢查是否是場館名稱（避免將場館誤識別為藝人）
    const isVenue = venueKeywords.some(v => 
      name.includes(v) || v.includes(name) || name.toLowerCase() === v.toLowerCase()
    );
    
    if (isVenue) {
      console.log(`[Knowledge Base] Skipping venue name as artist: ${name}`);
      continue;
    }
    
    // 檢查 profession 是否包含廣告資訊（如「古典行家」、「發燒樂迷」等）
    const isAdvertisement = /(古典行家|發燒樂迷|資深愛樂|忠實粉絲|品樂入門|優惠|折扣|折|贈|禮|券)/i.test(profession);
    if (isAdvertisement) {
      console.log(`[Knowledge Base] Skipping advertisement as profession: ${profession}`);
      continue;
    }
    
    // 標準化名稱（小寫）
    const normalizedName = name.toLowerCase();
    
    if (!artists.has(normalizedName)) {
      artists.set(normalizedName, {
        name,
        aliases: [name],
        profession: [profession],
        relatedEvents: [eventId],
      });
    } else {
      const artist = artists.get(normalizedName)!;
      if (!artist.profession.includes(profession)) {
        artist.profession.push(profession);
      }
      if (!artist.relatedEvents?.includes(eventId)) {
        artist.relatedEvents?.push(eventId);
      }
    }
  }

  // 模式 2: 尋找中英文配對（如：陸逸軒 Eric Lu）
  const bilingualPattern = /([\u4e00-\u9fa5]{2,})\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g;
  while ((match = bilingualPattern.exec(content)) !== null) {
    const chineseName = match[1].trim();
    const englishName = match[2].trim();
    
    const normalizedChinese = chineseName.toLowerCase();
    const normalizedEnglish = englishName.toLowerCase();
    
    // 如果中文名稱已存在，添加英文別名
    if (artists.has(normalizedChinese)) {
      const artist = artists.get(normalizedChinese)!;
      if (!artist.aliases.includes(englishName)) {
        artist.aliases.push(englishName);
      }
    } else if (artists.has(normalizedEnglish)) {
      // 如果英文名稱已存在，添加中文別名
      const artist = artists.get(normalizedEnglish)!;
      if (!artist.aliases.includes(chineseName)) {
        artist.aliases.push(chineseName);
      }
      // 更新主要名稱為中文（如果更常見）
      if (chineseName.length > 0) {
        artist.name = chineseName;
      }
    } else {
      // 創建新藝人
      artists.set(normalizedChinese, {
        name: chineseName,
        aliases: [englishName],
        profession: [],
        relatedEvents: [eventId],
      });
    }
  }

  // 模式 3: 尋找職業關鍵字後的藝人名稱
  const professionKeywords = ['鋼琴家', '小提琴家', '指揮家', 'pianist', 'violinist', 'conductor'];
  for (const keyword of professionKeywords) {
    const keywordPattern = new RegExp(`${keyword}[：:：]?\\s*([\\u4e00-\\u9fa5]{2,}|[A-Z][a-z]+\\s+[A-Z][a-z]+)`, 'gi');
    while ((match = keywordPattern.exec(content)) !== null) {
      const name = match[1].trim();
      const normalizedName = name.toLowerCase();
      const profession = keyword.includes('鋼琴') || keyword.includes('pianist') ? '鋼琴家' :
                        keyword.includes('小提琴') || keyword.includes('violinist') ? '小提琴家' :
                        keyword.includes('指揮') || keyword.includes('conductor') ? '指揮家' : keyword;
      
      if (!artists.has(normalizedName)) {
        artists.set(normalizedName, {
          name,
          aliases: [name],
          profession: [profession],
          relatedEvents: [eventId],
        });
      } else {
        const artist = artists.get(normalizedName)!;
        if (!artist.profession.includes(profession)) {
          artist.profession.push(profession);
        }
        if (!artist.relatedEvents?.includes(eventId)) {
          artist.relatedEvents?.push(eventId);
        }
      }
    }
  }
}

/**
 * 從事件內容中提取場館資訊
 */
function extractVenuesFromEvent(
  content: string,
  eventId: string,
  venues: Map<string, Venue>
): void {
  // 尋找「場館：」或「Venue：」後的場館名稱
  const venuePattern = /場館[：:：]?\s*([^\n]+)/gi;
  let match;
  
  while ((match = venuePattern.exec(content)) !== null) {
    const venueName = match[1].trim();
    const normalizedName = venueName.toLowerCase();
    
    if (!venues.has(normalizedName)) {
      venues.set(normalizedName, {
        name: venueName,
        aliases: [venueName],
      });
    }
  }
}

/**
 * 識別查詢中的藝人
 */
export async function identifyArtist(query: string): Promise<Artist | null> {
  // 先檢查是否是場館名稱（避免將場館誤識別為藝人）
  const venueKeywords = [
    '國家音樂廳', '國家戲劇院', '兩廳院', '臺中國家歌劇院', '台中國家歌劇院',
    '衛武營', '衛武營國家藝術文化中心', '臺北表演藝術中心', '台北表演藝術中心',
    '誠品表演廳', '新莊文化藝術中心', '陽明交通大學', '高雄市音樂館'
  ];
  
  const normalizedQuery = query.trim().toLowerCase();
  const isVenue = venueKeywords.some(v => 
    normalizedQuery === v.toLowerCase() || 
    normalizedQuery.includes(v.toLowerCase()) || 
    v.toLowerCase().includes(normalizedQuery)
  );
  
  if (isVenue) {
    console.log(`[Knowledge Base] Rejecting venue name as artist: ${query}`);
    return null;
  }
  
  const kb = await initializeKnowledgeBase();
  
  // 直接匹配
  if (kb.artists.has(normalizedQuery)) {
    return kb.artists.get(normalizedQuery)!;
  }
  
  // 別名匹配
  for (const [key, artist] of kb.artists.entries()) {
    // 檢查主要名稱
    if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
      return artist;
    }
    
    // 檢查別名
    for (const alias of artist.aliases) {
      const normalizedAlias = alias.toLowerCase();
      if (normalizedAlias === normalizedQuery || 
          normalizedAlias.includes(normalizedQuery) ||
          normalizedQuery.includes(normalizedAlias)) {
        return artist;
      }
    }
  }
  
  return null;
}

/**
 * 識別查詢中的場館
 */
export async function identifyVenue(query: string): Promise<Venue | null> {
  const kb = await initializeKnowledgeBase();
  const normalizedQuery = query.trim().toLowerCase();
  
  // 直接匹配
  if (kb.venues.has(normalizedQuery)) {
    return kb.venues.get(normalizedQuery)!;
  }
  
  // 部分匹配
  for (const [key, venue] of kb.venues.entries()) {
    if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
      return venue;
    }
    
    // 檢查別名
    for (const alias of venue.aliases) {
      const normalizedAlias = alias.toLowerCase();
      if (normalizedAlias.includes(normalizedQuery) || normalizedQuery.includes(normalizedAlias)) {
        return venue;
      }
    }
  }
  
  return null;
}

/**
 * 獲取藝人的標準化名稱和職業資訊
 */
export async function getArtistInfo(query: string): Promise<{
  normalizedName: string;
  profession: string[];
  aliases: string[];
} | null> {
  const artist = await identifyArtist(query);
  if (!artist) {
    return null;
  }
  
  return {
    normalizedName: artist.name,
    profession: artist.profession,
    aliases: artist.aliases,
  };
}

