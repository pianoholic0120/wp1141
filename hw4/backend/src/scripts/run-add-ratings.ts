import { addMoreRatings } from './add-more-ratings';
import { initializeDatabase } from '../config/database';

async function main() {
  try {
    console.log('🎯 開始為房屋增加更多評分...\n');
    
    // 初始化數據庫
    console.log('🔧 初始化數據庫...');
    await initializeDatabase();
    console.log('✅ 數據庫初始化完成\n');
    
    const result = await addMoreRatings();
    
    console.log('\n🎉 評分增加完成！');
    console.log(`📊 總共添加了 ${result.totalRatingsAdded} 個新評分`);
    console.log(`📈 每個房屋平均有 ${result.ratingsPerListing} 個評分`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  }
}

main();
