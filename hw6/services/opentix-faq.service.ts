/**
 * OPENTIX FAQ Knowledge Base Service
 * 提供 OPENTIX 常見問題的知識庫服務
 * 支持基於關鍵字和語義的 FAQ 檢索（RAG-ready）
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  relatedQuestions?: string[];
}

export interface FAQSearchResult {
  faq: FAQ;
  score: number; // 相關性分數 (0-1)
  matchedKeywords: string[];
}

let faqDatabase: FAQ[] | null = null;

/**
 * 獲取 FAQ 知識庫文件路徑
 * 文件位於 public/ 目錄中，使用 process.cwd() 指向專案根目錄來讀取
 */
function getFAQKnowledgeBasePath(): string {
  // 在 Next.js 中，process.cwd() 通常指向專案根目錄
  // 文件位於 public/ 目錄中
  const basePath = process.cwd();
  
  // 構建所有可能的路徑（支持開發和生產環境）
  const possiblePaths = [
    // 1. 專案根目錄下的 public/ 目錄（主要路徑）
    path.join(basePath, 'public', 'OPENTIX-FAQ-Knowledge-Base.md'),
    // 2. 如果在 Next.js 構建後的 .next 目錄中運行（從 .next/server 向上查找）
    path.join(basePath, '..', 'public', 'OPENTIX-FAQ-Knowledge-Base.md'),
    path.join(basePath, '..', '..', 'public', 'OPENTIX-FAQ-Knowledge-Base.md'),
    // 3. Vercel 部署環境可能的路徑
    path.join('/var/task', 'public', 'OPENTIX-FAQ-Knowledge-Base.md'),
    path.join('/var/task', 'hw6', 'public', 'OPENTIX-FAQ-Knowledge-Base.md'),
  ];

  console.log(`[FAQ Service] Searching for FAQ file. CWD: ${basePath}`);
  console.log(`[FAQ Service] Trying ${possiblePaths.length} possible paths...`);

  for (const possiblePath of possiblePaths) {
    try {
      const normalizedPath = path.resolve(possiblePath);
      if (fs.existsSync(normalizedPath)) {
        console.log(`[FAQ Service] ✅ Found FAQ file at: ${normalizedPath}`);
        return normalizedPath;
      }
    } catch (err) {
      // 忽略路徑檢查錯誤，繼續嘗試下一個路徑
      continue;
    }
  }

  // 如果所有路徑都失敗，記錄詳細信息
  console.warn(`[FAQ Service] ❌ FAQ file not found in any of these paths:`);
  possiblePaths.forEach((p, i) => {
    try {
      const normalizedPath = path.resolve(p);
      console.warn(`  ${i + 1}. ${normalizedPath}`);
    } catch {
      console.warn(`  ${i + 1}. ${p} (invalid path)`);
    }
  });
  console.warn(`[FAQ Service] Current working directory: ${basePath}`);
  
  // 返回第一個可能的路徑（即使不存在，讓調用者處理錯誤）
  const defaultPath = path.resolve(path.join(basePath, 'public', 'OPENTIX-FAQ-Knowledge-Base.md'));
  return defaultPath;
}

/**
 * 初始化 FAQ 資料庫（從 Markdown 文件解析）
 */
export async function initializeFAQDatabase(): Promise<FAQ[]> {
  if (faqDatabase) {
    return faqDatabase;
  }

  try {
    const faqPath = getFAQKnowledgeBasePath();
    
    if (!fs.existsSync(faqPath)) {
      console.warn(`[FAQ Service] FAQ knowledge base file not found at: ${faqPath}`);
      console.warn(`[FAQ Service] Current working directory: ${process.cwd()}`);
      console.warn(`[FAQ Service] __dirname equivalent: ${__dirname || 'N/A'}`);
      return [];
    }

    const content = fs.readFileSync(faqPath, 'utf-8');
    faqDatabase = parseFAQFromMarkdown(content);
    console.log(`[FAQ Service] Successfully loaded ${faqDatabase.length} FAQs from ${faqPath}`);
    return faqDatabase;
  } catch (error) {
    console.error('[FAQ Service] Failed to load FAQ database:', error);
    if (error instanceof Error) {
      console.error('[FAQ Service] Error details:', error.message, error.stack);
    }
    return [];
  }
}

/**
 * 從 Markdown 文件解析 FAQ
 */
function parseFAQFromMarkdown(content: string): FAQ[] {
  const faqs: FAQ[] = [];
  const sections = content.split(/\n(?=##)/); // 按章節分割
  
  let currentCategory = '';
  let faqId = 0;

  for (const section of sections) {
    // 提取章節標題（類別）
    const categoryMatch = section.match(/^##\s+(.+)$/m);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
    }

    // 提取 Q&A
    const qaPattern = /###\s+Q:\s*(.+?)\n\s*\*\*A:\*\*\s*([\s\S]*?)(?=\n###|\n---|$)/g;
    let match;

    while ((match = qaPattern.exec(section)) !== null) {
      const question = match[1].trim();
      let answer = match[2].trim();

      // 清理答案中的 Markdown 格式
      answer = answer
        .replace(/\*\*(.+?)\*\*/g, '$1') // 粗體
        .replace(/\*(.+?)\*/g, '$1') // 斜體
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 連結
        .replace(/```[\s\S]*?```/g, '') // 代碼塊
        .replace(/^\s*[-•]\s+/gm, '') // 列表標記
        .trim();

      // 提取關鍵字（從問題和答案中）
      const keywords = extractKeywords(question, answer);

      faqs.push({
        id: `faq-${++faqId}`,
        question,
        answer,
        category: currentCategory || '其他',
        keywords,
      });
    }
  }

  return faqs;
}

/**
 * 從問題和答案中提取關鍵字
 */
function extractKeywords(question: string, answer: string): string[] {
  const keywords = new Set<string>();
  const text = `${question} ${answer}`.toLowerCase();

  // 重要關鍵字列表
  const importantKeywords = [
    // 會員相關
    '會員', '註冊', '登入', '密碼', '帳號', '綁定',
    'member', 'register', 'login', 'password', 'account',
    
    // 購票相關
    '購票', '訂票', '票券', '買票', '購買',
    'buy', 'ticket', 'purchase', 'booking',
    
    // 取票相關
    '取票', '電子票', '超商', '分銷點', '郵寄',
    'pickup', 'electronic', 'convenience', 'delivery',
    
    // 退票相關
    '退票', '退款', '換票', '取消',
    'refund', 'cancel', 'exchange',
    
    // 支付相關
    '付款', '支付', '信用卡', '轉帳',
    'payment', 'credit', 'transfer',
    
    // 優惠相關
    '優惠', '折扣', '文化幣', '紅利',
    'discount', 'promotion', 'coupon',
    
    // 場館相關
    '場館', '地點', '位置', '地址',
    'venue', 'location', 'address',
    
    // OPENTIX Live
    '線上觀演', '直播', '錄播',
    'live', 'streaming', 'online',
    
    // 其他
    '客服', '聯絡', '電話', 'email',
    'customer', 'service', 'contact',
  ];

  // 檢查關鍵字
  for (const keyword of importantKeywords) {
    if (text.includes(keyword)) {
      keywords.add(keyword);
    }
  }

  // 提取問題中的核心名詞（中文2-4字）
  const chineseNouns = text.match(/[\u4e00-\u9fa5]{2,4}/g);
  if (chineseNouns) {
    chineseNouns.forEach(noun => {
      if (noun.length >= 2 && noun.length <= 4) {
        keywords.add(noun);
      }
    });
  }

  return Array.from(keywords);
}

/**
 * 搜尋相關 FAQ
 * @param query 使用者查詢
 * @param limit 返回結果數量限制
 */
export async function searchFAQ(
  query: string,
  limit: number = 3
): Promise<FAQSearchResult[]> {
  const faqs = await initializeFAQDatabase();
  if (faqs.length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results: FAQSearchResult[] = [];

  for (const faq of faqs) {
    const score = calculateRelevanceScore(faq, normalizedQuery);
    if (score > 0) {
      const matchedKeywords = findMatchedKeywords(faq, normalizedQuery);
      results.push({
        faq,
        score,
        matchedKeywords,
      });
    }
  }

  // 按分數排序，返回前 N 個
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 計算 FAQ 與查詢的相關性分數
 */
function calculateRelevanceScore(faq: FAQ, query: string): number {
  let score = 0;
  const questionLower = faq.question.toLowerCase();
  const answerLower = faq.answer.toLowerCase();
  const queryLower = query.toLowerCase();

  // 0. 問題完全匹配（最高分 - 優先處理精確匹配）
  // 移除問號、標點符號、常見詞彙後比較
  const removeCommonWords = (text: string): string => {
    return text
      .replace(/[？?。，、\s]/g, '')
      .replace(/(opentix|會員|帳號|帳戶|身分|身份)/gi, ''); // 移除常見詞彙
  };
  
  const cleanQuestion = removeCommonWords(questionLower);
  const cleanQuery = removeCommonWords(queryLower);
  
  // 完全匹配（移除常見詞彙後）
  if (cleanQuestion === cleanQuery) {
    score += 100; // 極高分，確保精確匹配排在第一位
    return score;
  }
  
  // 部分包含匹配（允許少了"OPENTIX"這樣的詞）
  if (cleanQuestion.includes(cleanQuery) || cleanQuery.includes(cleanQuestion)) {
    // 檢查匹配比例
    const longer = cleanQuestion.length > cleanQuery.length ? cleanQuestion : cleanQuery;
    const shorter = cleanQuestion.length > cleanQuery.length ? cleanQuery : cleanQuestion;
    const matchRatio = shorter.length / longer.length;
    
    if (matchRatio > 0.8) {
      score += 80; // 高度匹配
    } else if (matchRatio > 0.6) {
      score += 60; // 中度匹配
    } else {
      score += 40; // 低度匹配
    }
  }
  
  // 原問題（含常見詞彙）的完全匹配
  const originalCleanQuestion = questionLower.replace(/[？?。，、\s]/g, '');
  const originalCleanQuery = queryLower.replace(/[？?。，、\s]/g, '');
  
  if (originalCleanQuestion === originalCleanQuery ||
      originalCleanQuestion.includes(originalCleanQuery) ||
      originalCleanQuery.includes(originalCleanQuestion)) {
    score += 50; // 原始匹配也給高分
  }

  // 1. 問題關鍵部分匹配（高優先級）
  // 提取問題中的關鍵詞（移除常見的疑問詞）
  const questionKeyWords = questionLower
    .replace(/(是什麼|什麼|如何|怎麼|怎麼辦|為何|為什麼|能否|可以|是否)/g, '')
    .replace(/[？?。，、\s]/g, '');
  const queryKeyWords = queryLower
    .replace(/(是什麼|什麼|如何|怎麼|怎麼辦|為何|為什麼|能否|可以|是否)/g, '')
    .replace(/[？?。，、\s]/g, '');
  
  if (questionKeyWords && queryKeyWords) {
    // 計算關鍵詞的重疊度
    const questionChars = questionKeyWords.split('');
    const queryChars = queryKeyWords.split('');
    const commonChars = questionChars.filter(char => queryChars.includes(char));
    const overlap = commonChars.length / Math.max(questionChars.length, queryChars.length);
    
    if (overlap > 0.5) {
      score += 20; // 高相關性
    } else if (overlap > 0.3) {
      score += 10; // 中等相關性
    }
  }

  // 2. 問題部分匹配（處理中文無空格的情況）
  // 先嘗試按空格分割（英文），如果沒有空格則按字符分割（中文）
  const splitWords = (text: string): string[] => {
    const spaced = text.replace(/[？?。，、]/g, '').split(/\s+/).filter(w => w.length > 1);
    if (spaced.length > 1) {
      return spaced; // 有空格，返回分割後的詞
    }
    // 沒有空格（中文），嘗試提取關鍵詞（2-4字的詞組）
    const chars = text.replace(/[？?。，、\s]/g, '');
    const words: string[] = [];
    for (let i = 0; i < chars.length - 1; i++) {
      // 提取2-4字的詞組
      for (let len = 2; len <= 4 && i + len <= chars.length; len++) {
        words.push(chars.substring(i, i + len));
      }
    }
    return words;
  };
  
  const questionWords = splitWords(questionLower);
  const queryWords = splitWords(queryLower);
  
  const matchingWords = queryWords.filter(qw => 
    questionWords.some(q => q.includes(qw) || qw.includes(q) || q === qw)
  );
  score += matchingWords.length * 3; // 增加權重

  // 3. 關鍵字匹配
  const matchedKeywords = findMatchedKeywords(faq, query);
  score += matchedKeywords.length * 2; // 增加權重

  // 4. 答案中包含查詢關鍵字
  const answerContainsQuery = queryWords.some(qw => 
    qw.length > 1 && answerLower.includes(qw)
  );
  if (answerContainsQuery) {
    score += 2;
  }

  // 5. 類別匹配（如果查詢中包含類別關鍵字）
  const categoryKeywords: { [key: string]: string[] } = {
    '會員相關': ['會員', '註冊', '登入', '密碼', '帳號', '綁定', '國家兩廳院'],
    '購票流程': ['購票', '買票', '訂票', '折扣', '優惠'],
    '取票方式': ['取票', '領票', '電子票', '代碼', '更改'],
    '退票政策': ['退票', '退款', '取消'],
    '支付方式': ['付款', '支付', '信用卡'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (faq.category === category && keywords.some(kw => queryLower.includes(kw))) {
      score += 3; // 增加權重
    }
  }

  // 6. 問題中包含重要的連接詞或結構詞（提高相關性）
  const importantConnectors = ['和', '與', '或', '以及', '以及', '能否', '可以', '是否'];
  const hasImportantStructure = importantConnectors.some(connector => 
    questionLower.includes(connector) && queryLower.includes(connector)
  );
  if (hasImportantStructure) {
    score += 5;
  }

  return score;
}

/**
 * 找出匹配的關鍵字
 */
function findMatchedKeywords(faq: FAQ, query: string): string[] {
  const matched: string[] = [];
  const queryLower = query.toLowerCase();

  for (const keyword of faq.keywords) {
    if (queryLower.includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(queryLower)) {
      matched.push(keyword);
    }
  }

  return matched;
}

/**
 * 格式化 FAQ 結果為提示詞格式
 */
export function formatFAQForPrompt(searchResults: FAQSearchResult[]): string {
  if (searchResults.length === 0) {
    return '';
  }

  let formatted = '\n\n【🚨 極重要 - OPENTIX 常見問題知識庫 🚨】\n';
  formatted += '以下 FAQ 是系統從 OPENTIX 官方知識庫中找到的，**必須優先使用這些答案回答使用者**。\n\n';

  for (const result of searchResults) {
    formatted += `**問題**：${result.faq.question}\n`;
    formatted += `**標準答案**：${result.faq.answer}\n`; // 提供完整答案，不要截斷
    formatted += `**相關性分數**：${result.score.toFixed(1)}\n`;
    if (result.matchedKeywords.length > 0) {
      formatted += `**匹配關鍵字**：${result.matchedKeywords.join('、')}\n`;
    }
    formatted += `**類別**：${result.faq.category}\n`;
    formatted += `\n---\n\n`;
  }

  formatted += '【⚠️ 極重要指示 - 必須嚴格遵守 ⚠️】\n';
  formatted += '1. **如果使用者的問題與上述 FAQ 中的任何一個問題相同或高度相關**，\n';
  formatted += '   **必須使用上述「標準答案」回答，不要自己編造或給出通用流程說明**\n';
  formatted += '2. **使用上述標準答案的核心內容**，但用自然、友善的語氣轉換為對話形式\n';
  formatted += '3. **不要給出通用的流程說明**（如「前往官網→註冊→填寫資料」），\n';
  formatted += '   如果使用者問的是具體問題，直接回答具體答案\n';
  formatted += '4. **範例**：\n';
  formatted += '   - 如果使用者問：「OPENTIX 會員和國家兩廳院會員是否相同？」\n';
  formatted += '     正確回答：「否。自2020年11月試營運起，OPENTIX兩廳院文化生活會員與國家兩廳院會員已脫鉤，為獨立的會員系統。」\n';
  formatted += '     錯誤回答：「要註冊會員，請前往官網...」（這是通用流程，不是具體答案）\n';
  formatted += '5. **如果 FAQ 中有連結或電話**，請直接提供給使用者\n';
  formatted += '6. **如果使用者的問題與上述 FAQ 不完全匹配**，但相關性較高（分數 > 5），\n';
  formatted += '   可以使用相關的 FAQ 答案，但需說明這是「相關資訊」\n';
  formatted += '7. **絕對不要**在沒有找到相關 FAQ 時，給出通用的流程說明來回答具體問題\n';

  return formatted;
}

/**
 * 檢測查詢是否為 FAQ 相關問題
 */
export function isFAQQuery(query: string): boolean {
  const faqKeywords = [
    '如何', '怎麼', '為什麼', '什麼是', '什麼時候', '哪裡',
    '是否', '能否', '可以', '是否相同',
    '怎麼辦', '怎麼做', '如何處理', '怎辦', '怎辦', // 口语化：怎辦
    '流程', '步驟', '步驟', // 流程、步骤
    '是什麼', '是什麼', // 是什么
    'how', 'what', 'why', 'when', 'where', 'whether', 'can',
    '退票', '購票', '取票', '付款', '會員', '註冊', '密碼',
    '綁定', '帳號', '身分', '國家兩廳院', 'opentix',
    '折扣', '優惠', '代碼', '更改',
    '忘記', '忘掉', '忘掉了', // 口语化：忘记、忘掉、忘掉了
    'refund', 'ticket', 'pickup', 'payment', 'member', 'register',
    'discount', 'coupon', 'code',
  ];

  const normalizedQuery = query.toLowerCase();
  
  // 检查是否包含 FAQ 关键字
  const hasFAQKeyword = faqKeywords.some(keyword => normalizedQuery.includes(keyword));
  
  // 检查是否包含问号
  const hasQuestionMark = normalizedQuery.includes('?') || normalizedQuery.includes('？');
  
  // 检查是否包含口语化问题模式（如"XX的流程是什麼"、"XX怎麼辦"）
  const hasQuestionPattern = /(流程|步驟|怎麼|如何|怎辦|怎麼辦).*(是|做|處理|辦)/.test(normalizedQuery) ||
                              /(是|做|處理|辦).*(流程|步驟|怎麼|如何|怎辦|怎麼辦)/.test(normalizedQuery);
  
  return hasFAQKeyword || hasQuestionMark || hasQuestionPattern;
}
