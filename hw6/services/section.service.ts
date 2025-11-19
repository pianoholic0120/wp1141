/**
 * 章節系統服務
 * 處理不同章節的回覆內容
 */

import { Locale, t } from '@/lib/i18n';
import {
  getPurchaseGuideResponse,
  getRefundPolicyResponse,
  getTicketPickupResponse,
  getMemberRegistrationResponse,
} from './faq.service';
import { getPopularEvents } from './event.service';
import { buildPopularEventsFlexMessage } from '@/lib/line/templates';

export type SectionKey =
  | 'popularEvents'
  | 'howToBuy'
  | 'refundPolicy'
  | 'ticketPickup'
  | 'memberRegistration';

export interface SectionResponse {
  text?: string;
  flexMessage?: any;
  hasCarousel?: boolean;
}

/**
 * 章節關鍵字映射
 */
const sectionKeywords: Record<SectionKey, string[]> = {
  popularEvents: ['熱門演出', 'popular events', '熱門', 'popular'],
  howToBuy: ['如何購票', 'how to buy', '購票流程', 'purchase guide', '購票', 'buy tickets'],
  refundPolicy: ['退票政策', 'refund policy', '退票', 'refund', '退款'],
  ticketPickup: ['取票方式', 'ticket pickup', '取票', 'pickup', '領票'],
  memberRegistration: ['會員註冊', 'member registration', '註冊', 'register', '會員'],
};

/**
 * 偵測訊息是否命中章節
 */
export function detectSection(text: string): SectionKey | null {
  // 移除 emoji 和特殊字符，只保留文字內容
  const cleaned = text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // 移除 emoji
    .replace(/[🎵📅💳📋🌐❓🔍]/g, '') // 移除特定 emoji
    .trim();
  const lower = cleaned.toLowerCase();

  for (const [section, keywords] of Object.entries(sectionKeywords)) {
    if (keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return section as SectionKey;
    }
  }

  return null;
}

/**
 * 取得章節回覆內容
 */
export async function getSectionResponse(
  section: SectionKey,
  locale: Locale
): Promise<SectionResponse> {
  switch (section) {
    case 'popularEvents': {
      // 熱門演出：文字 + Carousel
      let events: any[] = [];
      try {
        events = await getPopularEvents(10);
      } catch (error) {
        // 降級：即使資料庫失敗，仍回傳空的 Carousel（讓使用者知道功能存在）
        console.warn('Failed to get popular events from DB, using empty carousel:', error);
      }

      const flexMessage = buildPopularEventsFlexMessage(events, locale);
      const sectionName = t(locale, `sections.${section}`);
      
      console.log(`[Section Response] Locale: ${locale}, Section: ${section}, SectionName: ${sectionName}`);

      return {
        text: locale === 'zh-TW' ? `以下是${sectionName}：` : `Here are the ${sectionName}:`,
        flexMessage,
        hasCarousel: true,
      };
    }

    case 'howToBuy': {
      const response = getPurchaseGuideResponse(locale);
      return { text: response.text };
    }

    case 'refundPolicy': {
      const response = getRefundPolicyResponse(locale);
      return { text: response.text };
    }

    case 'ticketPickup': {
      const response = getTicketPickupResponse(locale);
      return { text: response.text };
    }

    case 'memberRegistration': {
      const response = getMemberRegistrationResponse(locale);
      return { text: response.text };
    }

    default:
      return { text: '' };
  }
}
