import { db, initializeDatabase } from '../config/database';

async function clearAndRegenerate() {
  console.log('🧹 開始清理現有資料...');
  
  try {
    initializeDatabase();
    
    if (!db) {
      throw new Error('資料庫未初始化');
    }
    
    // 清理現有資料
    console.log('🗑️ 清理房屋資料...');
    db.exec('DELETE FROM listings');
    
    console.log('🗑️ 清理用戶資料（保留 demo 用戶）...');
    db.exec("DELETE FROM users WHERE email != 'demo@example.com'");
    
    console.log('🗑️ 清理收藏資料...');
    db.exec('DELETE FROM favorites');
    
    console.log('🗑️ 清理評分資料...');
    db.exec('DELETE FROM ratings');
    
    console.log('✅ 資料清理完成');
    console.log('');
    
    // 重新生成修正的資料
    console.log('🔄 開始生成修正的資料...');
    
    // 直接在這裡調用生成邏輯，避免導入問題
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    await execAsync('npm run generate-corrected');
    
  } catch (error) {
    console.error('❌ 清理和重新生成資料時發生錯誤:', error);
    throw error;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  clearAndRegenerate().catch(console.error);
}

export { clearAndRegenerate };
