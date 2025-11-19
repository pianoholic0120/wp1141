/**
 * 回應建構服務
 * 根據資料庫查詢結果，直接生成結構化回覆，減少 LLM 調用
 */

import { Locale } from '@/lib/i18n';
import { SearchEventsResult } from './event.service';

export interface StructuredResponse {
  text: string;
  useLLM: boolean; // 是否需要 LLM 進一步處理
  events?: any[];
  queryType?: string;
}

/**
 * 根據查詢類型和結果生成結構化回覆
 */
export function buildStructuredResponse(
  parsedQuery: { queryType: string; originalQuery: string; artists?: string[]; venues?: string[]; categories?: string[] },
  searchResult: SearchEventsResult,
  locale: Locale = 'zh-TW'
): StructuredResponse {
  const { queryType, originalQuery } = parsedQuery;
  const { events, total } = searchResult;

  // 如果有明確結果，直接生成回覆，不需要 LLM
  if (total > 0 && events.length > 0) {
    return buildDirectResponse(queryType, originalQuery, events, locale, parsedQuery);
  }

  // 沒有結果時，也需要 LLM 來生成友好的回覆
  return {
    text: '',
    useLLM: true,
    events: [],
    queryType,
  };
}

/**
 * 直接生成回覆（不需要 LLM）
 * 改進：使用更自然的語言，避免機械化
 */
function buildDirectResponse(
  queryType: string,
  originalQuery: string,
  events: any[],
  locale: Locale,
  parsedQuery?: { artists?: string[]; venues?: string[]; categories?: string[] }
): StructuredResponse {
  const isZh = locale === 'zh-TW';

  // 提取查詢中的關鍵字（藝人名稱、場館名稱等）
  // 注意：對於 general 查詢，不要提取關鍵字，直接使用原始查詢或更自然的表達
  let keyword = originalQuery;
  let intro = '';
  
  if (queryType === 'artist') {
    // 從查詢中提取藝人名稱（更智能的提取）
    // 先嘗試從 parsedQuery 中獲取已提取的藝人名稱
    if (parsedQuery?.artists && parsedQuery.artists.length > 0) {
      keyword = parsedQuery.artists[0];
      // 檢查提取的關鍵字是否太短或太常見（如「日本」），如果是，使用更自然的表達
      const isTooShortOrCommon = keyword.length <= 2 || 
                                 ['日本', '中國', '台灣', '美國', '英國', '法國', '德國', '韓國'].includes(keyword);
      if (isTooShortOrCommon) {
        intro = isZh
          ? `相關演出：`
          : `Related events:`;
      } else {
        // 更自然的表達方式，不要添加職業資訊（LLM會自行處理）
        intro = isZh
          ? `找到了${keyword}的演出：`
          : `Found events for ${keyword}:`;
      }
    } else {
      // 如果沒有，使用更自然的表達，不要提取部分關鍵字
      intro = isZh
        ? `相關演出：`
        : `Related events:`;
    }
  } else if (queryType === 'venue' && parsedQuery?.venues && parsedQuery.venues.length > 0) {
    keyword = parsedQuery.venues[0];
    intro = isZh
      ? `在 ${keyword} 的演出：`
      : `Events at ${keyword}:`;
  } else if (queryType === 'category' && parsedQuery?.categories && parsedQuery.categories.length > 0) {
    keyword = parsedQuery.categories[0];
    intro = isZh
      ? `${keyword} 類型的演出：`
      : `${keyword} events:`;
  } else if (queryType === 'date') {
    // 日期查詢：顯示日期範圍
    intro = isZh
      ? `在指定日期範圍內的演出：`
      : `Events in the specified date range:`;
  } else {
    // general 查詢：使用更自然的表達，不要提取關鍵字
    intro = isZh
      ? `相關演出：`
      : `Related events:`;
  }

  let responseText = `${intro}\n\n`;

  events.slice(0, 5).forEach((event, idx) => {
    responseText += `${idx + 1}. ${event.title}\n`;
    if (event.subtitle) {
      responseText += `   ${event.subtitle}\n`;
    }
    // 清理後的演出者資訊（已經在 formatEventForDisplay 中處理）
    if (event.artists && event.artists.length > 0 && event.artists[0] !== event.title) {
      const artistsText = isZh ? '演出者' : 'Artists';
      // 只顯示前 3 個演出者，避免過長
      const displayArtists = event.artists.slice(0, 3);
      responseText += `   ${artistsText}: ${displayArtists.join(', ')}${event.artists.length > 3 ? '...' : ''}\n`;
    }
    if (event.venue) {
      const venueText = isZh ? '場館' : 'Venue';
      responseText += `   ${venueText}: ${event.venue}\n`;
    }
    if (event.category) {
      const categoryText = isZh ? '類型' : 'Category';
      responseText += `   ${categoryText}: ${event.category}\n`;
    }
    if (event.rating) {
      const ratingText = isZh ? '分級' : 'Rating';
      responseText += `   ${ratingText}: ${event.rating}\n`;
    }
    if (event.organizer) {
      const organizerText = isZh ? '主辦單位' : 'Organizer';
      responseText += `   ${organizerText}: ${event.organizer}${event.organizerContact ? ` (${event.organizerContact})` : ''}\n`;
    }
    if (event.duration) {
      const durationText = isZh ? '演出全長' : 'Duration';
      responseText += `   ${durationText}: ${event.duration}\n`;
    }
    if (event.preShowTalk) {
      const preShowTalkText = isZh ? '演前導聆' : 'Pre-show Talk';
      responseText += `   ${preShowTalkText}: ${event.preShowTalk}\n`;
    }
    if (event.openTime) {
      const openTimeText = isZh ? '開放時間' : 'Open Time';
      responseText += `   ${openTimeText}: ${event.openTime}\n`;
    }
    if (event.discountInfo) {
      const discountText = isZh ? '折扣方案' : 'Discount';
      // 只顯示前 200 個字符，避免過長
      const discountPreview = event.discountInfo.length > 200 
        ? event.discountInfo.substring(0, 200) + '...'
        : event.discountInfo;
      responseText += `   ${discountText}: ${discountPreview}\n`;
    }
    // 注意：不顯示演出日期和時間，因為爬蟲無法取得準確的場次時間和剩餘票數
    // 這些資訊需要使用者前往購票頁面查看
    responseText += `   購票: ${event.opentixUrl}\n\n`;
  });

  return {
    text: responseText.trim(),
    useLLM: false, // 直接回覆，不需要 LLM
    events,
    queryType,
  };
}

