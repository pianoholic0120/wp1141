import { getDatabase } from '../config/database';
import { initializeDatabase } from '../config/database';

export async function clearAllRatings() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  console.log('🗑️ 清除所有現有評分...');
  
  // 清除所有評分
  const deleteStmt = db.prepare('DELETE FROM ratings');
  const result = deleteStmt.run();
  
  console.log(`✅ 已清除 ${result.changes} 個評分`);
  
  return result.changes;
}

async function main() {
  try {
    console.log('🎯 開始清除評分數據...\n');
    
    // 初始化數據庫
    console.log('🔧 初始化數據庫...');
    await initializeDatabase();
    console.log('✅ 數據庫初始化完成\n');
    
    const deletedCount = await clearAllRatings();
    
    console.log('\n🎉 評分清除完成！');
    console.log(`📊 總共清除了 ${deletedCount} 個評分`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  }
}

main();
