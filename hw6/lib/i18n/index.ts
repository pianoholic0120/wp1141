/**
 * 多語言支援系統
 */

export type Locale = 'zh-TW' | 'en-US';

export interface LocaleData {
  locale: Locale;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleData[] = [
  { locale: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文', flag: '🇹🇼' },
  { locale: 'en-US', name: 'English', nativeName: 'English', flag: '🇺🇸' },
];

export const DEFAULT_LOCALE: Locale = 'zh-TW';

/**
 * 語言資源
 */
export const translations = {
  'zh-TW': {
    welcome: {
      title: '🎵 歡迎來到 Opentix 音樂演出諮詢小幫手！',
      description:
        '我可以協助您：\n✓ 搜尋音樂演出資訊（藝人、場館、類型）\n✓ 查詢演出詳情（地點、主辦單位、演出時長等）\n✓ 提供 Opentix 購票連結\n✓ 回答演出相關問題\n\n請直接告訴我您想找什麼演出，或選擇下方功能！',
    },
    quickReplies: {
      popularEvents: '🎵 熱門演出',
      howToBuy: '💳 如何購票',
      refundPolicy: '📋 退票政策',
      language: '🌐 語言設定',
    },
    sections: {
      popularEvents: '熱門演出',
      howToBuy: '如何購票',
      refundPolicy: '退票政策',
      ticketPickup: '取票方式',
      memberRegistration: '會員註冊',
    },
    language: {
      title: '請選擇語言 / Please select language',
      changed: '語言已切換為 {locale}',
      current: '（目前）',
    },
    common: {
      moreInfo: '更多資訊',
      searchOnOpentix: '在 Opentix 搜尋',
      viewDetails: '查看詳情',
    },
  },
  'en-US': {
    welcome: {
      title: '🎵 Welcome to Opentix Music Event Information Assistant!',
      description:
        "I can help you with:\n✓ Search for music events (artists, venues, categories)\n✓ Query event details (venue, organizer, duration, etc.)\n✓ Provide Opentix ticket purchase links\n✓ Answer event-related questions\n\nTell me what event you're looking for, or select a function below!",
    },
    quickReplies: {
      popularEvents: '🎵 Popular Events',
      howToBuy: '💳 How to Buy',
      refundPolicy: '📋 Refund Policy',
      language: '🌐 Language',
    },
    sections: {
      popularEvents: 'Popular Events',
      howToBuy: 'How to Buy',
      refundPolicy: 'Refund Policy',
      ticketPickup: 'Ticket Pickup',
      memberRegistration: 'Member Registration',
    },
    language: {
      title: 'Please select language / 請選擇語言',
      changed: 'Language changed to {locale}',
      current: '(current)',
    },
    common: {
      moreInfo: 'More Info',
      searchOnOpentix: 'Search on Opentix',
      viewDetails: 'View Details',
    },
  },
};

export function t(locale: Locale, key: string, params?: Record<string, string>): string {
  const keys = key.split('.');
  let value: any = translations[locale];

  for (const k of keys) {
    value = value?.[k];
  }

  if (typeof value !== 'string') {
    // Fallback to zh-TW
    // @ts-ignore - dynamic key access for fallback translation
    value = keys.reduce((v, k) => v?.[k], translations[DEFAULT_LOCALE]);
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace params
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, param) => params[param] || '');
  }

  return value;
}

/**
 * 偵測語言指令
 */
export function detectLocaleCommand(text: string): Locale | null {
  const lower = text.toLowerCase().trim();

  // 繁體中文
  if (
    lower.includes('繁體中文') ||
    lower.includes('traditional chinese') ||
    lower.includes('zh-tw') ||
    lower.includes('zh_tw') ||
    lower === '中文'
  ) {
    return 'zh-TW';
  }

  // English
  if (
    lower.includes('english') ||
    lower.includes('en-us') ||
    lower.includes('en_us') ||
    lower === 'en' ||
    lower === '英文'
  ) {
    return 'en-US';
  }

  return null;
}

/**
 * 偵測語言切換觸發詞
 */
export function isLanguageSwitchTrigger(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const triggers = [
    'language',
    '語言',
    '切換語言',
    '選擇語言',
    'change language',
    'switch language',
    'select language',
    // 移除 'lang' - 太短，容易误触发（如艺人名 "Lang Lang" 郎朗）
    '語系',
  ];
  return triggers.some((t) => lower.includes(t));
}
