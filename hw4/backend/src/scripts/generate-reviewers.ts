import { getDatabase } from '../config/database';
import { initializeDatabase } from '../config/database';
import bcrypt from 'bcrypt';

// 真實的中文姓名池（更多樣化，不重複）
const chineseNames = [
  "王小明", "李美華", "張志強", "陳淑芬", "林建國", "黃雅婷", "吳志明", "劉淑娟",
  "鄭文雄", "許美玲", "謝志豪", "蔡淑惠", "洪建華", "江雅芳", "何志偉", "羅淑玲",
  "高文斌", "梁美惠", "蘇志傑", "呂淑芬", "周建民", "葉雅君", "徐志宏", "楊淑華",
  "趙文傑", "孫美玲", "馬志強", "朱淑娟", "胡建華", "郭雅婷", "曾志明", "彭淑惠",
  "蕭文雄", "賴美玲", "邱志豪", "薛淑芬", "范建華", "宋雅芳", "唐志偉", "鄧淑玲",
  "韓文斌", "馮美惠", "于志傑", "董淑華", "程建民", "傅雅君", "沈志宏", "盧淑娟",
  "侯文傑", "史美玲", "白志強", "石淑惠", "田建華", "任雅婷", "袁志明", "常淑芬",
  "武文雄", "康美玲", "賀志豪", "嚴淑華", "尹建民", "易雅芳", "龍志偉", "段淑玲",
  "湯文斌", "黎美惠", "易志傑", "錢淑芬", "史建華", "白雅婷", "袁志明", "常淑娟",
  "武文傑", "康美玲", "賀志強", "嚴淑惠", "尹建民", "易雅芳", "龍志偉", "段淑玲",
  "陳志明", "李雅婷", "王建華", "張淑芬", "林志強", "黃美玲", "吳文雄", "劉雅芳",
  "鄭志豪", "許淑惠", "謝建華", "蔡雅婷", "洪志明", "江淑芬", "何文雄", "羅雅芳",
  "高志豪", "梁建華", "蘇淑芬", "呂雅婷", "周志明", "葉文雄", "徐雅芳", "楊志豪",
  "趙建華", "孫淑芬", "馬雅婷", "朱志明", "胡文雄", "郭雅芳", "曾志豪", "彭建華",
  "蕭淑芬", "賴雅婷", "邱志明", "薛文雄", "范雅芳", "宋志豪", "唐建華", "鄧淑芬",
  "韓雅婷", "馮志明", "于文雄", "董雅芳", "程志豪", "傅建華", "沈淑芬", "盧雅婷",
  "侯志明", "史文雄", "白雅芳", "石志豪", "田建華", "任淑芬", "袁雅婷", "常志明",
  "武文雄", "康雅芳", "賀志豪", "嚴建華", "尹淑芬", "易雅婷", "龍志明", "段文雄",
  "湯雅芳", "黎志豪", "易建華", "錢淑芬", "史雅婷", "白志明", "袁文雄", "常雅芳",
  "武志豪", "康建華", "賀淑芬", "嚴雅婷", "尹志明", "易文雄", "龍雅芳", "段志豪"
];

// 生成隨機中文姓名
function generateChineseName(): string {
  return chineseNames[Math.floor(Math.random() * chineseNames.length)];
}

// 生成隨機電子郵件（基於中文姓名）
function generateEmail(chineseName: string): string {
  const domains = ['gmail.com', 'yahoo.com.tw', 'hotmail.com', 'outlook.com', 'msn.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  // 使用中文姓名的拼音或簡化形式作為郵箱前綴
  const emailPrefix = chineseName.replace(/[^\u4e00-\u9fa5]/g, '').toLowerCase();
  return `${emailPrefix}@${domain}`;
}

export async function generateReviewers() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  console.log('👥 開始生成多樣化的評論者用戶...');

  const reviewers: number[] = [];
  const passwordHash = await bcrypt.hash('Reviewer123!', 10);

  // 生成200個評論者用戶
  for (let i = 0; i < 200; i++) {
    const chineseName = generateChineseName();
    const email = generateEmail(chineseName);
    
    const stmt = db.prepare(`
      INSERT INTO users (email, username, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    try {
      const result = stmt.run(email, chineseName, passwordHash);
      reviewers.push(result.lastInsertRowid as number);
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // 跳過重複的用戶名或郵箱
        continue;
      } else {
        throw e;
      }
    }
  }

  console.log(`✅ 已創建 ${reviewers.length} 個評論者用戶`);
  return reviewers;
}

async function main() {
  try {
    console.log('🎯 開始生成多樣化的評論者用戶...\n');
    
    // 初始化數據庫
    console.log('🔧 初始化數據庫...');
    await initializeDatabase();
    console.log('✅ 數據庫初始化完成\n');
    
    const reviewers = await generateReviewers();
    
    console.log('\n🎉 評論者用戶生成完成！');
    console.log(`📊 總共創建了 ${reviewers.length} 個評論者用戶`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  }
}

main();
