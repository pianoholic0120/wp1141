/**
 * Conversation State Machine
 * 基於狀態處理訊息
 */

import { Session, ConversationState, SessionContext } from './session-manager.service';
import { Intent, IntentType } from './intent-detector.service';
import { intentDetector } from './intent-detector.service';

export interface StateTransition {
  nextState: ConversationState;
  action: Action;
}

export type ActionType =
  | 'SEARCH_EVENTS'
  | 'ANSWER_EVENT_QUESTION'
  | 'SHOW_EVENT_DETAILS'
  | 'SHOW_EVENT_LIST'
  | 'SHOW_FAQ'
  | 'SHOW_MAIN_MENU'
  | 'CLEAR_SESSION'
  | 'GENERAL_QUESTION'
  | 'NO_ACTION';

export interface Action {
  type: ActionType;
  data?: any;
}

export class ConversationStateMachine {
  /**
   * 處理訊息並決定下一個狀態和動作
   */
  async handleMessage(session: Session, message: string): Promise<StateTransition> {
    const currentState = session.state;
    
    // 檢測意圖
    const intent = intentDetector.detect(message, session.context, currentState);
    
    // 檢查全域指令 (優先權最高)
    if (intent.type === 'GLOBAL_COMMAND') {
      return this.handleGlobalCommand(intent);
    }
    
    // 檢查 Quick Reply 動作
    if (intent.type === 'QUICK_REPLY') {
      return this.handleQuickReply(session, intent);
    }
    
    // 基於當前狀態處理
    switch (currentState) {
      case ConversationState.IDLE:
        return this.handleIdleState(message, intent);
        
      case ConversationState.EVENT_SELECTED:
        return this.handleEventSelectedState(session, message, intent);
        
      case ConversationState.EVENT_LIST:
        return this.handleEventListState(session, message, intent);
        
      case ConversationState.FAQ_MODE:
        return this.handleFAQState(message, intent);
        
      default:
        return this.handleIdleState(message, intent);
    }
  }
  
  /**
   * 處理全域指令
   */
  private handleGlobalCommand(intent: Intent): StateTransition {
    const command = intent.data;
    
    if (command === 'main_menu' || command === 'help') {
      return {
        nextState: ConversationState.IDLE,
        action: {
          type: 'SHOW_MAIN_MENU',
        },
      };
    }
    
    return {
      nextState: ConversationState.IDLE,
      action: {
        type: 'NO_ACTION',
      },
    };
  }
  
  /**
   * 處理 Quick Reply 動作
   */
  private handleQuickReply(session: Session, intent: Intent): StateTransition {
    const actionType = intent.data;
    
    // 如果當前狀態是 EVENT_SELECTED 或 EVENT_LIST，從上下文回答
    if (
      session.state === ConversationState.EVENT_SELECTED ||
      session.state === ConversationState.EVENT_LIST
    ) {
      return {
        nextState: session.state, // 保持狀態
        action: {
          type: 'ANSWER_EVENT_QUESTION',
          data: {
            questionType: actionType,
            event: session.context.selectedEvent || session.context.lastSearchResults?.[0],
          },
        },
      };
    }
    
    // 如果是主選單按鈕
    if (actionType === 'main_menu') {
      return {
        nextState: ConversationState.IDLE,
        action: {
          type: 'SHOW_MAIN_MENU',
        },
      };
    }
    
    // 如果是搜尋按鈕
    if (actionType === 'search') {
      return {
        nextState: ConversationState.IDLE,
        action: {
          type: 'NO_ACTION', // 讓使用者輸入搜尋關鍵字
        },
      };
    }
    
    return {
      nextState: session.state,
      action: {
        type: 'NO_ACTION',
      },
    };
  }
  
  /**
   * 處理 IDLE 狀態
   */
  private handleIdleState(message: string, intent: Intent): StateTransition {
    if (intent.type === 'SEARCH') {
      return {
        nextState: ConversationState.SEARCHING,
        action: {
          type: 'SEARCH_EVENTS',
          data: { query: intent.data?.query || message },
        },
      };
    }
    
    if (intent.type === 'FAQ') {
      return {
        nextState: ConversationState.FAQ_MODE,
        action: {
          type: 'SHOW_FAQ',
          data: { question: intent.data?.question },
        },
      };
    }
    
    // 檢查是否為一般問題（非搜尋意圖）
    if (intent.type === 'GENERAL') {
      // 判斷是否真的像搜尋查詢（包含藝人名、場館名、演出類型等）
      const looksLikeSearch = this.looksLikeSearchQuery(message);
      if (looksLikeSearch) {
        // 看起來像搜尋，當作搜尋處理
        return {
          nextState: ConversationState.SEARCHING,
          action: {
            type: 'SEARCH_EVENTS',
            data: { query: message },
          },
        };
      } else {
        // 不像搜尋，使用 LLM 回答一般問題
        return {
          nextState: ConversationState.IDLE,
          action: {
            type: 'GENERAL_QUESTION',
            data: { message },
          },
        };
      }
    }
    
    // 預設：視為搜尋
    return {
      nextState: ConversationState.SEARCHING,
      action: {
        type: 'SEARCH_EVENTS',
        data: { query: message },
      },
    };
  }
  
  /**
   * 判斷訊息是否看起來像搜尋查詢
   */
  private looksLikeSearchQuery(message: string): boolean {
    const lower = message.toLowerCase().trim();
    
    // 排除純搜尋引導命令
    if (lower === '搜尋' || lower === 'search' || lower === '🔍 搜尋' || lower === '🔍 search' || lower === '🔍 Search') {
      return false;
    }
    
    // 常見的搜尋關鍵字
    const searchKeywords = [
      // 藝人名稱模式（英文全名、中文姓名）
      /\b([A-ZÀ-ÿ][a-zà-ÿ]+\s+[A-ZÀ-ÿ][a-zà-ÿ]+)\b/,  // 英文全名
      /[\u4e00-\u9fa5]{2,4}/,  // 中文姓名（2-4字）
      
      // 場館名稱
      /(音樂廳|戲劇院|歌劇院|表演廳|演奏廳|hall|theater|theatre|venue|center|centre)/i,
      
      // 演出類型
      /(室內樂|獨奏會|協奏曲|交響樂|四重奏|音樂會|演唱會|chamber|recital|concerto|symphony|quartet|concert)/i,
      
      // 日期相關（可能是搜尋特定日期的演出）
      /(今天|明天|本週|下週|這個月|下個月|today|tomorrow|this week|next week|this month|next month)/i,
    ];
    
    // 如果包含任何搜尋關鍵字，視為搜尋查詢
    if (searchKeywords.some(pattern => pattern.test(message))) {
      return true;
    }
    
    // 如果訊息太短（少於3個字），不太可能是搜尋
    if (message.length < 3) {
      return false;
    }
    
    // 如果包含明確的問題詞（如何、怎麼、什麼、what、how），可能是問題而非搜尋
    const questionWords = /(如何|怎麼|什麼|怎樣|為何|為什麼|what|how|why|when|where)/i;
    if (questionWords.test(message)) {
      // 但如果問題是關於演出的（如"今天有什麼表演"），仍視為搜尋
      const eventRelated = /(表演|演出|音樂會|演唱會|節目|活動|event|show|concert|performance)/i;
      if (eventRelated.test(message)) {
        return true;  // "今天有什麼表演" → 搜尋
      }
      return false;  // "我可以怎麼問你問題" → 一般問題
    }
    
    // 預設：如果訊息夠長且不包含問題詞，視為搜尋
    return message.length >= 3;
  }
  
  /**
   * 處理 EVENT_SELECTED 狀態
   * 在這個狀態下,所有問題都是關於已選擇的演出
   */
  private handleEventSelectedState(
    session: Session,
    message: string,
    intent: Intent
  ): StateTransition {
    const event = session.context.selectedEvent;
    
    if (!event) {
      // 如果沒有選中的演出，回到 IDLE
      return {
        nextState: ConversationState.IDLE,
        action: {
          type: 'NO_ACTION',
        },
      };
    }
    
    // 檢查是否為新搜尋
    // 如果 intent detector 判斷為 SEARCH，優先處理為新搜尋
    // 只有在明確是後續問題時（ASK_TIME, ASK_PRICE 等）才繼續使用當前演出的上下文
    if (intent.type === 'SEARCH') {
      return {
        nextState: ConversationState.SEARCHING,
        action: {
          type: 'SEARCH_EVENTS',
          data: { query: intent.data?.query || message },
        },
      };
    }
    
    // 對於後續問題類型，繼續使用當前演出的上下文
    if (
      intent.type === 'ASK_TIME' ||
      intent.type === 'ASK_PRICE' ||
      intent.type === 'ASK_VENUE' ||
      intent.type === 'ASK_ARTIST' ||
      intent.type === 'ASK_DETAILS' ||
      intent.type === 'FOLLOW_UP_QUESTION'
    ) {
    return {
        nextState: ConversationState.EVENT_SELECTED,
      action: {
        type: 'ANSWER_EVENT_QUESTION',
        data: {
          event,
          question: message,
          intent: intent.type,
        },
        },
      };
    }
    
    // 其他情況（GENERAL等），視為新搜尋以避免錯誤
    return {
      nextState: ConversationState.SEARCHING,
      action: {
        type: 'SEARCH_EVENTS',
        data: { query: message },
      },
    };
  }
  
  /**
   * 處理 EVENT_LIST 狀態
   */
  private handleEventListState(
    session: Session,
    message: string,
    intent: Intent
  ): StateTransition {
    const results = session.context.lastSearchResults || [];
    
    // 檢查是否選擇了某個演出（例如：用戶輸入 "1" 或 "第一個"）
    const selectedIndex = this.parseEventSelection(message, results.length);
    if (selectedIndex !== null) {
      return {
        nextState: ConversationState.EVENT_SELECTED,
        action: {
          type: 'SHOW_EVENT_DETAILS',
          data: {
            event: results[selectedIndex],
            index: selectedIndex,
          },
        },
      };
    }
    
    // 檢查是否為新搜尋
    // 如果 intent detector 判斷為 SEARCH，優先處理為新搜尋
    if (intent.type === 'SEARCH') {
      return {
        nextState: ConversationState.SEARCHING,
        action: {
          type: 'SEARCH_EVENTS',
          data: { query: intent.data?.query || message },
        },
      };
    }
    
    // 預設：回答關於列表的問題
    return {
      nextState: ConversationState.EVENT_LIST,
      action: {
        type: 'ANSWER_EVENT_QUESTION',
        data: {
          events: results,
          question: message,
          intent: intent.type,
        },
      },
    };
  }
  
  /**
   * 處理 FAQ 狀態
   */
  private handleFAQState(message: string, intent: Intent): StateTransition {
    if (intent.type === 'SEARCH') {
      return {
        nextState: ConversationState.SEARCHING,
        action: {
          type: 'SEARCH_EVENTS',
          data: { query: intent.data?.query || message },
        },
      };
    }
    
    return {
      nextState: ConversationState.FAQ_MODE,
      action: {
        type: 'SHOW_FAQ',
        data: { question: intent.data?.question || message },
      },
    };
  }
  
  /**
   * 解析事件選擇（例如：用戶輸入 "1" 或 "第一個"）
   */
  private parseEventSelection(message: string, maxIndex: number): number | null {
    // 匹配數字
    const numberMatch = message.match(/^(\d+)$/);
    if (numberMatch) {
      const index = parseInt(numberMatch[1], 10) - 1;
      if (index >= 0 && index < maxIndex) {
        return index;
      }
    }
    
    // 匹配中文數字
    const chineseNumbers: { [key: string]: number } = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '第一個': 1, '第二個': 2, '第三個': 3, '第四個': 4, '第五個': 5,
    };
    
    for (const [key, value] of Object.entries(chineseNumbers)) {
      if (message.includes(key)) {
        const index = value - 1;
        if (index >= 0 && index < maxIndex) {
          return index;
        }
      }
    }
    
    return null;
  }
}

export const stateMachine = new ConversationStateMachine();

