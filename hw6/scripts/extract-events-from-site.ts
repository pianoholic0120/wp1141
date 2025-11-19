/**
 * 從 output_site 中提取並清理事件資料
 * 提取：演出時間、表演地點、表演名稱、表演者等資訊
 */

import * as fs from 'fs';
import * as path from 'path';

interface ExtractedEvent {
  eventId: string;
  title: string;
  subtitle?: string; // 英文名稱
  category?: string;
  rating?: string; // 分級（建議年齡）
  organizer?: string;
  organizerId?: string;
  organizerContact?: string; // 主辦單位聯絡方式
  venue?: string;
  venueAddress?: string;
  description?: string;
  artists: string[];
  imageUrl?: string;
  opentixUrl: string;
  priceRange?: string;
  discountInfo?: string; // 折扣方案
  duration?: string; // 演出全長
  preShowTalk?: string; // 演前導聆
  openTime?: string; // 開放時間
  dates: Array<{
    date: Date;
    time?: string;
    venue?: string;
  }>;
  tags: string[];
  status: 'upcoming' | 'ongoing' | 'ended';
}

// 廣告關鍵字（需要過濾的內容）
const AD_KEYWORDS = [
  '早鳥優惠', '折扣', '優惠', '套票', '團票', '會員', '文化幣',
  '購票方式', '取票方式', '退換票', '退票', '換票', '手續費',
  '服務時間', '服務處', '分銷點', '超商', 'ibon', 'FamiPort',
  '臨櫃', '郵寄', '電子票', '信用卡', 'ATM', '轉帳',
  'OPENTIX APP', '開啟 APP', '最近瀏覽',
  '熱門搜尋', '收藏', '主辦專頁', '旗艦館',
];

// 場館關鍵字（用於識別場館）
const VENUE_KEYWORDS = [
  '國家音樂廳', '國家戲劇院', '兩廳院', '演奏廳',
  '衛武營', '臺中國家歌劇院', '臺北表演藝術中心',
  '新竹', '桃園', '高雄', '臺南', '苗北',
  'Legacy', 'TICC', '小巨蛋', '紅樓', '華山', '松菸',
];

/**
 * 清理文字，移除廣告和不必要的內容
 */
function cleanText(text: string): string {
  if (!text) return '';
  
  // 移除廣告相關內容
  let cleaned = text;
  AD_KEYWORDS.forEach(keyword => {
    // 移除包含廣告關鍵字的整行
    cleaned = cleaned.split('\n')
      .filter(line => !line.includes(keyword))
      .join('\n');
  });
  
  // 移除多餘的空白和換行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * 提取日期資訊
 */
function extractDates(content: string): Array<{ date: Date; time?: string; venue?: string }> {
  const dates: Array<{ date: Date; time?: string; venue?: string }> = [];
  
  // 匹配日期格式：2025年11月15日、11/15、11月15日等
  // 優先匹配更完整的格式
  const datePatterns = [
    // 2025年11月21日（五）至2025年11月23日（日）- 日期範圍
    /(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*[（(]?[週星期]?[一二三四五六日]?[）)]?)?\s*至\s*(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*[（(]?[週星期]?[一二三四五六日]?[）)]?)?/g,
    // 2025年11月15日（六）19:30
    /(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*[（(]?[週星期]?[一二三四五六日]?[）)]?)?(?:\s*(\d{1,2}):(\d{2}))?/g,
    // 2025/11/15 19:30 或 2025/11/22（六）19:30
    /(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s*[（(]?[週星期]?[一二三四五六日]?[）)]?)?(?:\s*(\d{1,2}):(\d{2}))?/g,
    // 11月15日 19:30
    /(\d{1,2})月(\d{1,2})日(?:\s*[（(]?[週星期]?[一二三四五六日]?[）)]?)?(?:\s*(\d{1,2}):(\d{2}))?/g,
    // 11/15 19:30
    /(\d{1,2})\/(\d{1,2})(?:\s*[（(]?[週星期]?[一二三四五六日]?[）)]?)?(?:\s*(\d{1,2}):(\d{2}))?/g,
  ];
  
  const currentYear = new Date().getFullYear();
  const now = new Date();
  
  datePatterns.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      try {
        // 處理日期範圍（patternIndex === 0）
        if (patternIndex === 0 && match.length >= 7) {
          // 2025年11月21日 至 2025年11月23日
          const startYear = parseInt(match[1]);
          const startMonth = parseInt(match[2]) - 1;
          const startDay = parseInt(match[3]);
          const endYear = parseInt(match[4]);
          const endMonth = parseInt(match[5]) - 1;
          const endDay = parseInt(match[6]);
          
          const startDate = new Date(startYear, startMonth, startDay);
          const endDate = new Date(endYear, endMonth, endDay);
          
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            // 生成日期範圍內的所有日期
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
              
              if (currentDate >= threeMonthsAgo) {
                dates.push({
                  date: new Date(currentDate),
                });
              }
              currentDate.setDate(currentDate.getDate() + 1);
            }
          }
          continue;
        }
        
        let year: number;
        let month: number;
        let day: number;
        let hour: number | undefined;
        let minute: number | undefined;
        
        if (patternIndex === 1) {
          // 2025年11月15日
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          day = parseInt(match[3]);
          if (match[4]) hour = parseInt(match[4]);
          if (match[5]) minute = parseInt(match[5]);
        } else if (patternIndex === 2) {
          // 2025/11/15
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          day = parseInt(match[3]);
          if (match[4]) hour = parseInt(match[4]);
          if (match[5]) minute = parseInt(match[5]);
        } else if (patternIndex === 3) {
          // 11月15日
          year = currentYear;
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          if (match[3]) hour = parseInt(match[3]);
          if (match[4]) minute = parseInt(match[4]);
        } else if (patternIndex === 4) {
          // 11/15
          year = currentYear;
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          if (match[3]) hour = parseInt(match[3]);
          if (match[4]) minute = parseInt(match[4]);
        } else {
          continue;
        }
        
        // 如果月份小於當前月份，可能是明年
        if (month < now.getMonth() && year === currentYear) {
          year = currentYear + 1;
        }
        
        const date = new Date(year, month, day, hour || 0, minute || 0);
        if (!isNaN(date.getTime())) {
          // 只保留未來的日期或最近3個月內的日期
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          
          if (date >= threeMonthsAgo) {
            dates.push({
              date,
              time: hour !== undefined && minute !== undefined ? `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` : undefined,
            });
          }
        }
      } catch (e) {
        // 忽略解析錯誤
      }
    }
  });
  
  // 去重並排序
  const uniqueDates = Array.from(
    new Map(dates.map(d => [d.date.toISOString().split('T')[0] + (d.time || ''), d])).values()
  ).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return uniqueDates;
}

/**
 * 提取場館資訊
 */
function extractVenue(content: string): { venue?: string; address?: string } {
  // 尋找場館資訊（通常在「選擇場館」或「場館地址」附近）
  // 場館可能有多個，取第一個
  const venueSection = content.match(/選擇場館\s*\n((?:[^\n]+\n?)+?)(?=\n場館地址|\n地圖|\n選擇場次|$)/);
  const addressMatch = content.match(/場館地址[：:]\s*([^\n]+)/);
  
  let venue: string | undefined;
  let address: string | undefined;
  
  if (venueSection) {
    // 提取第一個場館名稱（排除空行和「場館」標籤）
    const venueLines = venueSection[1].split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.includes('場館') && !line.includes('選擇'));
    
    if (venueLines.length > 0) {
      venue = venueLines[0];
    }
  }
  
  if (addressMatch) {
    address = addressMatch[1].trim();
  }
  
  // 如果沒有找到，嘗試從 VENUE_KEYWORDS 中匹配
  if (!venue) {
    for (const keyword of VENUE_KEYWORDS) {
      if (content.includes(keyword)) {
        // 找到最完整的場館名稱
        const fullVenueMatch = content.match(new RegExp(`(${keyword}[^\\n]*)`, 'i'));
        if (fullVenueMatch) {
          venue = fullVenueMatch[1].trim();
          break;
        }
      }
    }
  }
  
  return { venue, address };
}

/**
 * 提取表演者資訊
 */
function extractArtists(content: string): string[] {
  const artists: string[] = [];
  
  // 排除的詞（不是藝人名稱）
  const excludeWords = new Set([
    '導演', '編舞', '指揮', '鋼琴', '小提琴', '大提琴', '獨奏', '獨唱', '舞者', '演員',
    '演出者', '表演者', '主創團隊', '團隊介紹', '藝術總監', '製作人', '燈光', '服裝',
    '視覺', '音樂', '技術', '舞台', '監督', '排練', '總監', '設計', '統籌',
    '主辦', '場館', '地址', '購票', '取票', '退票', '折扣', '優惠', '套票',
    'OPENTIX', 'APP', '開啟', '收藏', '熱門', '搜尋',
  ]);
  
  // 尋找「演出者」、「表演者」、「主創團隊」等關鍵字後面的內容
  const artistSections = [
    // 主創團隊區塊
    /(?:主創團隊|團隊介紹)[：:]\s*\n((?:[^\n]+\n)+?)(?=\n\*\*|\n##|$)/g,
    // 個別角色：導演、編舞、指揮等
    /(?:導演|編舞|指揮|鋼琴|小提琴|大提琴|獨奏|獨唱|舞者|演員|女高音|男高音|女中音|男中音|低音|打擊|管樂|弦樂)[：:／/]\s*([^\n]+)/g,
    // 節目介紹中的表演者（通常在描述中）
    /(?:演出者|表演者)[：:]\s*([^\n]+)/g,
  ];
  
  artistSections.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1] || match[0];
      
      // 提取人名（中文字或英文名）
      // 英文名：首字母大寫的單詞組合
      const englishNamePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
      let nameMatch;
      while ((nameMatch = englishNamePattern.exec(text)) !== null) {
        const name = nameMatch[1].trim();
        if (name.length >= 3 && !excludeWords.has(name.toLowerCase()) && !artists.includes(name)) {
          artists.push(name);
        }
      }
      
      // 中文名：2-6 個中文字
      const chineseNamePattern = /([\u4e00-\u9fa5]{2,6})/g;
      while ((nameMatch = chineseNamePattern.exec(text)) !== null) {
        const name = nameMatch[1].trim();
        if (!excludeWords.has(name) && !artists.includes(name)) {
          // 進一步檢查：排除常見的非人名詞
          const isCommonWord = /^(演出|表演|音樂|舞蹈|戲劇|節目|活動|場館|地址|購票|取票|退票|折扣|優惠|套票|主辦|單位|時間|日期|地點|資訊|介紹|簡介|說明|講|內容|關於|詳情|詳細|更多|查看|選擇|地圖|收藏|熱門|搜尋|開啟|APP|OPENTIX)$/.test(name);
          if (!isCommonWord) {
            artists.push(name);
          }
        }
      }
    }
  });
  
  // 去重並限制數量（最多 10 個）
  return Array.from(new Set(artists)).slice(0, 10);
}

/**
 * 從 markdown 文件提取事件資訊
 */
function extractEventFromMarkdown(filePath: string, url: string): ExtractedEvent | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 提取 eventId
    const eventIdMatch = url.match(/\/event\/(\d+)/);
    if (!eventIdMatch) return null;
    const eventId = eventIdMatch[1];
    
    // 提取標題（第一個 # 標題）
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (!titleMatch) return null;
    const title = titleMatch[1].trim();
    
    // 提取副標題（第二個 ## 標題）
    const subtitleMatch = content.match(/^##\s+(.+)$/m);
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : undefined;
    
    // 提取類別
    const categoryMatch = content.match(/類別[：:]\s*([^\n]+)/);
    const category = categoryMatch ? categoryMatch[1].trim() : undefined;
    
    // 提取分級
    const ratingMatch = content.match(/分級[：:]\s*([^\n]+)/);
    const rating = ratingMatch ? ratingMatch[1].trim() : undefined;
    
    // 提取主辦單位
    const organizerMatch = content.match(/主辦[：:]\s*\n\s*([^\n]+)/);
    const organizer = organizerMatch ? organizerMatch[1].trim() : undefined;
    
    // 提取主辦單位 ID
    const organizerIdMatch = content.match(/主辦專頁.*\/o\/(\d+)/);
    const organizerId = organizerIdMatch ? organizerIdMatch[1] : undefined;
    
    // 提取場館資訊
    const { venue, address } = extractVenue(content);
    
    // 提取描述（節目介紹部分）
    const descriptionMatch = content.match(/##\s*節目介紹\s*\n\s*([\s\S]+?)(?=\n##|\n\*\*|$)/);
    let description = descriptionMatch ? descriptionMatch[1].trim() : undefined;
    if (description) {
      // 清理描述：移除多餘的空白和換行，但保留段落結構
      description = description
        .replace(/\n{3,}/g, '\n\n') // 多個換行變成兩個
        .replace(/[^\S\n]+/g, ' ') // 多個空格變成一個
        .trim();
    }
    
    // 提取折扣方案
    const discountMatch = content.match(/##\s*折扣方案\s*\n\s*([\s\S]+?)(?=\n##|\n\*\*|$)/);
    let discountInfo = discountMatch ? discountMatch[1].trim() : undefined;
    if (discountInfo) {
      // 清理折扣方案：移除「溫馨提醒」等廣告內容
      discountInfo = discountInfo
        .split('\n')
        .filter(line => {
          const lower = line.toLowerCase();
          return !lower.includes('溫馨提醒') && 
                 !lower.includes('憑票券') && 
                 !lower.includes('領取') && 
                 !lower.includes('好禮');
        })
        .join('\n')
        .trim();
    }
    
    // 提取演出全長
    const durationMatch = content.match(/演出全長[：:]\s*([^\n]+)/);
    const duration = durationMatch ? durationMatch[1].trim() : undefined;
    
    // 提取演前導聆
    const preShowTalkMatch = content.match(/演前導聆[：:]\s*([^\n]+)/);
    const preShowTalk = preShowTalkMatch ? preShowTalkMatch[1].trim() : undefined;
    
    // 提取開放時間
    const openTimeMatch = content.match(/開放時間[：:]\s*([^\n]+)/);
    const openTime = openTimeMatch ? openTimeMatch[1].trim() : undefined;
    
    // 提取主辦單位聯絡方式（電話等）
    const organizerContactMatch = content.match(/主辦[：:]\s*\n\s*[^\n]+\s*\(([^)]+)\)/);
    const organizerContact = organizerContactMatch ? organizerContactMatch[1].trim() : undefined;
    
    // 提取表演者
    let artists = extractArtists(content);
    
    // 如果沒有提取到表演者，嘗試從描述中提取（通常在節目介紹中）
    if (artists.length === 0 && description) {
      // 從描述中提取英文名（首字母大寫的單詞組合）
      const englishNames = description.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g);
      if (englishNames) {
        artists = englishNames
          .filter(name => name.length >= 3)
          .slice(0, 5);
      }
    }
    
    // 提取圖片 URL
    const imageMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/);
    const imageUrl = imageMatch ? imageMatch[1] : undefined;
    
    // 提取票價範圍
    const priceMatch = content.match(/票價[：:]\s*([^\n]+)/);
    const priceRange = priceMatch ? priceMatch[1].trim() : undefined;
    
    // 提取日期
    const dates = extractDates(content);
    
    // 提取標籤（從標題和描述中提取關鍵字）
    const tags: string[] = [];
    if (category) tags.push(category);
    if (venue) tags.push(venue);
    
    // 判斷狀態
    const now = new Date();
    const earliestDate = dates.length > 0 ? dates[0].date : null;
    const latestDate = dates.length > 0 ? dates[dates.length - 1].date : null;
    let status: 'upcoming' | 'ongoing' | 'ended' = 'upcoming';
    if (latestDate && latestDate < now) {
      status = 'ended';
    } else if (earliestDate && earliestDate <= now && latestDate && latestDate >= now) {
      status = 'ongoing';
    }
    
    return {
      eventId,
      title,
      subtitle,
      category,
      rating,
      organizer,
      organizerId,
      organizerContact,
      venue,
      venueAddress: address,
      description,
      artists,
      imageUrl,
      opentixUrl: url,
      priceRange,
      discountInfo,
      duration,
      preShowTalk,
      openTime,
      dates,
      tags,
      status,
    };
  } catch (error) {
    console.error(`Error extracting event from ${filePath}:`, error);
    return null;
  }
}

/**
 * 主函數：處理所有 event 文件
 */
async function main() {
  const outputSiteDir = path.join(__dirname, '../output_site');
  const pagesDir = path.join(outputSiteDir, 'pages');
  const structureFile = path.join(outputSiteDir, 'site_structure.json');
  
  // 讀取結構文件
  const structure = JSON.parse(fs.readFileSync(structureFile, 'utf-8'));
  
  const events: ExtractedEvent[] = [];
  
  // 遍歷所有 event 路徑
  for (const [pathKey, entries] of Object.entries(structure)) {
    if (pathKey.startsWith('/event/')) {
      for (const entry of entries) {
        if (entry.file && entry.file.startsWith('event_')) {
          const filePath = path.join(pagesDir, entry.file);
          if (fs.existsSync(filePath)) {
            const event = extractEventFromMarkdown(filePath, entry.url);
            if (event) {
              events.push(event);
              console.log(`Extracted: ${event.title} (${event.eventId})`);
            }
          }
        }
      }
    }
  }
  
  // 保存提取的資料
  const outputFile = path.join(__dirname, '../data/extracted-events.json');
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(events, null, 2), 'utf-8');
  
  console.log(`\nExtracted ${events.length} events`);
  console.log(`Saved to ${outputFile}`);
  
  return events;
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch(console.error);
}

export { extractEventFromMarkdown, ExtractedEvent };

