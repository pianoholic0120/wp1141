import { getDatabase } from '../config/database';

// 評分和評論的對應關係
const ratingData = {
  5: [
    "非常棒的房源！環境優美，房東人很好，強烈推薦！",
    "交通便利，生活機能完善，住得很舒服！",
    "設備齊全，採光良好，性價比很高！",
    "安靜舒適，鄰居友善，是理想的居住環境！",
    "房東很負責，維修及時，住得很安心！",
    "位置絕佳，附近有超市和餐廳，生活很方便！",
    "房間寬敞明亮，裝潢新穎，非常滿意！",
    "管理完善，安全有保障，推薦給大家！",
    "價格合理，服務周到，值得推薦！",
    "環境清幽，空氣清新，是居住的好選擇！",
    "住了一年多，整體體驗非常好！",
    "房東很貼心，有任何問題都會及時處理！",
    "鄰居都很友善，社區環境很棒！",
    "交通超方便，上班通勤很輕鬆！",
    "房間設計很棒，空間利用得很好！",
    "管理員很專業，安全措施完善！",
    "價格公道，性價比超高！",
    "採光超好，每天都有好心情！",
    "隔音效果不錯，晚上很安靜！",
    "設施新穎，住起來很舒適！"
  ],
  4: [
    "整體不錯，交通方便，性價比還可以！",
    "房間乾淨整潔，房東態度友善！",
    "位置不錯，生活機能完善！",
    "設備基本齊全，住起來還算舒適！",
    "環境安靜，適合居住！",
    "價格合理，服務態度良好！",
    "交通便利，購物方便！",
    "房間採光不錯，整體滿意！",
    "管理還算完善，住得安心！",
    "性價比不錯，推薦給大家！",
    "住了一段時間，整體還算滿意！",
    "房東人還不錯，有問題會幫忙處理！",
    "鄰居相處融洽，環境還算安靜！",
    "交通算方便，但偶爾會塞車！",
    "房間大小剛好，但裝潢有點舊！",
    "管理還算可以，但有些小細節需要改善！",
    "價格還算合理，但希望能更便宜一點！",
    "採光還可以，但有些角落比較暗！",
    "隔音效果一般，但還能接受！",
    "設施基本都有，但有些需要更新！"
  ],
  3: [
    "還可以，基本需求都能滿足！",
    "一般般，沒有特別突出的地方！",
    "價格合理，但設施有些老舊！",
    "位置不錯，但房間有點小！",
    "基本設施都有，但需要改善！",
    "住起來還可以，但有些小問題！",
    "性價比一般，不算太差！",
    "環境還可以，但噪音有點大！",
    "基本滿意，但希望更好！",
    "還算可以，但有待改進！",
    "住了一段時間，感覺普普通通！",
    "房東態度一般，有問題處理比較慢！",
    "鄰居還算友善，但有些比較吵！",
    "交通還可以，但高峰期會很擠！",
    "房間大小適中，但裝潢有點過時！",
    "管理還可以，但效率有待提升！",
    "價格中等，不算便宜也不算貴！",
    "採光一般，有些房間比較暗！",
    "隔音效果普通，能聽到鄰居聲音！",
    "設施基本齊全，但有些老舊！"
  ],
  2: [
    "有些問題，需要改善！",
    "價格偏高，性價比一般！",
    "設施老舊，需要更新！",
    "管理不夠完善，有些困擾！",
    "環境還可以，但服務有待提升！",
    "基本需求能滿足，但體驗一般！",
    "有些小問題，希望改善！",
    "價格合理，但服務需要改進！",
    "住得還可以，但不算太好！",
    "基本滿意，但期待更好！",
    "住了一段時間，發現不少問題！",
    "房東態度不太好，處理問題很慢！",
    "鄰居有些吵，影響休息！",
    "交通不太方便，要走一段路！",
    "房間有點小，空間利用不好！",
    "管理效率低，有問題很難解決！",
    "價格偏高，性價比不太划算！",
    "採光不好，房間比較暗！",
    "隔音效果差，晚上很吵！",
    "設施老舊，經常故障！"
  ],
  1: [
    "不推薦，有很多問題！",
    "服務態度差，管理混亂！",
    "設施老舊，環境不佳！",
    "價格不合理，性價比低！",
    "住得不舒服，不建議！",
    "問題很多，需要大幅改善！",
    "管理不善，服務品質差！",
    "環境吵雜，不適合居住！",
    "設施故障頻繁，維修不及時！",
    "整體體驗很差，不推薦！",
    "住了一個月就想搬走！",
    "房東態度惡劣，完全不負責任！",
    "鄰居很吵，完全無法休息！",
    "交通超不方便，每天都要走很久！",
    "房間超小，根本住不下！",
    "管理超差，有問題完全不理！",
    "價格超貴，完全不值得！",
    "採光超差，房間像地下室！",
    "隔音超差，整晚都睡不好！",
    "設施超爛，什麼都壞！"
  ]
};

// 生成評分和對應的評論
function generateRatingAndComment(): { rating: number; comment: string } {
  const random = Math.random();
  let rating: number;
  
  if (random < 0.05) rating = 1; // 5% 1星
  else if (random < 0.15) rating = 2; // 10% 2星
  else if (random < 0.35) rating = 3; // 20% 3星
  else if (random < 0.65) rating = 4; // 30% 4星
  else rating = 5; // 35% 5星
  
  // 根據評分選擇對應的評論
  const comments = ratingData[rating as keyof typeof ratingData];
  const comment = comments[Math.floor(Math.random() * comments.length)];
  
  return { rating, comment };
}

// 生成隨機用戶ID（模擬不同用戶的評分）
function generateRandomUserId(availableUserIds: number[]): number {
  return availableUserIds[Math.floor(Math.random() * availableUserIds.length)];
}

// 生成隨機日期（過去6個月內）
function generateRandomDate(): string {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime).toISOString();
}

export async function addMoreRatings() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  console.log('🚀 開始為房屋增加更多評分...');

  // 獲取所有房屋ID
  const listingsStmt = db.prepare('SELECT id FROM listings ORDER BY id');
  const listings = listingsStmt.all() as { id: number }[];
  
  // 只獲取評論者用戶ID（排除房東用戶）
  const usersStmt = db.prepare(`
    SELECT id FROM users 
    WHERE username NOT LIKE 'landlord%' 
    ORDER BY id
  `);
  const users = usersStmt.all() as { id: number }[];
  const availableUserIds = users.map(u => u.id);
  
  console.log(`📋 找到 ${listings.length} 個房屋`);
  console.log(`👥 找到 ${availableUserIds.length} 個用戶`);

  let totalRatingsAdded = 0;
  let ratingsPerListing = 0;

  // 為每個房屋生成3-5個評分
  for (const listing of listings) {
    const numRatings = Math.floor(Math.random() * 3) + 3; // 3-5個評分
    ratingsPerListing = numRatings;
    
    for (let i = 0; i < numRatings; i++) {
      const { rating, comment } = generateRatingAndComment();
      const userId = generateRandomUserId(availableUserIds);
      const createdAt = generateRandomDate();
      
      const stmt = db.prepare(`
        INSERT INTO ratings (user_id, listing_id, rating, comment, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      try {
        stmt.run(userId, listing.id, rating, comment, createdAt, createdAt);
        totalRatingsAdded++;
      } catch (e: any) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          // 跳過重複的評分（同一用戶對同一房屋的評分）
          continue;
        } else {
          console.error(`插入評分失敗 (房屋ID: ${listing.id}):`, e.message);
        }
      }
    }
  }

  console.log(`✅ 已為每個房屋添加 ${ratingsPerListing} 個評分`);
  console.log(`📊 總共添加了 ${totalRatingsAdded} 個新評分`);

  // 統計評分分布
  const ratingStatsStmt = db.prepare(`
    SELECT rating, COUNT(*) as count 
    FROM ratings 
    GROUP BY rating 
    ORDER BY rating
  `);
  const ratingStats = ratingStatsStmt.all() as { rating: number; count: number }[];
  
  console.log('\n📈 評分分布統計:');
  ratingStats.forEach(stat => {
    const stars = '★'.repeat(stat.rating) + '☆'.repeat(5 - stat.rating);
    console.log(`${stars} (${stat.rating}星): ${stat.count} 則`);
  });

  // 統計每個房屋的評分數量
  const listingRatingCountStmt = db.prepare(`
    SELECT listing_id, COUNT(*) as rating_count 
    FROM ratings 
    GROUP BY listing_id 
    ORDER BY rating_count DESC
  `);
  const listingRatingCounts = listingRatingCountStmt.all() as { listing_id: number; rating_count: number }[];
  
  const minRatings = Math.min(...listingRatingCounts.map(r => r.rating_count));
  const maxRatings = Math.max(...listingRatingCounts.map(r => r.rating_count));
  const avgRatings = listingRatingCounts.reduce((sum, r) => sum + r.rating_count, 0) / listingRatingCounts.length;
  
  console.log(`\n📊 房屋評分統計:`);
  console.log(`最少評分: ${minRatings} 則`);
  console.log(`最多評分: ${maxRatings} 則`);
  console.log(`平均評分: ${avgRatings.toFixed(1)} 則`);

  return {
    totalRatingsAdded,
    ratingsPerListing,
    ratingStats,
    listingStats: {
      minRatings,
      maxRatings,
      avgRatings
    }
  };
}
