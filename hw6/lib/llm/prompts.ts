/**
 * 根據語言生成 System Prompt
 */
export function getSystemPrompt(locale: 'zh-TW' | 'en-US' = 'zh-TW'): string {
  if (locale === 'en-US') {
    return `You are a professional concert ticketing customer service assistant, specializing in the OPENTIX ticketing platform.

**Knowledge Base:**
You have access to comprehensive OPENTIX FAQ knowledge base covering:
- Platform introduction and features
- Member registration and account management
- Ticket purchase process
- Ticket pickup methods
- Refund and cancellation policies
- Payment methods
- Discounts and promotions
- OPENTIX Live online viewing
- Service locations
- Common troubleshooting

**Response Principles:**
- **Use a natural, friendly tone, as if chatting with a friend, avoid robotic responses**
- Be concise and clear, answer questions directly, avoid lengthy explanations
- Use English with appropriate cultural context
- **Extremely important: Only answer content directly related to the current user query, absolutely do not answer content unrelated to the question**
- When FAQ knowledge is provided, use it to answer user questions naturally, converting FAQ format into conversational responses

**Handling General Questions:**
- If the user asks "How can I ask you questions?" or "What can you help me with?", introduce your capabilities:
  • Search for music events (artists, venues, categories)
  • Query event details (venue, organizer, duration, etc.)
  • Provide OPENTIX ticket purchase links
  • Answer event-related questions
  • Answer OPENTIX platform FAQs (membership, ticketing, refunds, etc.)
- If the user asks about topics OUTSIDE your scope (e.g., weather, news, general knowledge), politely explain:
  "I'm the OPENTIX Music Event Information Assistant, specializing in music event information and OPENTIX platform services. I can help you search for events, query event details, provide ticket links, and answer OPENTIX-related questions. For other topics, please use other services."
- Always stay within your role as a music event information and OPENTIX platform assistant

**FAQ Handling:**
- When FAQ knowledge base information is provided in the context, prioritize using it to answer user questions
- Convert FAQ Q&A format into natural conversational responses
- If FAQ contains links or contact information, provide them directly to users
- If FAQ information is insufficient, guide users to contact OPENTIX customer service`;
  }
  
  return `你是一位專業的演唱會購票客服助理，專精於 OPENTIX 購票平台。

**知識庫：**
你擁有完整的 OPENTIX 常見問題知識庫，涵蓋：
- 平台介紹與功能
- 會員註冊與帳號管理
- 購票流程
- 取票方式
- 退票與取消政策
- 支付方式
- 優惠與折扣
- OPENTIX Live 線上觀演
- 服務據點
- 常見問題排解

**回答原則：**
- **使用自然、友善的語氣，就像在跟朋友聊天一樣，避免機械化的回覆**
- 簡潔明瞭，直接回答問題，避免冗長說明
- 使用繁體中文與台灣用語
- **極重要：只回答與當前使用者查詢直接相關的內容，絕對不要回答與問題無關的內容**
- **如果問題過於抽象、模糊或無法理解，請明確告訴使用者需要更具體的資訊**
- **當系統提供了「找到的演出資料」時，用自然的方式介紹這些演出，不要用「為您找到與『XXX』相關的演出：」這種機械化的開場白**
- **如果系統沒有找到相關演出，請明確告訴使用者「很抱歉，沒有找到與您查詢相關的演出」，並建議使用者使用不同的關鍵字搜尋或前往 OPENTIX 官網查看。絕對不要提供任何假的示例數據、編造的演出資訊或推薦任何演出（包括熱門演出、近期演出等）**
- **當系統提供了「OPENTIX 常見問題知識庫」時，優先使用這些資訊回答使用者的問題，將 FAQ 格式轉換為自然對話形式**

**後續問題處理（極重要）：**
- 當使用者問「XXX 票價是多少」、「XXX 時間是什麼時候」等後續問題時，這是關於剛才查詢的演出的問題，**不是新的搜尋查詢**
- **必須從對話上下文中找到使用者提到的演出，並針對該演出回答問題**
- **絕對不要回答「沒有找到相關演出」或提供熱門演出推薦，因為這是後續問題**
- 如果上下文中沒有票價資訊，請告訴使用者前往購票頁面查看，並提供購票連結
- 如果無法從上下文中找到使用者提到的演出，請禮貌地請使用者重新提供演出名稱

回覆格式：
- 用簡潔的列表呈現演出資訊，每個演出包含：標題、演出者、場館、購票連結
- 適度使用 emoji 增加親和力（1-2 個即可）
- 避免重複說明或過度客套

重要格式要求：
- 絕對不要使用 Markdown 格式（不要用 **粗體**、*斜體*、[連結文字](url) 等）
- 使用純文字格式，連結直接貼上完整 URL
- 列表使用數字編號（1. 2. 3.）或項目符號（•），不要用 Markdown 列表語法
- 標題和重點用換行和 emoji 來強調，不要用 ** 符號
- **演出者資訊要簡潔，只顯示主要演出者，不要包含冗長的描述、URL 或不相關內容**

**處理一般問題：**
- 如果使用者問「我可以怎麼問你問題？」、「你能幫我做什麼？」等，請介紹您的功能：
  • 搜尋音樂演出資訊（藝人、場館、類型）
  • 查詢演出詳情（地點、主辦單位、演出時長等）
  • 提供 OPENTIX 購票連結
  • 回答演出相關問題
  • 回答 OPENTIX 平台常見問題（會員、購票、退票等）
- 如果使用者問到**職責範圍外**的問題（如天氣、新聞、一般知識），請禮貌地說明：
  「我是 OPENTIX 音樂演出諮詢小幫手，專精於音樂演出資訊與 OPENTIX 平台服務。我可以協助您搜尋演出、查詢演出詳情、提供購票連結，以及回答 OPENTIX 相關問題。其他主題請使用其他服務。」
- 始終保持在音樂演出資訊助理與 OPENTIX 平台客服的角色範圍內

**FAQ 處理（🚨 極重要 🚨）：**
- 當對話上下文中提供了「OPENTIX 常見問題知識庫」資訊時，**必須優先且直接使用這些資訊回答使用者的問題**
- **如果使用者的問題與 FAQ 中的問題相同或高度相關，必須使用 FAQ 的標準答案，不要自己編造或給出通用流程說明**
- **範例**：
  - 使用者問：「OPENTIX 會員和國家兩廳院會員是否相同？」
  - 正確做法：直接回答「否。自2020年11月試營運起，OPENTIX兩廳院文化生活會員與國家兩廳院會員已脫鉤，為獨立的會員系統。」
  - 錯誤做法：給出通用的「要註冊會員，請前往官網...」流程說明（這不是對問題的直接回答）
- 將 FAQ 的 Q&A 格式轉換為自然對話形式的回應，但**保留核心答案內容**
- **不要**在沒有找到相關 FAQ 時，給出通用的流程說明來回答具體問題
- 如果 FAQ 中有連結或聯絡資訊（如電話、email），請直接提供給使用者
- 如果 FAQ 資訊不足以回答問題，引導使用者聯繫 OPENTIX 客服中心

限制：
- 不能代替使用者完成實際購票
- 不處理金流或個資
`;
}

// 向后兼容：默认中文 System Prompt
export const SYSTEM_PROMPT = getSystemPrompt('zh-TW');

type ChatMessageLite = { role: 'user' | 'assistant' | 'system'; content: string };

export async function buildUserPrompt(
  recent: ChatMessageLite[],
  message: string,
  options?: { opentixSearchUrl?: string; foundEvents?: any[]; parsedQuery?: any; userLocale?: 'zh-TW' | 'en-US'; faqResults?: any[] }
) {
  // 如果提供了 FAQ 結果，將其整合到 prompt 中
  let faqSection = '';
  if (options?.faqResults && options.faqResults.length > 0) {
    const { formatFAQForPrompt } = await import('@/services/opentix-faq.service');
    faqSection = formatFAQForPrompt(options.faqResults);
  }
  const userLocale = options?.userLocale || 'zh-TW';
  // 判斷是否是後續問題（如「票價是多少」）
  const isFollowUpQuestion = (msg: string): boolean => {
    const q = msg.trim().toLowerCase();
    const followUpKeywords = [
      '票價', '價格', '多少錢', '價錢', 'price', 'cost', 'ticket price',
      '時間', '日期', '什麼時候', 'when', 'date', 'time',
      '地點', '在哪裡', 'where', 'location', 'venue',
      '詳情', '詳細', '介紹', 'details', 'info', 'information',
      '如何', '怎麼', 'how', '怎麼買', '如何購票',
    ];
    return followUpKeywords.some((keyword) => q.includes(keyword));
  };
  
  const isFollowUp = isFollowUpQuestion(message);
  
  // 對於後續問題，提供更多上下文；對於新查詢，只提供最近 1 條對話
  const contextMessages = isFollowUp ? recent.slice(-3) : recent.slice(-1);
  const contextText = contextMessages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');
  
  // 明確指示 LLM 專注於當前查詢（根據語言）
  let prompt = userLocale === 'en-US'
    ? `【Current User Query】\n"${message}"\n\n**IMPORTANT: Please respond in English.**\n\n`
    : `【當前使用者查詢】\n"${message}"\n\n`;
  
  if (isFollowUp) {
    // 從上下文中提取演出資訊
    const eventTitles: string[] = [];
    const eventInfo: string[] = [];
    
    // 從最近的 assistant 回覆中提取演出資訊
    for (const msg of contextMessages) {
      if (msg.role === 'assistant') {
        const content = msg.content;
        // 嘗試提取演出標題（通常在數字編號後面，如 "1. 演出標題"）
        const titleMatches = content.match(/\d+\.\s+([^\n]+)/g);
        if (titleMatches) {
          titleMatches.forEach((match) => {
            const title = match.replace(/^\d+\.\s+/, '').trim();
            // 移除可能的副標題（通常在下一行）
            const cleanTitle = title.split('\n')[0].trim();
            if (cleanTitle && cleanTitle.length > 3 && !eventTitles.includes(cleanTitle)) {
              eventTitles.push(cleanTitle);
            }
          });
        }
        // 也提取完整的演出資訊段落（包含標題、演出者、場館、購票連結）
        const lines = content.split('\n');
        let currentEvent: string[] = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          // 如果這一行是數字開頭（如 "1. 標題"），開始新的演出區塊
          if (/^\d+\.\s+/.test(line)) {
            if (currentEvent.length > 0) {
              eventInfo.push(currentEvent.join('\n'));
            }
            currentEvent = [line];
          } else if (currentEvent.length > 0 && (line.includes('場館') || line.includes('購票') || line.includes('演出者') || line.includes('類型'))) {
            currentEvent.push(line);
          } else if (currentEvent.length > 0 && line.length > 0 && !line.match(/^[•\-\*]/)) {
            // 可能是副標題或其他資訊
            currentEvent.push(line);
          }
        }
        if (currentEvent.length > 0) {
          eventInfo.push(currentEvent.join('\n'));
        }
      }
    }
    
    prompt += `【重要：這是後續問題】\n使用者剛才查詢了某些演出，現在在問關於這些演出的問題（如票價、時間、地點等）。\n\n【近期對話上下文】\n${contextText || '（目前沒有對話歷史）'}\n\n`;
    
    if (eventTitles.length > 0 || eventInfo.length > 0) {
      prompt += `【從上下文中提取的演出資訊】\n`;
      if (eventTitles.length > 0) {
        prompt += `找到的演出標題：\n${eventTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n`;
      }
      if (eventInfo.length > 0) {
        prompt += `演出詳細資訊：\n${eventInfo.slice(0, 5).join('\n\n')}\n\n`;
      }
    }
    
    prompt += `【指示】\n1. **這是後續問題，不是新的搜尋查詢**\n2. 請從上述對話上下文中找到使用者提到的演出（例如：如果使用者問「XXX 票價是多少」，請在上下文中找到名為「XXX」的演出）\n3. **針對找到的演出回答使用者的問題**（如票價、時間、地點等）\n4. **關於票價和場次**（極重要）：\n   - 如果使用者問票價或場次，請優雅地告訴使用者：「很抱歉，由於 Opentix 平台的資料安全機制，我無法直接顯示即時的票價和場次資訊。建議您前往購票頁面查看最新的票價、場次時間和剩餘票數：[購票連結]」\n   - 不要說「找不到」或「沒有資料」，而是說明這是為了資料安全\n   - 提供購票連結，讓使用者可以自行查看\n5. **關於時間/日期和場次**（極重要）：\n   - 如果使用者問「何時開始」、「演出時間」、「什麼時候」等，請優雅地告訴使用者：「很抱歉，由於 Opentix 平台的資料安全機制，我無法直接顯示即時的場次時間和剩餘票數。建議您前往購票頁面查看最新的票價、場次時間和剩餘票數：[購票連結]」\n   - 不要說「找不到」或「沒有資料」，而是說明這是為了資料安全\n   - 提供購票連結，讓使用者可以自行查看\n6. **絕對不要回答「沒有找到相關演出」或提供熱門演出推薦，因為這是後續問題，不是新的搜尋**\n7. 如果無法從上下文中找到使用者提到的演出，請禮貌地說：「很抱歉，我無法從剛才的對話中找到您提到的演出。請您重新提供演出名稱，或重新搜尋該演出。」\n`;
  } else {
    // 檢查是否是日期查詢
    const isDateQuery = options?.parsedQuery?.queryType === 'date' || 
                       /(\d{1,2})[月/]|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i.test(message);
    
    prompt += `【極重要指示】\n1. 你必須只回答與上述「當前使用者查詢」直接相關的內容\n2. 絕對不要回答與問題無關的內容\n`;
    
    if (isDateQuery) {
      // 日期查詢：提供更精準的指示
      const dateRange = options?.parsedQuery?.dateRange;
      if (dateRange && dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
        const endDate = new Date(dateRange.end).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
        prompt += `3. **這是日期查詢**：使用者正在查詢 ${startDate} 到 ${endDate} 之間的演出\n`;
      } else {
        prompt += `3. **這是日期查詢**：使用者正在查詢特定日期或日期範圍的演出\n`;
      }
      prompt += `4. **如果系統沒有找到該日期範圍的演出**，請明確告訴使用者：\n`;
      prompt += `   - 「很抱歉，在您指定的日期範圍內目前沒有找到相關演出。」\n`;
      prompt += `   - 建議使用者：「建議您可以：\n     • 嘗試擴大日期範圍\n     • 或前往 Opentix 官網查看其他日期的演出：https://www.opentix.life/」\n`;
      prompt += `5. **絕對不要**列出其他不相關日期的演出或熱門演出推薦\n`;
    } else {
      prompt += `3. 如果問題過於抽象、模糊或無法理解，請明確告訴使用者：「很抱歉，您的問題可能過於抽象，請提供更具體的資訊，例如：藝人名稱、演出類型或場館名稱。」\n`;
    }
    
    prompt += `4. 不要混淆或引用之前對話中的其他藝人或查詢\n\n【近期對話參考】（僅供上下文參考，不要直接回答這些內容）：\n${contextText || '（目前沒有對話歷史）'}`;
  }

  // 如果有知識庫資訊（藝人資訊），添加到 prompt 中
  if (options?.parsedQuery?.artistInfo) {
    const artistInfo = options.parsedQuery.artistInfo;
    prompt += `\n\n【藝人資訊】（從知識庫識別）\n`;
    prompt += `使用者查詢的藝人：${artistInfo.normalizedName}\n`;
    if (artistInfo.profession && artistInfo.profession.length > 0) {
      prompt += `職業：${artistInfo.profession.join('、')}\n`;
    }
    if (artistInfo.aliases && artistInfo.aliases.length > 0) {
      prompt += `別名：${artistInfo.aliases.join('、')}\n`;
    }
    prompt += `\n【重要】開場白必須自然流暢，避免生硬的表達：\n`;
    prompt += `✅ 正確範例：\n`;
    prompt += `  - 「找到了魏德曼的演出：」\n`;
    prompt += `  - 「找到了作曲家魏德曼的演出：」\n`;
    prompt += `  - 「找到了指揮家魏德曼的演出：」\n`;
    prompt += `❌ 錯誤範例（絕對不要這樣寫）：\n`;
    prompt += `  - 「找到了與作曲家的魏德曼的演出」← 語法錯誤\n`;
    prompt += `  - 「找到了與指揮家的XXX的演出」← 語法錯誤\n`;
    prompt += `  - 「找到了和鋼琴家的XXX的演出」← 語法錯誤\n`;
    prompt += `\n規則：職業資訊要直接放在藝人名稱前面，不要加「與」「和」「的」等助詞。\n`;
  }

  // 如果有找到演出資料，優先提供給 LLM
  if (options?.foundEvents && options.foundEvents.length > 0) {
    // 清理事件資料，移除冗長內容
    const { formatEventForDisplay } = await import('@/lib/utils/event-formatter');
    
    // 檢測是否是單一節目查詢或詢問詳細介紹
    const isAskingForDetails = (msg: string): boolean => {
      const q = msg.trim().toLowerCase();
      const detailKeywords = [
        '介紹', '簡介', '說明', '講', '內容', '是什麼', '關於',
        'introduce', 'introduction', 'about', 'describe', 'description', 'tell me about',
        '詳情', '詳細', 'details', 'info', 'information',
      ];
      return detailKeywords.some((keyword) => q.includes(keyword));
    };
    
    const shouldKeepFullDescription = isAskingForDetails(message) || options.foundEvents.length === 1;
    
    const cleanedEvents = options.foundEvents.map((event) => 
      formatEventForDisplay(event, { keepFullDescription: shouldKeepFullDescription })
    );
    
    const shouldProvideFullDescription = isAskingForDetails(message);
    const isSingleEventQuery = cleanedEvents.length === 1;
    
    prompt += `\n\n【找到的演出資訊】（針對當前查詢「${message}」）\n`;
    prompt += `**🚨 極重要 - 相關性檢查規則（必須嚴格遵守）🚨**\n\n`;
    prompt += `**步驟1：提取查詢關鍵字**\n`;
    prompt += `從查詢「${message}」中提取核心關鍵字（演出名稱、藝人名稱或場館名稱）\n`;
    prompt += `- 移除「介紹」、「一下」、「查詢」等動作詞\n`;
    prompt += `- 移除「獨奏會」、「音樂會」、「演唱會」等通用詞彙\n`;
    prompt += `- 提取具體的演出名稱（如「水火交融」、「法式當代鉅獻」）或藝人名稱（如「黎卓宇」、「Eric Lu」）\n\n`;
    
    prompt += `**步驟2：逐一檢查每個演出的相關性**\n`;
    prompt += `對於每個演出，檢查：\n`;
    prompt += `1. 標題匹配度：\n`;
    prompt += `   - ✅ 標題包含**所有核心關鍵字**（如「水火交融」+「黎卓宇」）→ 高度相關，優先回答\n`;
    prompt += `   - ⚠️ 標題只包含**部分關鍵字**（如只有「獨奏會」）→ 相關性低，謹慎回答\n`;
    prompt += `   - ❌ 標題完全不包含核心關鍵字 → 不相關，跳過\n`;
    prompt += `2. 演出者匹配度（如果查詢是藝人名稱）：\n`;
    prompt += `   - ✅ 演出者列表包含該藝人 → 高度相關，可以回答\n`;
    prompt += `   - ❌ 演出者列表不包含該藝人 → 不相關，跳過\n`;
    prompt += `3. 場館匹配度（如果查詢是場館名稱）：\n`;
    prompt += `   - ✅ 場館名稱匹配 → 相關，可以回答\n`;
    prompt += `   - ❌ 場館名稱不匹配 → 不相關，跳過\n\n`;
    
    prompt += `**步驟3：決定回答方式**\n`;
    prompt += `- 如果至少有1個演出高度相關（包含所有核心關鍵字）→ **只回答這些高度相關的演出**，不要回答相關性低的\n`;
    prompt += `- 如果只有相關性低的演出（只匹配部分關鍵字）→ 最多只回答2個，並說明「可能相關」\n`;
    prompt += `- 如果所有演出都不相關 → 明確告訴使用者「很抱歉，沒有找到與「${message}」相關的演出」\n\n`;
    
    prompt += `**❌ 絕對禁止的行為**\n`;
    prompt += `1. 不要回答與查詢不相關的演出（即使它在搜索結果中排第一）\n`;
    prompt += `2. 不要「將就」回答一個只有部分匹配的演出，除非真的沒有更好的結果\n`;
    prompt += `3. 不要在回答中說「雖然沒有找到XXX，但有YYY」\n`;
    prompt += `4. 不要因為「獨奏會」、「音樂會」等通用詞彙匹配就認為相關\n\n`;
    
    prompt += `**範例**\n`;
    prompt += `- 查詢：「水火交融－黎卓宇2026鋼琴獨奏會」\n`;
    prompt += `  - 核心關鍵字：「水火交融」、「黎卓宇」、「2026」\n`;
    prompt += `  - 第1個演出標題：成田達輝小提琴獨奏會 → ❌ 只有「獨奏會」匹配，不包含核心關鍵字，跳過\n`;
    prompt += `  - 第2個演出標題：林冠廷2025鋼琴獨奏會 → ❌ 只有「鋼琴獨奏會」匹配，不包含核心關鍵字，跳過\n`;
    prompt += `  - 第3個演出標題：水火交融－黎卓宇2026鋼琴獨奏會 → ✅ 包含所有核心關鍵字，只回答這個\n\n`;
    
    prompt += `以下是搜尋系統返回的演出列表（已按相關性排序，但你仍需驗證）：\n\n`;
    cleanedEvents.forEach((event, idx) => {
      prompt += `\n${idx + 1}. ${event.title}`;
      if (event.subtitle) prompt += ` - ${event.subtitle}`;
      
      // 重要：確保演出者資訊正確顯示，只顯示清理後的主要演出者
      if (event.artists && event.artists.length > 0 && event.artists[0] !== event.title) {
        // 只顯示前 3 個演出者，避免過長
        const displayArtists = event.artists.slice(0, 3);
        prompt += `\n   演出者：${displayArtists.join(', ')}${event.artists.length > 3 ? '...' : ''}`;
      }
      
      if (event.venue) prompt += `\n   場館：${event.venue}`;
      if (event.venueAddress) prompt += `\n   場館地址：${event.venueAddress}`;
      if (event.category) prompt += `\n   類別：${event.category}`;
      if (event.rating) prompt += `\n   分級：${event.rating}`;
      if (event.organizer) {
        prompt += `\n   主辦單位：${event.organizer}`;
        if (event.organizerContact) {
          prompt += ` (${event.organizerContact})`;
        }
      }
      if (event.duration) prompt += `\n   演出全長：${event.duration}`;
      if (event.preShowTalk) prompt += `\n   演前導聆：${event.preShowTalk}`;
      if (event.openTime) prompt += `\n   開放時間：${event.openTime}`;
      if (event.discountInfo) {
        // 只顯示前 300 個字符，避免過長
        const discountPreview = event.discountInfo.length > 300 
          ? event.discountInfo.substring(0, 300) + '...'
          : event.discountInfo;
        prompt += `\n   折扣方案：${discountPreview}`;
      }
      
      // 注意：不提供日期和時間資訊，因為爬蟲無法取得準確的場次時間和剩餘票數
      // 這些資訊需要使用者前往購票頁面查看
      
      if (event.description) {
        // 如果用戶詢問詳細介紹或是單一節目查詢，提供完整的 description；否則只提供前 200 個字符
        if (shouldProvideFullDescription || isSingleEventQuery) {
          prompt += `\n   詳細介紹：${event.description}`;
        } else {
          const desc = event.description.substring(0, 200);
          prompt += `\n   簡介：${desc}${event.description.length > 200 ? '...' : ''}`;
        }
      }
      
      prompt += `\n   購票：${event.opentixUrl}\n`;
    });
    
    // 判斷是否是「帶演出名稱的後續問題」（如「XXX 票價是多少」）
    const isFollowUpWithEventName = isFollowUp && message.length > 10;
    
    if (isFollowUpWithEventName) {
      // 這是「帶演出名稱的後續問題」，例如「愛與遠方～日本武尊篇 票價是多少」
      prompt += `\n【回覆要求】（這是關於特定演出的問題）\n1. **使用者正在詢問關於上述演出的具體資訊**（如票價、時間、地點等）\n2. 請直接回答使用者的問題，針對找到的演出提供相關資訊\n3. **關於票價和場次**（極重要）：\n   - 由於 Opentix 平台的資料安全機制，我們無法直接取得即時的票價和場次資訊\n   - 請優雅地告訴使用者：「很抱歉，由於資料安全考量，我無法直接顯示即時的票價和場次資訊。建議您前往購票頁面查看最新的票價、場次時間和剩餘票數：[購票連結]」\n   - 不要說「找不到」或「沒有資料」，而是說明這是為了資料安全\n   - 提供購票連結，讓使用者可以自行查看\n4. **關於時間/日期和場次**（極重要）：\n   - 由於 Opentix 平台的資料安全機制，無法直接取得即時的場次時間和剩餘票數\n   - 請優雅地告訴使用者：「很抱歉，由於資料安全考量，我無法直接顯示即時的場次時間和剩餘票數。建議您前往購票頁面查看最新的票價、場次時間和剩餘票數：[購票連結]」\n   - 不要說「找不到」或「沒有資料」，而是說明這是為了資料安全\n   - 提供購票連結，讓使用者可以自行查看\n5. **關於地點**：如果資料中有「場館」資訊，請直接回答；如果沒有，請提供購票連結讓使用者查看詳情\n6. **關於介紹/詳情**：如果使用者詢問演出的介紹、內容或詳情，請提供完整的「詳細介紹」內容，讓使用者充分了解這個演出的特色和亮點\n7. 使用自然、友善的語氣，就像在跟朋友聊天一樣\n8. 回覆時請使用純文字格式，不要使用 Markdown 語法（不要用 **粗體**、[連結](url) 等），連結直接貼上完整 URL\n9. 保持簡潔，直接回答問題，不要重複列出所有演出資訊`;
    } else {
      // 一般的搜尋查詢
      // 檢測是否是詳細介紹查詢 或 用戶輸入了完整的演出名稱（查詢字串較長）
      const isLongQuery = message.length >= 8; // 完整的演出名稱通常較長
      const isSingleOrFewResults = cleanedEvents.length <= 2;
      
      if (shouldProvideFullDescription || (isLongQuery && isSingleOrFewResults) || isSingleEventQuery) {
        // 用戶想了解演出的詳細介紹 或 輸入了完整演出名稱且找到少量結果 或 單一節目查詢
        prompt += `\n【回覆要求】（使用者想了解演出的詳細介紹）\n請用專業、自然的語氣詳細介紹這個演出。\n\n重要：\n1. **提供完整的演出介紹**：使用上述「詳細介紹」內容，讓使用者充分了解演出的特色、亮點、劇情或演出內容\n2. **提供完整的節目資訊**：包括演出名稱、演出者、場館、類別等所有可用資訊（不要提供演出時間，因為資料不準確）\n3. **專注介紹使用者詢問的演出**，不要列出多個演出清單\n4. **不要使用不專業的開場白**（例如：「哈囉！你是在問剛剛提到的...對吧？」），直接開始介紹演出，使用專業的表達（例如：「這是一場...的演出」或「關於這場演出...」）\n5. 演出者欄位必須正確顯示，不要將標題誤認為演出者\n6. 回覆時請使用純文字格式，不要使用 Markdown 語法（不要用 **粗體**、[連結](url) 等），連結直接貼上完整 URL\n7. 提供演出名稱、演出者、場館和購票連結（不要提供演出時間，因為資料不準確）\n8. 保持專業和親和力，適度使用 emoji（1-2 個即可）\n9. 如果找到多個演出，只詳細介紹第一個（最相關的），其他演出簡短提及即可`;
      } else {
        // 一般的搜尋查詢（多個結果）
        prompt += `\n【回覆要求】\n請用自然、友善的語氣介紹這些演出，就像在跟朋友聊天一樣。\n\n重要：\n1. **不要使用機械化的開場白**（例如：「為您找到與『XXX』相關的演出：」），改用更自然的表達（例如：「找到了 Eric Lu 的演出：」或「有這些演出：」）\n2. 演出者欄位必須正確顯示，不要將標題誤認為演出者\n3. 如果演出者資訊不完整或包含冗長描述，只顯示主要演出者名稱，省略不相關內容\n4. 回覆時請使用純文字格式，不要使用 Markdown 語法（不要用 **粗體**、[連結](url) 等），連結直接貼上完整 URL\n5. 保持簡潔，每個演出只顯示關鍵資訊：標題、主要演出者、場館、購票連結（不要顯示演出時間，因為資料不準確）`;
      }
    }
  } else {
    // 沒有找到相關演出（但這不適用於後續問題）
    if (!isFollowUp) {
      // 檢測是否是完整且具體的演出名稱查詢
      // 必須同時滿足：
      // 1. 長度較長（>=10）且包含特殊字符（書名號、年份等，更可能是演出名稱）
      // 2. 不是單純的類型詞
      // 3. 不是單純的藝人名稱（只有英文和空格，沒有其他特殊字符）
      const hasSpecialChars = /[「」《》～~\-－0-9]/.test(message);
      const isPureEnglishName = /^[a-zA-Z\s]+$/.test(message.trim()); // 純英文名稱（可能是藝人）
      const isLongWithSpecialChars = message.length >= 10 && hasSpecialChars;
      const isPureCategory = /^(音樂會|演唱會|舞蹈|戲劇|親子|講座|音樂|舞台劇|歌劇|表演)$/.test(message.trim());
      
      // 特定演出查詢：長度夠長 + 有特殊字符 + 不是類型詞 + 不是純英文名稱
      const isSpecificEventQuery = isLongWithSpecialChars && !isPureCategory && !isPureEnglishName;
      
      if (isSpecificEventQuery) {
        // 用戶輸入了具體的演出名稱但沒找到（例如：「永恆迴響」2025逢甲管樂定期音樂會）
        prompt += `\n\n【搜尋結果】\n系統沒有找到與「${message}」完全匹配的演出。\n\n【回覆要求】\n1. 明確告訴使用者：「很抱歉，目前沒有找到「${message}」這場演出的資訊。」\n2. **不要列出其他不相關的演出**\n3. 建議使用者：\n   - 檢查演出名稱是否正確\n   - 可以嘗試使用關鍵字搜尋（例如藝人名稱、場館名稱）\n   - 或前往 Opentix 官網搜尋：https://www.opentix.life/search?keyword=${encodeURIComponent(message)}`;
      } else {
        // 一般的類型、藝人或短查詢（例如：音樂會、eric lu）
        // 提取核心關鍵詞（去掉"有沒有"、"的表演"等）
        const coreKeyword = message
          .replace(/^(?:有沒有|有没有|查一下|查看看|找一下|找看看|有|找)\s*/, '')
          .replace(/(?:的)?(?:表演|演出|演奏|獨奏|独奏|協奏|协奏|演唱|音樂會|音乐会|演唱會|演唱会|節目|节目|嗎|吗|？)[\s\?？]*$/, '')
          .trim() || message;
        
        prompt += `\n\n【搜尋結果】\n系統沒有找到與當前查詢「${message}」直接相關的演出。\n\n【回覆要求】（極重要，必須嚴格遵守）\n1. 明確告訴使用者：「很抱歉，沒有找到與「${coreKeyword}」相關的演出資訊。」\n   - ✅ 正確示例：「很抱歉，沒有找到與「理查克萊德門」相關的演出資訊。」\n   - ❌ 錯誤示例：「很抱歉，沒有找到與「有沒有理查克萊德門的演奏」相關的演出資訊。」\n2. **絕對禁止提供任何假的示例數據、編造的演出資訊或推薦任何演出**（包括但不限於：「綠光劇團《人間條件八》」、「蔡依林演唱會」、「VAV 亞洲巡迴演唱會」、「蔡健雅演唱會」、「歌劇魅影」、「某某天團演唱會」、「經典音樂劇重現」等），這些都是假的示例，絕對不應該顯示給使用者\n3. **絕對不要列出任何演出**，即使你認為它們是「熱門演出」、「近期演出」或「受歡迎的演出」\n4. **絕對不要推薦任何演出**，包括去年的、今年的、或任何時期的演出\n5. 只建議使用者：\n   - 可以嘗試使用不同的關鍵字搜尋（例如藝人名稱、場館名稱）\n   - 或前往 Opentix 官網搜尋：https://www.opentix.life/\n6. 回覆格式範例（必須嚴格按照此格式，不要添加任何演出列表）：\n   「很抱歉，沒有找到與「${coreKeyword}」相關的演出資訊。建議您可以嘗試使用不同的關鍵字搜尋，或前往 Opentix 官網查看：https://www.opentix.life/」\n7. **違反以上規則的回覆將被視為嚴重錯誤**`;
      }
    } else {
      // 後續問題但沒有找到演出資料：應該從上下文中提取
      prompt += `\n\n【注意】\n這是後續問題，系統沒有提供演出資料。請從上述對話上下文中提取演出資訊並回答使用者的問題。`;
    }
  }

  // 如果有 FAQ 知識庫資訊，添加到 prompt 末尾
  if (faqSection) {
    prompt += faqSection;
  }

  return prompt;
}
