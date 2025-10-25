import Database from 'better-sqlite3';
import { generateTaiwanData } from './generate-taiwan-data';

async function main() {
  // 初始化資料庫
  const db = new Database('./database/rental_listings.db');

  try {
    console.log('🚀 開始生成全台房屋資料...');
    
    const result = await generateTaiwanData(db);
    
    console.log('\n📊 生成結果統計:');
    console.log(`👥 房東用戶: ${result.users} 個`);
    console.log(`🏠 房屋資料: ${result.listings} 個`);
    console.log(`❤️  收藏數據: ${result.favorites} 個`);
    console.log(`⭐ 評分數據: ${result.ratings} 個`);
    
    console.log('\n🎉 全台房屋資料生成完成！');
    console.log('💡 提示: 請重啟後端服務器以載入新資料');
    
  } catch (error) {
    console.error('❌ 生成資料時發生錯誤:', error);
  } finally {
    db.close();
  }
}

main();
