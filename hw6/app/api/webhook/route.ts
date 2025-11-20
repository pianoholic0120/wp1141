import { NextResponse } from 'next/server';
import { validateSignature } from '@/lib/line/signature';
import { lineClient } from '@/lib/line/client';
import {
  textMessage,
  buildWelcomeMessage,
  buildHelpMessage,
  buildLocaleSelectionMessage,
} from '@/lib/line/templates';
import { logger } from '@/lib/utils/logger';
import { handleUserMessage, saveFAQMessage } from '@/services/chat.service';
import { handleUserMessageWithStateMachine } from '@/services/chat-handler.service';
import { getUserLocale, setUserLocale } from '@/services/locale.service';
import { detectLocaleCommand, isLanguageSwitchTrigger } from '@/lib/i18n';
import { detectSection, getSectionResponse } from '@/services/section.service';
import { checkFAQ } from '@/services/faq.service';
import { Locale } from '@/lib/i18n';
import { LineWebhookRequestSchema, LineEventSchema } from '@/lib/validators/line';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-line-signature');
    const body = await req.text();
    if (!validateSignature(body, signature)) {
      return new NextResponse('Invalid signature', { status: 401 });
    }
    
    // Parse and validate request body with Zod
    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch (parseError) {
      logger.error('Invalid JSON in webhook request:', parseError);
      return new NextResponse('Invalid JSON', { status: 400 });
    }
    
    // Validate webhook request structure
    const validationResult = LineWebhookRequestSchema.safeParse(json);
    if (!validationResult.success) {
      logger.error('Invalid webhook request structure:', validationResult.error);
      return new NextResponse('Invalid request structure', { status: 400 });
    }
    
    const { events } = validationResult.data;
    // Validate and handle events defensively so one failure won't cause 500
    await Promise.all(
      events.map(async (ev) => {
        try {
          // Validate individual event structure
          const eventValidation = LineEventSchema.safeParse(ev);
          if (!eventValidation.success) {
            logger.warn('Invalid event structure, skipping:', eventValidation.error);
            return;
          }
          
          await handleEvent(eventValidation.data);
        } catch (err) {
          logger.error('Event handling failed:', err);
          // Best-effort fallback reply to avoid LINE retry loops
          const replyToken: string | undefined = ev?.replyToken;
          if (replyToken) {
            try {
              await lineClient.replyMessage(replyToken, [
                textMessage(
                  '目前服務較繁忙，請稍後再試或直接前往 Opentix 官網 https://www.opentix.life/'
                ),
              ]);
            } catch (replyErr) {
              logger.warn('Fallback reply failed:', replyErr);
            }
          }
        }
      })
    );
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    logger.error('Webhook error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

async function handleEvent(event: z.infer<typeof LineEventSchema>) {
  const type = event.type;
  const replyToken: string | undefined = event.replyToken;
  const userId = event.source.userId || 'unknown';

  // Follow/Join 事件：發送歡迎訊息
  if ((type === 'follow' || type === 'join') && replyToken) {
    try {
      const locale = await getUserLocale(userId);
      const welcomeMsg = buildWelcomeMessage(locale);
      await lineClient.replyMessage(replyToken, [welcomeMsg]);
    } catch (err) {
      logger.warn('Failed to send welcome message, using default locale:', err);
      const welcomeMsg = buildWelcomeMessage('zh-TW');
      await lineClient.replyMessage(replyToken, [welcomeMsg]);
    }
    return;
  }

  // 文字訊息處理
  if (type === 'message' && event.message && event.message.type === 'text' && replyToken) {
    const text = (event.message.text || '').trim();
    let locale: Locale;
    try {
      locale = await getUserLocale(userId);
    } catch (err) {
      logger.warn('Failed to get locale, using default:', err);
      locale = 'zh-TW';
    }

    // 1. 語言切換處理
    if (isLanguageSwitchTrigger(text)) {
      // 重新獲取最新的 locale，確保顯示正確的當前語言標記
      let currentLocale: Locale;
      try {
        currentLocale = await getUserLocale(userId);
        logger.info(`[Language Selection] Using locale: ${currentLocale} for language selection`);
      } catch (err) {
        logger.warn('Failed to get locale for language selection, using cached:', err);
        currentLocale = locale;
      }
      const localeMsg = buildLocaleSelectionMessage(currentLocale);
      await lineClient.replyMessage(replyToken, [localeMsg]);
      return;
    }

    // 2. 直接語言指令（例如：繁體中文、English）
    const localeCommand = detectLocaleCommand(text);
    if (localeCommand) {
      await setUserLocale(userId, localeCommand);
      const newLocale = localeCommand;
      const localeName = newLocale === 'zh-TW' ? '繁體中文' : 'English';
      const changedMsg =
        newLocale === 'zh-TW' ? `語言已切換為 ${localeName}` : `Language changed to ${localeName}`;

      // 發送語言已更新訊息 + 重新發送 welcome
      await lineClient.replyMessage(replyToken, [
        textMessage(changedMsg),
        buildWelcomeMessage(newLocale),
      ]);
      // 更新 locale 變數，以便後續處理使用
      locale = newLocale;
      return;
    }

    // 3. FAQ 知識庫檢查（優先於章節系統，因為 FAQ 提供更精確的答案）
    // 使用新的 opentix-faq.service 檢查是否是 FAQ 問題
    const { searchFAQ, isFAQQuery } = await import('@/services/opentix-faq.service');
    let faqResults: any[] | undefined;
    let shouldUseFAQ = false;
    
    // 檢查是否是明確的 FAQ 問題
    const platformFAQKeywords = [
      '會員', '註冊', '登入', '密碼', '帳號', '綁定', '國家兩廳院',
      '購票', '買票', '訂票', '折扣', '優惠', '無法使用',
      '取票', '領票', '電子票', '代碼', '更改', '忘記',
      '退票', '退款', '取消',
      '付款', '支付', '信用卡',
      '怎麼辦', '如何', '怎麼', '是否', '能否', '可以',
    ];
    
    const hasPlatformFAQKeyword = platformFAQKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasPlatformFAQKeyword || isFAQQuery(text)) {
      // 如果是 FAQ 問題，搜索 FAQ 知識庫
      faqResults = await searchFAQ(text, 3);
      logger.info(`[FAQ] Searching FAQ for: "${text}", found ${faqResults.length} results`);
      
      if (faqResults.length > 0) {
        logger.info(`[FAQ] Top FAQ match: "${faqResults[0].faq.question}", score: ${faqResults[0].score}`);
        
        // 如果找到高相關性的 FAQ（分數 > 50），優先使用 FAQ
        if (faqResults[0].score > 50) {
          shouldUseFAQ = true;
          logger.info(`[FAQ] Using FAQ answer (score: ${faqResults[0].score})`);
          
          // 使用 LLM 整合 FAQ 知識庫回答問題
          const { generateAssistantReply } = await import('@/services/llm.service');
          const { cleanMarkdown } = await import('@/lib/utils/format');
          const { ConversationModel } = await import('@/models/Conversation');
          const { MessageModel } = await import('@/models/Message');
          
          try {
            // 獲取最近的對話歷史
            const conversation = await ConversationModel.findOne({ userId }).sort({ createdAt: -1 });
            let recentMessages: any[] = [];
            
            if (conversation) {
              recentMessages = await MessageModel.find({
                conversationId: conversation._id,
              })
                .sort({ timestamp: -1 })
                .limit(3)
                .lean();
            }
            
            const contextForLLM = recentMessages
              .reverse()
              .map((m: any) => ({ role: m.role, content: m.content }));
            
            // 使用 LLM 整合 FAQ 生成回答
            let answer = await generateAssistantReply(contextForLLM, text, {
              userLocale: locale,
              faqResults: faqResults,
            });
            answer = cleanMarkdown(answer);
            
            // 保存到資料庫
            try {
              await saveFAQMessage(userId, text, answer);
            } catch (err) {
              logger.warn('Failed to save FAQ message (non-critical):', err);
            }
            
            // 根據 FAQ 類型選擇對應的 Quick Reply
            const { textMessageWithQuickReply } = await import('@/lib/line/templates');
            const { buildPurchaseFAQQuickReply } = await import('@/lib/line/templates');
            const faqQuickReply = buildPurchaseFAQQuickReply(locale);
            
            const faqMsg = textMessageWithQuickReply(answer, faqQuickReply);
            await lineClient.replyMessage(replyToken, [faqMsg]);
            return;
          } catch (err) {
            logger.error('[FAQ] Error generating FAQ answer:', err);
            // 降級：繼續處理其他邏輯
            shouldUseFAQ = false;
          }
        }
      }
    }

    // 4. 章節系統：偵測是否命中章節關鍵字（如果沒有使用 FAQ）
    // 如果已經決定使用 FAQ，跳過章節檢測，避免返回通用流程
    if (!shouldUseFAQ) {
      const section = detectSection(text);
      if (section) {
        try {
          // 重新獲取 locale，確保使用最新的語言設定
          let currentLocale: Locale;
          try {
            // 先嘗試從資料庫獲取最新的 locale
            currentLocale = await getUserLocale(userId);
            logger.info(`[Section] Fetched locale from DB: ${currentLocale} for section: ${section}`);
          } catch (err) {
            logger.warn('Failed to get locale for section, using cached:', err);
            // 如果資料庫獲取失敗，使用當前 locale（可能已經在語言切換時更新）
            currentLocale = locale;
          }
          const sectionResponse = await getSectionResponse(section, currentLocale);
          logger.info(`[Section] Section response text: "${sectionResponse.text}", locale: ${currentLocale}`);
          const messages: any[] = [];

          if (sectionResponse.text) {
            messages.push(textMessage(sectionResponse.text));
          }

          // 如果是 popularEvents/thisWeek，追加 Carousel
          if (sectionResponse.hasCarousel && sectionResponse.flexMessage) {
            messages.push(sectionResponse.flexMessage);
            logger.info(
              `Sending Carousel for section: ${section}, messages count: ${messages.length}`
            );
          }

          // Quick Reply 必須附加在最後一個訊息上
          // 根據章節類型選擇對應的 Quick Reply
          const { textMessageWithQuickReply } = await import('@/lib/line/templates');
          let sectionQuickReply;
          
          if (section === 'popularEvents' || section === 'thisWeek') {
            // 熱門演出/本週演唱會：提供搜尋、其他演出選項
            const { buildPopularEventsQuickReply } = await import('@/lib/line/templates');
            sectionQuickReply = buildPopularEventsQuickReply(currentLocale);
          } else {
            // 其他章節（如何購票、退票政策等）：使用主選單
            const { buildQuickReplies } = await import('@/lib/line/templates');
            sectionQuickReply = buildQuickReplies(currentLocale);
          }
          
          if (sectionResponse.hasCarousel && sectionResponse.flexMessage) {
            // 有 Carousel 的情況：在 Carousel 之後追加一個帶有 Quick Reply 的文字訊息
            const quickReplyText = currentLocale === 'zh-TW' 
              ? '💡 需要其他協助嗎？請選擇下方功能：'
              : '💡 Need more help? Please select a function below:';
            messages.push(textMessageWithQuickReply(quickReplyText, sectionQuickReply));
          } else if (sectionResponse.text) {
            // 沒有 Carousel 的情況：將文字訊息替換為帶有 Quick Reply 的版本
            messages[0] = textMessageWithQuickReply(sectionResponse.text, sectionQuickReply);
          }

          // 儲存到資料庫（失敗不影響回覆）
          try {
            await saveFAQMessage(userId, text, sectionResponse.text || '');
          } catch (err) {
            logger.warn('Failed to save section message (non-critical):', err);
          }

          if (messages.length > 0) {
            await lineClient.replyMessage(replyToken, messages);
            return;
          }
        } catch (err) {
          logger.warn('Failed to get section response:', err);
          // 降級：繼續處理其他邏輯
        }
      }
    }

    // 5. FAQ 規則式回覆（舊的 checkFAQ，作為備用）
    const faqResponse = checkFAQ(text, locale);
    if (faqResponse && !shouldUseFAQ) {
      try {
        await saveFAQMessage(userId, text, faqResponse.text);
      } catch (err) {
        logger.warn('Failed to save FAQ message:', err);
      }
      
      // 根據 FAQ 類型選擇對應的 Quick Reply
      const { textMessageWithQuickReply } = await import('@/lib/line/templates');
      let faqQuickReply;
      
      if (faqResponse.faqType === 'purchase') {
        const { buildPurchaseFAQQuickReply } = await import('@/lib/line/templates');
        faqQuickReply = buildPurchaseFAQQuickReply(locale);
      } else if (faqResponse.faqType === 'refund') {
        const { buildRefundFAQQuickReply } = await import('@/lib/line/templates');
        faqQuickReply = buildRefundFAQQuickReply(locale);
      } else if (faqResponse.faqType === 'ticketPickup') {
        const { buildTicketPickupFAQQuickReply } = await import('@/lib/line/templates');
        faqQuickReply = buildTicketPickupFAQQuickReply(locale);
      } else if (faqResponse.faqType === 'memberRegistration') {
        const { buildMemberRegistrationFAQQuickReply } = await import('@/lib/line/templates');
        faqQuickReply = buildMemberRegistrationFAQQuickReply(locale);
      } else {
        // 預設使用主選單
        const { buildQuickReplies } = await import('@/lib/line/templates');
        faqQuickReply = buildQuickReplies(locale);
      }
      
      const faqMsg = textMessageWithQuickReply(faqResponse.text, faqQuickReply);
      await lineClient.replyMessage(replyToken, [faqMsg]);
      return;
    }

    // 5. 幫助選單（移除 emoji 後比對）
    const cleanedForCommands = text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // 移除 emoji
      .replace(/[🎵📅💳📋🌐❓🔍]/g, '') // 移除特定 emoji
      .trim()
      .toLowerCase();
    
    if (cleanedForCommands === '幫助' || cleanedForCommands === 'help' || cleanedForCommands === 'menu') {
      const helpMsg = buildHelpMessage(locale);
      await lineClient.replyMessage(replyToken, [helpMsg]);
      return;
    }

    // 5.5. 搜尋提示處理已移至 chat-handler.service.ts 的搜尋引導功能
    // 不再在這裡攔截"搜尋"命令，讓它走正常的狀態機流程

    // 6. 問候語處理：直接回傳 welcome 訊息（不主動推薦）
    const isGreeting = (msg: string): boolean => {
      const greetingPatterns = [
        /^(你好|您好|hi|hello|hey)$/i,
        /^(你好|您好|hi|hello|hey)[\s，,。！!]*$/i,
        /^(早上好|下午好|晚上好|午安|晚安)$/i,
      ];
      return greetingPatterns.some((pattern) => pattern.test(msg.trim()));
    };

    if (isGreeting(text)) {
      const welcomeMsg = buildWelcomeMessage(locale);
      await lineClient.replyMessage(replyToken, [welcomeMsg]);
      return;
    }

    // 7. 一般訊息處理（LLM + 資料庫搜尋）
    // 先檢查訊息是否合理，避免無意義的查詢進入 LLM
    
    // 排除純命令詞和無意義訊息（但保留場館名稱等有效查詢）
    const meaninglessPatterns = [
      // 注意：「搜尋」和「search」現在是搜尋引導的觸發詞，不應該被視為無意義短語
      /^(找|查|搜)$/i,  // 移除了「搜尋」和「search」
      /^(是|否|對|錯|好|不好|可以|不行)$/i,
      /^[。，、！？\s]+$/,
    ];
    
    // 常見場館名稱（即使只有 3 個字也應該允許）
    const venueNames = ['衛武營', '兩廳院', '國家音樂廳', '國家戲劇院', '臺北表演藝術中心', '臺中國家歌劇院', '苗北', '新竹', '桃園', '高雄'];
    const isVenueQuery = venueNames.some(venue => cleanedForCommands.includes(venue.toLowerCase()));
    
    if (meaninglessPatterns.some(pattern => pattern.test(cleanedForCommands)) && !isVenueQuery) {
      const unclearMsg = locale === 'zh-TW'
        ? '您的問題可能過於簡短或抽象，請提供更具體的資訊，例如：\n• 藝人名稱（如：Eric Lu）\n• 演出類型（如：鋼琴演奏會）\n• 場館名稱（如：國家音樂廳）\n\n或選擇下方功能按鈕！'
        : 'Your question might be too brief or abstract. Please provide more specific information, for example:\n• Artist name (e.g., Eric Lu)\n• Event type (e.g., Piano Concert)\n• Venue name (e.g., National Concert Hall)\n\nOr select a function button below!';
      const { textMessageWithQuickReply, buildQuickReplies } = await import('@/lib/line/templates');
      const unclearReply = textMessageWithQuickReply(unclearMsg, buildQuickReplies(locale));
      await lineClient.replyMessage(replyToken, [unclearReply]);
      return;
    }
    
    // 如果訊息太短或看起來不像查詢，回傳 welcome（但場館查詢例外）
    if ((text.length < 2 || !/[a-zA-Z\u4e00-\u9fa5]/.test(text)) && !isVenueQuery) {
      const welcomeMsg = buildWelcomeMessage(locale);
      await lineClient.replyMessage(replyToken, [welcomeMsg]);
      return;
    }

    // 注意：LINE 不支援 Typing Indicator
    // 改用立即發送「正在處理中...」訊息來改善 UX（使用 Push Message，因為 replyToken 只能使用一次）
    // 這在企業級應用中是常見的做法
    // 注意：這個消息是可選的，如果失敗（如 429 錯誤）不應該阻止主要消息的發送
    const processingMsg = locale === 'zh-TW' 
      ? '正在為您搜尋相關資訊，請稍候...'
      : 'Searching for information, please wait...';
    try {
      await lineClient.pushMessage(userId, [textMessage(processingMsg)]);
    } catch (pushErr) {
      // 靜默處理 pushMessage 錯誤（429、503 等），因為這只是可選的 UX 改進
      // 主要消息（replyMessage）仍然可以正常發送
      const errorMessage = pushErr instanceof Error ? pushErr.message : String(pushErr);
      if (errorMessage === 'LINE_API_RATE_LIMIT' || errorMessage === 'LINE_API_SERVICE_UNAVAILABLE') {
        logger.warn(`[Webhook] Push message failed (${errorMessage}), but continuing with main reply`);
      } else {
        logger.warn('[Webhook] Push message failed, but continuing with main reply:', pushErr);
      }
    }

    try {
      // 使用新的狀態機架構處理訊息
      const { replyText, quickReply } = await handleUserMessageWithStateMachine({
        userId,
        message: text,
        replyToken,
        locale,
      });

      // 如果有 Quick Reply，使用帶有 Quick Reply 的訊息
      if (quickReply) {
        const { textMessageWithQuickReply } = await import('@/lib/line/templates');
        await lineClient.replyMessage(replyToken, [
          textMessageWithQuickReply(replyText, quickReply),
        ]);
      } else {
        // 如果沒有 Quick Reply，直接發送回覆文字（可能是後續問題或其他非搜尋查詢）
        // 不要返回歡迎訊息，因為這會讓用戶困惑
        await lineClient.replyMessage(replyToken, [
          textMessage(replyText),
        ]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('handleUserMessage failed:', err);
      
      // 根據錯誤類型提供對應的錯誤訊息
      let errorMsg: string;
      if (errorMessage === 'LINE_API_RATE_LIMIT' || errorMessage === 'LLM_RATE_LIMIT') {
        errorMsg = locale === 'zh-TW'
          ? '目前使用人數較多，系統暫時無法處理您的請求。請稍後再試，或直接前往 Opentix 官網：https://www.opentix.life/'
          : 'The system is currently experiencing high traffic. Please try again later, or visit Opentix website: https://www.opentix.life/';
      } else if (errorMessage === 'LINE_API_SERVICE_UNAVAILABLE' || errorMessage === 'LLM_SERVICE_UNAVAILABLE') {
        errorMsg = locale === 'zh-TW'
          ? '服務暫時無法使用，請稍後再試。您也可以直接前往 Opentix 官網：https://www.opentix.life/'
          : 'Service is temporarily unavailable. Please try again later, or visit Opentix website: https://www.opentix.life/';
      } else if (errorMessage === 'LLM_QUOTA_EXCEEDED') {
        errorMsg = locale === 'zh-TW'
          ? '智能客服暫時無法使用，請直接前往 Opentix 官網：https://www.opentix.life/'
          : 'AI service is temporarily unavailable. Please visit Opentix website: https://www.opentix.life/';
      } else {
        // 一般錯誤訊息
        errorMsg = locale === 'zh-TW'
          ? '很抱歉，處理您的請求時發生錯誤。請稍後再試或直接前往 Opentix 官網：https://www.opentix.life/'
          : 'Sorry, an error occurred while processing your request. Please try again later or visit Opentix website: https://www.opentix.life/';
      }
      
      try {
        await lineClient.replyMessage(replyToken, [textMessage(errorMsg)]);
      } catch (replyErr) {
        logger.error('Failed to send error message:', replyErr);
      }
    }
  }
}
