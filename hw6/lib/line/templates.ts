import { Locale, t, SUPPORTED_LOCALES } from '@/lib/i18n';

export function textMessage(text: string) {
  return { type: 'text' as const, text };
}

/**
 * 建立歡迎訊息（多語言）
 */
export function buildWelcomeMessage(locale: Locale) {
  const title = t(locale, 'welcome.title');
  const description = t(locale, 'welcome.description');
  return {
    type: 'text' as const,
    text: `${title}\n\n${description}`,
    quickReply: buildQuickReplies(locale),
  };
}

/**
 * 建立 Quick Replies（多語言）- 主選單
 */
export function buildQuickReplies(locale: Locale) {
  const isZh = locale === 'zh-TW';
  return {
    items: [
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: isZh ? '🔍 搜尋' : '🔍 Search',
          text: isZh ? '搜尋' : 'Search',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: t(locale, 'quickReplies.popularEvents'),
          text: t(locale, 'quickReplies.popularEvents'),
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: isZh ? '⭐ 我的收藏' : '⭐ My Favorites',
          text: isZh ? '我的收藏' : 'My Favorites',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: t(locale, 'quickReplies.howToBuy'),
          text: t(locale, 'quickReplies.howToBuy'),
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: t(locale, 'quickReplies.refundPolicy'),
          text: t(locale, 'quickReplies.refundPolicy'),
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: t(locale, 'quickReplies.language'),
          text: t(locale, 'quickReplies.language'),
        },
      },
    ],
  };
}

/**
 * 建立搜尋相關的 Quick Reply（優化使用流程）
 */
export function buildSearchQuickReply(locale: Locale) {
  const popularEventsLabel = t(locale, 'quickReplies.popularEvents');
  const howToBuyLabel = t(locale, 'quickReplies.howToBuy');
  
  return {
    items: [
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '🔍 搜尋其他演出' : '🔍 Search More',
          text: locale === 'zh-TW' ? '搜尋' : 'Search',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: popularEventsLabel,
          text: popularEventsLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'uri' as const,
          label: locale === 'zh-TW' ? '🌐 前往 Opentix' : '🌐 Go to Opentix',
          uri: 'https://www.opentix.life/',
        } as any,
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: howToBuyLabel,
          text: howToBuyLabel,
        },
      },
    ],
  };
}

/**
 * 建立語言選擇訊息
 */
export function buildLocaleSelectionMessage(currentLocale: Locale) {
  const title = t(currentLocale, 'language.title');
  const current = t(currentLocale, 'language.current');

  return {
    type: 'text' as const,
    text: title,
    quickReply: {
      items: SUPPORTED_LOCALES.map((locale) => {
        // 縮短文字以避免截斷：只顯示旗幟和語言名稱，當前語言用 ✓ 標記（更短）
        // LINE quick reply 標籤最多 20 個字符
        const labelText = locale.locale === 'en-US' 
          ? (locale.locale === currentLocale ? `${locale.flag} English ✓` : `${locale.flag} English`)
          : (locale.locale === currentLocale ? `${locale.flag} 繁體中文 ✓` : `${locale.flag} 繁體中文`);
        return {
        type: 'action' as const,
        action: {
          type: 'message' as const,
            label: labelText,
          text: locale.nativeName,
        },
        };
      }),
    },
  };
}

/**
 * 建立幫助選單（多語言）
 */
export function buildHelpMessage(locale: Locale) {
  const helpText =
    locale === 'zh-TW'
      ? '我可以這樣幫你，請選擇一個項目，或直接輸入你的問題：'
      : 'How can I help you? Please select an option or type your question:';

  return {
    type: 'text' as const,
    text: helpText,
    quickReply: buildQuickReplies(locale),
  };
}

export function buildPopularEventsFlexMessage(events: any[], locale: Locale = 'zh-TW') {
  const altText = locale === 'zh-TW' ? '熱門演出推薦' : 'Popular Events';
  const titleText = locale === 'zh-TW' ? '熱門演出推薦' : 'Popular Events';
  
  if (!events || events.length === 0) {
    return {
      type: 'flex' as const,
      altText,
      contents: {
        type: 'carousel',
        contents: [
          {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: titleText,
                  weight: 'bold',
                  size: 'lg',
                },
                {
                  type: 'text',
                  text: locale === 'zh-TW' 
                    ? '目前沒有找到熱門演出，請到 Opentix 官網查看最新資訊'
                    : 'No popular events found. Please visit Opentix website for the latest information',
                  size: 'sm',
                  color: '#888888',
                  wrap: true,
                },
              ],
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              spacing: 'sm',
              contents: [
                {
                  type: 'button',
                  style: 'primary',
                  height: 'sm',
                  action: {
                    type: 'uri',
                    label: locale === 'zh-TW' ? '前往 Opentix' : 'Visit Opentix',
                    uri: 'https://www.opentix.life/',
                  },
                },
              ],
              flex: 0,
            },
          },
        ],
      },
    };
  }

  // 驗證圖片 URL 是否有效（Line 要求圖片 URL 必須是 HTTPS 且可公開訪問）
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    // 檢查是否是 HTTPS URL
    if (!url.startsWith('https://')) return false;
    // 排除可能無效的 URL（如 AWS S3 簽名 URL 或需要認證的 URL）
    if (url.includes('?X-Amz-') || url.includes('?Signature=') || url.includes('?AWSAccessKeyId=')) {
      return false;
    }
    return true;
  };
  
  const defaultImageUrl = 'https://www.opentix.life/assets/opentix_og.jpg';
  
  const bubbles = events.slice(0, 10).map((event) => ({
    type: 'bubble' as const,
    hero: {
      type: 'image' as const,
      url: isValidImageUrl(event.imageUrl) ? event.imageUrl! : defaultImageUrl,
      size: 'full' as const,
      aspectRatio: '16:9' as const,
      aspectMode: 'cover' as const,
    },
    body: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [
        {
          type: 'text' as const,
          text: event.title || '演出',
          weight: 'bold' as const,
          size: 'lg' as const,
          wrap: true,
        },
        ...(event.subtitle
          ? [
              {
                type: 'text' as const,
                text: event.subtitle,
                size: 'sm' as const,
                color: '#666666' as const,
                wrap: true,
              },
            ]
          : []),
        ...(event.artists && event.artists.length > 0
          ? [
              {
                type: 'text' as const,
                text: locale === 'zh-TW' 
                  ? `演出者：${event.artists.slice(0, 3).join(', ')}${event.artists.length > 3 ? '...' : ''}`
                  : `Artists: ${event.artists.slice(0, 3).join(', ')}${event.artists.length > 3 ? '...' : ''}`,
                size: 'xs' as const,
                color: '#888888' as const,
                wrap: true,
              },
            ]
          : []),
        ...(event.venue
          ? [
              {
                type: 'text' as const,
                text: locale === 'zh-TW' ? `場館：${event.venue}` : `Venue: ${event.venue}`,
                size: 'xs' as const,
                color: '#888888' as const,
                wrap: true,
              },
            ]
          : []),
        ...(event.category
          ? [
              {
                type: 'text' as const,
                text: locale === 'zh-TW' ? `類別：${event.category}` : `Category: ${event.category}`,
                size: 'xs' as const,
                color: '#888888' as const,
              },
            ]
          : []),
      ],
    },
    footer: {
      type: 'box' as const,
      layout: 'vertical' as const,
      spacing: 'sm' as const,
      contents: [
        {
          type: 'button' as const,
          style: 'primary' as const,
          height: 'sm' as const,
          action: {
            type: 'uri' as const,
            label: locale === 'zh-TW' ? '查看詳情' : 'View Details',
            uri: event.opentixUrl || 'https://www.opentix.life/',
          },
        },
        ...(event.eventId || event._id
          ? [
              {
                type: 'button' as const,
                style: 'secondary' as const,
                height: 'sm' as const,
                action: {
                  type: 'message' as const,
                  label: locale === 'zh-TW' ? '⭐ 加入收藏' : '⭐ Add to Favorites',
                  text: locale === 'zh-TW' 
                    ? `收藏:${event.eventId || event._id?.toString() || ''}`
                    : `Favorite:${event.eventId || event._id?.toString() || ''}`,
                },
              },
            ]
          : []),
      ],
      flex: 0,
    },
  }));

  return {
    type: 'flex' as const,
    altText,
    contents: {
      type: 'carousel' as const,
      contents: bubbles,
    },
  };
}

export function sampleConcertFlexMessage() {
  return buildPopularEventsFlexMessage([]);
}

/**
 * 建立 Buttons Template（用於快速操作）
 */
export function buildButtonsTemplate(
  text: string,
  actions: Array<{ label: string; text?: string; uri?: string }>,
  locale: Locale = 'zh-TW'
) {
  const buttonActions = actions.map((action) => {
    if (action.uri) {
      return {
        type: 'uri' as const,
        label: action.label,
        uri: action.uri,
      };
    } else {
      return {
        type: 'message' as const,
        label: action.label,
        text: action.text || action.label,
      };
    }
  });

  return {
    type: 'template' as const,
    altText: text,
    template: {
      type: 'buttons' as const,
      text: text,
      actions: buttonActions,
    },
  };
}

/**
 * 建立搜尋結果後的 Quick Reply（提供相關操作）- 優化流程
 */
export function buildSearchResultQuickReply(locale: Locale) {
  // 使用 t() 函數取得翻譯字串，確保返回的是字串
  const popularEventsLabel = t(locale, 'quickReplies.popularEvents');
  const howToBuyLabel = t(locale, 'quickReplies.howToBuy');
  
  return {
    items: [
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '🔍 搜尋其他' : '🔍 Search More',
          text: locale === 'zh-TW' ? '搜尋' : 'Search',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: popularEventsLabel,
          text: popularEventsLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'uri' as const,
          label: locale === 'zh-TW' ? '🌐 前往 Opentix' : '🌐 Go to Opentix',
          uri: 'https://www.opentix.life/',
        } as any,
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '🏠 回到主畫面' : '🏠 Main Menu',
          text: locale === 'zh-TW' ? '幫助' : 'help',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: howToBuyLabel,
          text: howToBuyLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '❓ 幫助' : '❓ Help',
          text: locale === 'zh-TW' ? '幫助' : 'help',
        },
      },
    ],
  };
}

/**
 * 建立無搜尋結果時的 Quick Reply（提供熱門搜尋建議）
 */
export function buildNoResultSearchSuggestions(locale: Locale) {
  // 熱門類型/藝人/場館搜尋建議
  const suggestions = locale === 'zh-TW' 
    ? [
        { label: '🎻 室內樂', text: '室內樂' },
        { label: '🎵 Eric Lu', text: 'Eric Lu' },
        { label: '🏛️ 衛武營', text: '衛武營' },
        { label: '🎭 國家音樂廳', text: '國家音樂廳' },
        { label: '🎪 熱門演出', text: t(locale, 'quickReplies.popularEvents') },
        { label: '🏠 回到主畫面', text: '幫助' },
      ]
    : [
        { label: '🎻 Chamber Music', text: 'Chamber Music' },
        { label: '🎵 Eric Lu', text: 'Eric Lu' },
        { label: '🏛️ Weiwuying', text: 'Weiwuying' },
        { label: '🎭 Concert Hall', text: 'National Concert Hall' },
        { label: '🎪 Popular Events', text: t(locale, 'quickReplies.popularEvents') },
        { label: '🏠 Main Menu', text: 'help' },
      ];
  
  return {
    items: suggestions.map(suggestion => ({
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: suggestion.label,
        text: suggestion.text,
      },
    })),
  };
}

/**
 * 建立購票相關 FAQ 的 Quick Reply
 */
export function buildPurchaseFAQQuickReply(locale: Locale) {
  const refundLabel = t(locale, 'quickReplies.refundPolicy');
  const popularEventsLabel = t(locale, 'quickReplies.popularEvents');
  
  return {
    items: [
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '🎫 取票方式' : '🎫 Ticket Pickup',
          text: locale === 'zh-TW' ? '取票方式' : 'Ticket Pickup',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: refundLabel,
          text: refundLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: popularEventsLabel,
          text: popularEventsLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'uri' as const,
          label: locale === 'zh-TW' ? '🌐 前往 Opentix' : '🌐 Go to Opentix',
          uri: 'https://www.opentix.life/',
        } as any,
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '❓ 幫助' : '❓ Help',
          text: locale === 'zh-TW' ? '幫助' : 'help',
        },
      },
    ],
  };
}

/**
 * 建立退票相關 FAQ 的 Quick Reply
 */
export function buildRefundFAQQuickReply(locale: Locale) {
  const howToBuyLabel = t(locale, 'quickReplies.howToBuy');
  const popularEventsLabel = t(locale, 'quickReplies.popularEvents');
  
  return {
    items: [
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: howToBuyLabel,
          text: howToBuyLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '🎫 取票方式' : '🎫 Ticket Pickup',
          text: locale === 'zh-TW' ? '取票方式' : 'Ticket Pickup',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: popularEventsLabel,
          text: popularEventsLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'uri' as const,
          label: locale === 'zh-TW' ? '🌐 前往 Opentix' : '🌐 Go to Opentix',
          uri: 'https://www.opentix.life/',
        } as any,
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '❓ 幫助' : '❓ Help',
          text: locale === 'zh-TW' ? '幫助' : 'help',
        },
      },
    ],
  };
}

/**
 * 建立單一事件查詢的 Quick Reply（提供詳細資訊查詢選項）
 */
export function buildSingleEventQuickReply(locale: Locale, eventTitle?: string, eventUrl?: string, eventId?: string) {
  const isZh = locale === 'zh-TW';
  
  // 使用事件 URL，如果沒有則使用首頁
  const ticketUrl = eventUrl || 'https://www.opentix.life/';
  
  const items: any[] = [
    {
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: isZh ? '⏰ 演出時間' : '⏰ Show Time',
        // 使用「這個表演」而不是完整標題，避免觸發新的搜尋
        text: isZh ? '這個表演的演出時間是什麼時候' : "What is this event's show time",
      },
    },
    {
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: isZh ? '👤 演出者' : '👤 Performers',
        text: isZh ? '這個表演的演出者是誰' : 'Who are the performers of this event',
      },
    },
    {
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: isZh ? '💰 票價' : '💰 Ticket Price',
        text: isZh ? '這個表演的票價是多少' : "What is this event's ticket price",
      },
    },
    {
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: isZh ? '📍 地點' : '📍 Location',
        text: isZh ? '這個表演在哪裡演出' : 'Where is this event performed',
      },
    },
  ];
  
  // 如果有eventId，添加收藏按鈕（根據語言使用不同命令）
  if (eventId) {
    items.push({
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: isZh ? '⭐ 收藏演出' : '⭐ Add Favorite',
        text: isZh ? `收藏:${eventId}` : `Favorite:${eventId}`,
      },
    });
  }
  
  items.push(
    {
      type: 'action' as const,
      action: {
        type: 'uri' as const,
        label: isZh ? '🎫 立即購票' : '🎫 Buy Tickets',
        uri: ticketUrl,
      } as any,
    },
    {
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: isZh ? '🏠 回到主畫面' : '🏠 Main Menu',
        text: isZh ? '幫助' : 'help',
      },
    }
  );
  
  return { items };
}

/**
 * 建立取票相關 FAQ 的 Quick Reply
 */
export function buildTicketPickupFAQQuickReply(locale: Locale) {
  const howToBuyLabel = t(locale, 'quickReplies.howToBuy');
  const refundLabel = t(locale, 'quickReplies.refundPolicy');
  const popularEventsLabel = t(locale, 'quickReplies.popularEvents');
  
  return {
    items: [
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: howToBuyLabel,
          text: howToBuyLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: refundLabel,
          text: refundLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: popularEventsLabel,
          text: popularEventsLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'uri' as const,
          label: locale === 'zh-TW' ? '🌐 前往 Opentix' : '🌐 Go to Opentix',
          uri: 'https://www.opentix.life/',
        } as any,
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '❓ 幫助' : '❓ Help',
          text: locale === 'zh-TW' ? '幫助' : 'help',
        },
      },
    ],
  };
}

/**
 * 建立會員註冊相關 FAQ 的 Quick Reply
 */
export function buildMemberRegistrationFAQQuickReply(locale: Locale) {
  const howToBuyLabel = t(locale, 'quickReplies.howToBuy');
  const popularEventsLabel = t(locale, 'quickReplies.popularEvents');
  
  return {
    items: [
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: howToBuyLabel,
          text: howToBuyLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: popularEventsLabel,
          text: popularEventsLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'uri' as const,
          label: locale === 'zh-TW' ? '🌐 前往 Opentix' : '🌐 Go to Opentix',
          uri: 'https://www.opentix.life/',
        } as any,
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '🔍 搜尋演出' : '🔍 Search Events',
          text: locale === 'zh-TW' ? '搜尋' : 'Search',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '❓ 幫助' : '❓ Help',
          text: locale === 'zh-TW' ? '幫助' : 'help',
        },
      },
    ],
  };
}

/**
 * 建立熱門演出後的 Quick Reply
 */
export function buildPopularEventsQuickReply(locale: Locale) {
  const howToBuyLabel = t(locale, 'quickReplies.howToBuy');
  
  return {
    items: [
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '🔍 搜尋演出' : '🔍 Search Events',
          text: locale === 'zh-TW' ? '搜尋' : 'Search',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: howToBuyLabel,
          text: howToBuyLabel,
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'uri' as const,
          label: locale === 'zh-TW' ? '🌐 前往 Opentix' : '🌐 Go to Opentix',
          uri: 'https://www.opentix.life/',
        } as any,
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: locale === 'zh-TW' ? '❓ 幫助' : '❓ Help',
          text: locale === 'zh-TW' ? '幫助' : 'help',
        },
      },
    ],
  };
}

/**
 * 建立場館搜尋結果後的 Quick Reply
 */
export function buildVenueSearchQuickReply(locale: Locale, venueName?: string) {
  const popularEventsLabel = t(locale, 'quickReplies.popularEvents');
  
  // 其他常見場館
  const otherVenues = locale === 'zh-TW'
    ? ['國家音樂廳', '兩廳院', '臺北表演藝術中心', '臺中國家歌劇院']
    : ['National Concert Hall', 'NTCH', 'Taipei Performing Arts Center', 'Taichung National Theater'];
  
  // 如果當前搜尋的場館在列表中，移除它
  const filteredVenues = venueName 
    ? otherVenues.filter(v => !v.includes(venueName) && !venueName.includes(v))
    : otherVenues;
  
  const items = [
    {
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: locale === 'zh-TW' ? '🔍 搜尋其他' : '🔍 Search More',
        text: locale === 'zh-TW' ? '搜尋' : 'Search',
      },
    },
    {
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: popularEventsLabel,
        text: popularEventsLabel,
      },
    },
  ];
  
  // 添加其他場館選項（最多 3 個）
  filteredVenues.slice(0, 3).forEach(venue => {
    items.push({
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: `🏛️ ${venue}`,
        text: venue,
      },
    });
  });
  
  return { items };
}

/**
 * 建立搜尋引導的 Quick Reply（幫助用戶選擇搜尋方式）
 */
export function buildSearchGuideQuickReply(locale: Locale) {
  const isZh = locale === 'zh-TW';
  
  return {
    items: [
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: isZh ? '🎭 演出全名' : '🎭 Full Title',
          text: isZh ? '🎭 我想用演出全名搜尋' : '🎭 Search by full title',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: isZh ? '👤 藝人名稱' : '👤 Artist Name',
          text: isZh ? '👤 我想用藝人名稱搜尋' : '👤 Search by artist',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: isZh ? '🏛️ 場館名稱' : '🏛️ Venue',
          text: isZh ? '🏛️ 我想用場館名稱搜尋' : '🏛️ Search by venue',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: isZh ? '🎵 演出類型' : '🎵 Category',
          text: isZh ? '🎵 我想用演出類型搜尋' : '🎵 Search by category',
        },
      },
      {
        type: 'action' as const,
        action: {
          type: 'message' as const,
          label: isZh ? '🔙 返回主選單' : '🔙 Main Menu',
          text: isZh ? '主選單' : 'Main Menu',
        },
      },
    ],
  };
}

/**
 * 建立具體搜尋建議的 Quick Reply（根據選擇的搜尋類型）
 */
export function buildSearchTypeGuideQuickReply(locale: Locale, searchType: 'title' | 'artist' | 'venue' | 'category') {
  const isZh = locale === 'zh-TW';
  
  const guides = {
    title: {
      message: isZh 
        ? '📝 請輸入完整的演出名稱\n\n💡 範例：\n• 水火交融－黎卓宇2026鋼琴獨奏會\n• 魏德曼與NSO《跨樂自由的邊界》\n• 【2025誠品室內樂節10週年】'
        : '📝 Please enter the full event title\n\n💡 Examples:\n• George Li 2026 Piano Recital\n• Jörg Widmann & NSO',
      suggestions: isZh 
        ? ['水火交融－黎卓宇2026鋼琴獨奏會', '魏德曼與NSO', '【2025誠品室內樂節10週年】', '🔙 重新選擇']
        : ['George Li 2026 Piano Recital', 'Jörg Widmann & NSO', '🔙 Choose Again']
    },
    artist: {
      message: isZh
        ? '👤 請輸入藝人名稱\n\n💡 範例：\n• 陸逸軒\n• 魏德曼\n• 黎卓宇'
        : '👤 Please enter artist name\n\n💡 Examples:\n• Eric Lu\n• Jörg Widmann\n• George Li',
      suggestions: isZh
        ? ['陸逸軒', '魏德曼', '黎卓宇', '🔙 重新選擇']
        : ['Eric Lu', 'Jörg Widmann', 'George Li', '🔙 Choose Again']
    },
    venue: {
      message: isZh
        ? '🏛️ 請輸入場館名稱\n\n💡 範例：\n• 國家音樂廳\n• 衛武營\n• 臺中國家歌劇院'
        : '🏛️ Please enter venue name\n\n💡 Examples:\n• National Concert Hall\n• Weiwuying\n• National Taichung Theater',
      suggestions: isZh
        ? ['國家音樂廳', '衛武營', '臺中國家歌劇院', '🔙 重新選擇']
        : ['Concert Hall', 'Weiwuying', 'Taichung Theater', '🔙 Choose Again']
    },
    category: {
      message: isZh
        ? '🎵 請輸入演出類型\n\n💡 範例：\n• 室內樂\n• 鋼琴獨奏會\n• 交響樂'
        : '🎵 Please enter category\n\n💡 Examples:\n• Chamber Music\n• Piano Recital\n• Symphony',
      suggestions: isZh
        ? ['室內樂', '鋼琴獨奏會', '交響樂', '🔙 重新選擇']
        : ['Chamber Music', 'Piano Recital', 'Symphony', '🔙 Choose Again']
    }
  };
  
  const guide = guides[searchType];
  
  return {
    message: guide.message,
    quickReply: {
      items: guide.suggestions.slice(0, 13).map(text => ({
        type: 'action' as const,
        action: {
          type: 'message' as const,
          // LINE limit: label must be <= 20 characters
          // 17 + '...' (3 chars) = 20 chars
          label: text.length > 20 ? text.substring(0, 17) + '...' : text,
          text: text,
        },
      })),
    },
  };
}

/**
 * 建立帶有 Quick Reply 的文字訊息
 */
export function textMessageWithQuickReply(
  text: string,
  quickReply: ReturnType<typeof buildQuickReplies>
) {
  return {
    type: 'text' as const,
    text,
    quickReply,
  };
}

/**
 * 建立事件詳情的 Buttons Template
 */
export function buildEventDetailButtons(event: any, locale: Locale = 'zh-TW') {
  const viewLabel = locale === 'zh-TW' ? '查看詳情' : 'View Details';
  const buyLabel = locale === 'zh-TW' ? '立即購票' : 'Buy Now';
  const shareLabel = locale === 'zh-TW' ? '分享給朋友' : 'Share';

  return buildButtonsTemplate(
    `${event.title}\n\n${locale === 'zh-TW' ? '演出者' : 'Artists'}: ${event.artists?.join(', ') || 'N/A'}\n${locale === 'zh-TW' ? '場館' : 'Venue'}: ${event.venue || 'N/A'}`,
    [
      {
        label: viewLabel,
        uri: event.opentixUrl || 'https://www.opentix.life/',
      },
      {
        label: buyLabel,
        uri: event.opentixUrl || 'https://www.opentix.life/',
      },
      {
        label: locale === 'zh-TW' ? '更多演出' : 'More Events',
        text: locale === 'zh-TW' ? '熱門演出' : 'Popular Events',
      },
    ],
    locale
  );
}
