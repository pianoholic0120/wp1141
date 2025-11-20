/**
 * Intent Detector
 * 改進的意圖檢測，特別是 Quick Reply 處理
 */

import { Session, SessionContext, ConversationState } from './session-manager.service';

export type IntentType =
  | 'GLOBAL_COMMAND'
  | 'QUICK_REPLY'
  | 'SEARCH'
  | 'FOLLOW_UP_QUESTION'
  | 'ASK_TIME'
  | 'ASK_PRICE'
  | 'ASK_VENUE'
  | 'ASK_ARTIST'
  | 'ASK_DETAILS'
  | 'FAQ'
  | 'GENERAL';

export interface Intent {
  type: IntentType;
  data?: any;
}

export class IntentDetector {
  /**
   * 檢測使用者意圖
   */
  async detect(message: string, context: SessionContext, currentState: ConversationState): Promise<Intent> {
    // 1. 檢查是否為全域指令 (優先權最高)
    if (this.isGlobalCommand(message)) {
      return { type: 'GLOBAL_COMMAND', data: this.parseCommand(message) };
    }
    
    // 2. 檢查是否為 Quick Reply 按鈕點擊
    if (this.isQuickReplyAction(message)) {
      return { type: 'QUICK_REPLY', data: this.parseQuickReply(message) };
    }
    
    // 3. 檢查是否為 FAQ（優先於後續問題，因為 FAQ 問題不應該被當作後續問題）
    // 先檢查是否是明確的 FAQ 問題（如"如何購票"、"退票政策"等）
    const faq = this.matchFAQ(message);
    if (faq) {
      return { type: 'FAQ', data: { question: faq } };
    }
    
    // 檢查是否是 FAQ 相關問題（包含 FAQ 關鍵字）
    // 使用動態導入，避免循環依賴
    const faqServiceModule = await import('@/services/opentix-faq.service');
    const isFAQ = faqServiceModule.isFAQQuery(message);
    
    // 如果沒有明確的指示詞指向事件，且是 FAQ 問題，優先作為 FAQ 處理
    if (isFAQ) {
      const hasReferenceWord = /^(這個|那個|它|他|她|該|此|本)/.test(message) || 
                              /(這個|那個|它|他|她|該|此|本)\s*(表演|演出|音樂會|演唱會|節目|活動)/.test(message);
      
      // 只有在沒有明確指示詞的情況下，才優先作為 FAQ 處理
      if (!hasReferenceWord) {
        // 檢查是否是明確關於平台的 FAQ（如"會員"、"購票"、"退票"等）
        const platformFAQKeywords = [
          '會員', '註冊', '登入', '密碼', '帳號', '綁定',
          '購票', '買票', '訂票', '折扣', '優惠',
          '取票', '領票', '電子票', '代碼', '更改',
          '退票', '退款', '取消',
          '付款', '支付', '信用卡',
          'opentix', 'member', 'register', 'login', 'password',
          'ticket', 'buy', 'purchase', 'refund', 'cancel',
          'pickup', 'payment', 'credit',
        ];
        
        const hasPlatformFAQKeyword = platformFAQKeywords.some(keyword => 
          message.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (hasPlatformFAQKeyword) {
          return { type: 'FAQ', data: { question: message } };
        }
      }
    }
    
    // 4. 如果在 EVENT_SELECTED 或 EVENT_LIST 狀態，檢查是否為後續問題
    // 包含指示詞（這個、那個）或明確的後續問題關鍵字的，必定是後續問題
    if (currentState === ConversationState.EVENT_SELECTED || currentState === ConversationState.EVENT_LIST) {
      const hasReferenceWord = /^(這個|那個|它|他|她|該|此|本)/.test(message) || 
                              /(這個|那個|它|他|她|該|此|本)\s*(表演|演出|音樂會|演唱會|節目|活動)/.test(message);
      
      // 如果有指示詞，必定是後續問題
      if (hasReferenceWord) {
        return this.detectFollowUpIntent(message, context);
      }
      
      // 如果沒有指示詞，但包含明確的後續問題關鍵字，也視為後續問題
      if (this.isAboutTime(message) || this.isAboutPrice(message) || 
          this.isAboutVenue(message) || this.isAboutArtist(message) || 
          this.isAboutDetails(message)) {
      return this.detectFollowUpIntent(message, context);
      }
    }
    
    // 5. 檢查是否為新搜尋
    // 只有在不是後續問題的情況下才檢查搜尋
    if (this.hasSearchKeywords(message)) {
      return { type: 'SEARCH', data: { query: message } };
    }
    
    // 6. 再次檢查後續問題（針對沒有 EVENT 上下文的情況）
    if (currentState === ConversationState.EVENT_SELECTED || currentState === ConversationState.EVENT_LIST) {
      return this.detectFollowUpIntent(message, context);
    }
    
    // 7. 一般對話
    return { type: 'GENERAL', data: { message } };
  }
  
  /**
   * 檢查是否為全域指令
   */
  private isGlobalCommand(message: string): boolean {
    const globalCommands = [
      '幫助', 'help', 'menu', '主選單', '主畫面', '回到主選單', '回到主畫面',
      '🏠 回到主畫面', '🏠 主選單', '🏠 Main Menu',
    ];
    return globalCommands.some(cmd => message.trim().toLowerCase() === cmd.toLowerCase());
  }
  
  /**
   * 解析全域指令
   */
  private parseCommand(message: string): string {
    const normalized = message.trim().toLowerCase();
    if (normalized.includes('help') || normalized.includes('幫助')) return 'help';
    if (normalized.includes('menu') || normalized.includes('主選單') || normalized.includes('主畫面')) return 'main_menu';
    return 'help';
  }
  
  /**
   * 檢查是否為 Quick Reply 按鈕點擊
   * 關鍵改進:不再依賴複雜的文字分析
   */
  private isQuickReplyAction(message: string): boolean {
    // Quick Reply 按鈕有特殊標記（emoji 開頭）
    return (
      message.startsWith('⏰') ||
      message.startsWith('👤') ||
      message.startsWith('💰') ||
      message.startsWith('📍') ||
      message.startsWith('🏠') ||
      message.startsWith('🔍') ||
      message.startsWith('🎫') ||
      // 或者包含 Quick Reply 的標準文字
      message.includes('這個表演的') ||
      message.includes('this event') ||
      message.includes('演出時間') ||
      message.includes('show time') ||
      message.includes('票價') ||
      message.includes('ticket price') ||
      message.includes('演出者') ||
      message.includes('performers')
    );
  }
  
  /**
   * 解析 Quick Reply 動作
   */
  private parseQuickReply(message: string): string {
    if (message.includes('演出時間') || message.includes('show time') || message.startsWith('⏰')) {
      return 'ask_time';
    }
    if (message.includes('票價') || message.includes('ticket price') || message.startsWith('💰')) {
      return 'ask_price';
    }
    if (message.includes('地點') || message.includes('location') || message.startsWith('📍')) {
      return 'ask_venue';
    }
    if (message.includes('演出者') || message.includes('performers') || message.startsWith('👤')) {
      return 'ask_artist';
    }
    if (message.includes('主選單') || message.includes('main menu') || message.startsWith('🏠')) {
      return 'main_menu';
    }
    // 排除純"搜尋"命令（這是搜尋引導的觸發詞）
    const trimmed = message.trim();
    const lowerTrimmed = trimmed.toLowerCase();
    if (
      trimmed === '搜尋' || 
      lowerTrimmed === 'search' || 
      trimmed === '🔍 搜尋' || 
      trimmed === '🔍 Search'
    ) {
      // 這些是搜尋引導命令，不是搜尋意圖
      return 'general';
    }
    if (message.includes('搜尋') || message.toLowerCase().includes('search') || message.startsWith('🔍')) {
      return 'search';
    }
    if (message.includes('購票') || message.includes('buy') || message.startsWith('🎫')) {
      return 'buy_ticket';
    }
    return 'follow_up';
  }
  
  /**
   * 檢測後續問題意圖
   */
  private detectFollowUpIntent(message: string, context: SessionContext): Intent {
    // 優先檢查是否包含指示詞（這個、那個等），如果有則必定是後續問題
    const hasReferenceWord = /^(這個|那個|它|他|她|該|此|本)/.test(message) || 
                            /(這個|那個|它|他|她|該|此|本)\s*(表演|演出|音樂會|演唱會|節目|活動)/.test(message);
    
    // 如果有指示詞，檢查具體問題類型
    if (hasReferenceWord || this.isAboutTime(message)) {
      if (this.isAboutTime(message)) {
        return { type: 'ASK_TIME', data: { contextType: 'FOLLOW_UP' } };
      }
      if (this.isAboutPrice(message)) {
        return { type: 'ASK_PRICE', data: { contextType: 'FOLLOW_UP' } };
      }
      if (this.isAboutVenue(message)) {
        return { type: 'ASK_VENUE', data: { contextType: 'FOLLOW_UP' } };
      }
      if (this.isAboutArtist(message)) {
        return { type: 'ASK_ARTIST', data: { contextType: 'FOLLOW_UP' } };
      }
      if (this.isAboutDetails(message)) {
        return { type: 'ASK_DETAILS', data: { contextType: 'FOLLOW_UP' } };
      }
    }
    
    // 沒有指示詞，但在 EVENT_SELECTED 狀態下，檢查是否為後續問題
    if (this.isAboutTime(message)) {
      return { type: 'ASK_TIME', data: { contextType: 'FOLLOW_UP' } };
    }
    if (this.isAboutPrice(message)) {
      return { type: 'ASK_PRICE', data: { contextType: 'FOLLOW_UP' } };
    }
    if (this.isAboutVenue(message)) {
      return { type: 'ASK_VENUE', data: { contextType: 'FOLLOW_UP' } };
    }
    if (this.isAboutArtist(message)) {
      return { type: 'ASK_ARTIST', data: { contextType: 'FOLLOW_UP' } };
    }
    if (this.isAboutDetails(message)) {
      return { type: 'ASK_DETAILS', data: { contextType: 'FOLLOW_UP' } };
    }
    
    // 預設為一般後續問題
    return { type: 'FOLLOW_UP_QUESTION', data: { question: message } };
  }
  
  /**
   * 檢查是否為時間相關問題
   */
  private isAboutTime(message: string): boolean {
    const timeKeywords = [
      '時間', '日期', '什麼時候', '何時', '何時開始', '何時結束',
      'when', 'date', 'time', 'start', 'end', '演出時間', '表演時間',
    ];
    return timeKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }
  
  /**
   * 檢查是否為價格相關問題
   */
  private isAboutPrice(message: string): boolean {
    const priceKeywords = [
      '票價', '價格', '多少錢', '價錢',
      'price', 'cost', 'ticket price', 'how much',
    ];
    return priceKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }
  
  /**
   * 檢查是否為地點相關問題
   */
  private isAboutVenue(message: string): boolean {
    const venueKeywords = [
      '地點', '在哪裡', '場館', '位置', '演出', '演出地點',
      'where', 'location', 'venue', 'place',
    ];
    // 檢查是否是複數問題（它們分別）
    const isPlural = /它們分別|它們|分別|each|all|both/.test(message);
    if (isPlural && venueKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return true;
    }
    return venueKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }
  
  /**
   * 檢查是否為演出者相關問題
   */
  private isAboutArtist(message: string): boolean {
    const artistKeywords = [
      '演出者', '表演者', '藝人', '誰', 'who',
      'performers', 'artists', 'who is',
    ];
    return artistKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }
  
  /**
   * 檢查是否為詳細資訊問題
   */
  private isAboutDetails(message: string): boolean {
    const detailKeywords = [
      '詳情', '詳細', '介紹', '簡介', '說明', '講', '內容', '是什麼', '關於',
      'details', 'info', 'information', 'introduce', 'introduction', 'about', 'describe',
    ];
    return detailKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }
  
  /**
   * 檢查是否包含搜尋關鍵字
   */
  private hasSearchKeywords(message: string): boolean {
    const trimmed = message.trim();
    const lowerTrimmed = trimmed.toLowerCase();
    
    // 排除單個字或無意義的回應
    if (trimmed.length <= 1) return false;
    
    // 排除純指令詞（包括搜尋引導命令）
    const commandWords = [
      '幫助', 'help', 'menu', '主選單', '主畫面', '回到主選單', '回到主畫面',
      '搜尋', 'search', '🔍 搜尋', '🔍 search', '🔍 Search'
    ];
    if (commandWords.includes(lowerTrimmed) || commandWords.includes(trimmed)) return false;
    
    const keywords = [
      '演唱會', '音樂會', '演出', '表演', 'concert', 'show',
      '音樂家', '鋼琴家', '有嗎', '找',
    ];
    const venueKeywords = [
      '衛武營', '國家音樂廳', '國家戲劇院', '兩廳院',
      '臺北表演藝術中心', '臺中國家歌劇院',
    ];
    
    // 如果包含明確的搜尋關鍵字或場館名稱，視為搜尋
    // 但排除純"搜尋"或"search"命令（這些是搜尋引導命令）
    if ((keywords.some(k => message.toLowerCase().includes(k)) ||
        venueKeywords.some(v => message.includes(v))) &&
        !(lowerTrimmed === '搜尋' || lowerTrimmed === 'search')) {
      return true;
    }
    
    // 如果包含至少 2 個英文字母（可能是藝人名稱，如 "Eric Lu"）
    if (/[a-zA-Z]{2,}/.test(message)) {
      return true;
    }
    
    // 如果包含至少 2 個中文字（可能是場館或藝人名稱）
    if (/[\u4e00-\u9fa5]{2,}/.test(message)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 匹配 FAQ
   */
  private matchFAQ(message: string): string | null {
    const faqKeywords = [
      { keywords: ['如何購票', '怎麼買', 'how to buy'], faq: 'how_to_buy' },
      { keywords: ['退票', '退款', 'refund'], faq: 'refund' },
      { keywords: ['取票', 'ticket pickup'], faq: 'ticket_pickup' },
      { keywords: ['註冊', 'register', '會員'], faq: 'register' },
    ];
    
    for (const faq of faqKeywords) {
      if (faq.keywords.some(k => message.toLowerCase().includes(k.toLowerCase()))) {
        return faq.faq;
      }
    }
    
    return null;
  }
}

export const intentDetector = new IntentDetector();

