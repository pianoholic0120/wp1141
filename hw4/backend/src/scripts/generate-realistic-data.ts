import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

// 真實的台北市地理位置數據
const taipeiLocations = [
  // 信義區
  { name: "信義區松仁路", lat: 25.0330, lng: 121.5654, district: "信義區" },
  { name: "信義區信義路五段", lat: 25.0330, lng: 121.5654, district: "信義區" },
  { name: "信義區松高路", lat: 25.0330, lng: 121.5654, district: "信義區" },
  { name: "信義區松智路", lat: 25.0330, lng: 121.5654, district: "信義區" },
  { name: "信義區松勤路", lat: 25.0330, lng: 121.5654, district: "信義區" },
  
  // 大安區
  { name: "大安區敦化南路", lat: 25.0400, lng: 121.5500, district: "大安區" },
  { name: "大安區復興南路", lat: 25.0400, lng: 121.5500, district: "大安區" },
  { name: "大安區仁愛路", lat: 25.0400, lng: 121.5500, district: "大安區" },
  { name: "大安區忠孝東路", lat: 25.0400, lng: 121.5500, district: "大安區" },
  { name: "大安區和平東路", lat: 25.0400, lng: 121.5500, district: "大安區" },
  
  // 中山區
  { name: "中山區南京東路", lat: 25.0500, lng: 121.5300, district: "中山區" },
  { name: "中山區松江路", lat: 25.0500, lng: 121.5300, district: "中山區" },
  { name: "中山區民生東路", lat: 25.0500, lng: 121.5300, district: "中山區" },
  { name: "中山區建國北路", lat: 25.0500, lng: 121.5300, district: "中山區" },
  { name: "中山區民權東路", lat: 25.0500, lng: 121.5300, district: "中山區" },
  
  // 松山區
  { name: "松山區八德路", lat: 25.0450, lng: 121.5400, district: "松山區" },
  { name: "松山區民生東路", lat: 25.0450, lng: 121.5400, district: "松山區" },
  { name: "松山區南京東路", lat: 25.0450, lng: 121.5400, district: "松山區" },
  { name: "松山區敦化北路", lat: 25.0450, lng: 121.5400, district: "松山區" },
  { name: "松山區光復北路", lat: 25.0450, lng: 121.5400, district: "松山區" },
  
  // 內湖區
  { name: "內湖區內湖路", lat: 25.0700, lng: 121.5800, district: "內湖區" },
  { name: "內湖區成功路", lat: 25.0700, lng: 121.5800, district: "內湖區" },
  { name: "內湖區民權東路", lat: 25.0700, lng: 121.5800, district: "內湖區" },
  { name: "內湖區瑞光路", lat: 25.0700, lng: 121.5800, district: "內湖區" },
  { name: "內湖區文德路", lat: 25.0700, lng: 121.5800, district: "內湖區" },
  
  // 士林區
  { name: "士林區天母東路", lat: 25.1200, lng: 121.5200, district: "士林區" },
  { name: "士林區中山北路", lat: 25.1200, lng: 121.5200, district: "士林區" },
  { name: "士林區德行東路", lat: 25.1200, lng: 121.5200, district: "士林區" },
  { name: "士林區文林路", lat: 25.1200, lng: 121.5200, district: "士林區" },
  { name: "士林區中正路", lat: 25.1200, lng: 121.5200, district: "士林區" },
  
  // 北投區
  { name: "北投區石牌路", lat: 25.1300, lng: 121.5000, district: "北投區" },
  { name: "北投區中央北路", lat: 25.1300, lng: 121.5000, district: "北投區" },
  { name: "北投區明德路", lat: 25.1300, lng: 121.5000, district: "北投區" },
  { name: "北投區關渡路", lat: 25.1300, lng: 121.5000, district: "北投區" },
  { name: "北投區知行路", lat: 25.1300, lng: 121.5000, district: "北投區" },
  
  // 萬華區
  { name: "萬華區西門町", lat: 25.0400, lng: 121.5100, district: "萬華區" },
  { name: "萬華區艋舺大道", lat: 25.0400, lng: 121.5100, district: "萬華區" },
  { name: "萬華區和平西路", lat: 25.0400, lng: 121.5100, district: "萬華區" },
  { name: "萬華區中華路", lat: 25.0400, lng: 121.5100, district: "萬華區" },
  { name: "萬華區環河南路", lat: 25.0400, lng: 121.5100, district: "萬華區" },
  
  // 中正區
  { name: "中正區重慶南路", lat: 25.0300, lng: 121.5200, district: "中正區" },
  { name: "中正區博愛路", lat: 25.0300, lng: 121.5200, district: "中正區" },
  { name: "中正區衡陽路", lat: 25.0300, lng: 121.5200, district: "中正區" },
  { name: "中正區懷寧街", lat: 25.0300, lng: 121.5200, district: "中正區" },
  { name: "中正區武昌街", lat: 25.0300, lng: 121.5200, district: "中正區" },
  
  // 大同區
  { name: "大同區迪化街", lat: 25.0600, lng: 121.5100, district: "大同區" },
  { name: "大同區民生西路", lat: 25.0600, lng: 121.5100, district: "大同區" },
  { name: "大同區延平北路", lat: 25.0600, lng: 121.5100, district: "大同區" },
  { name: "大同區重慶北路", lat: 25.0600, lng: 121.5100, district: "大同區" },
  { name: "大同區承德路", lat: 25.0600, lng: 121.5100, district: "大同區" },
  
  // 文山區
  { name: "文山區木柵路", lat: 24.9900, lng: 121.5700, district: "文山區" },
  { name: "文山區景美街", lat: 24.9900, lng: 121.5700, district: "文山區" },
  { name: "文山區興隆路", lat: 24.9900, lng: 121.5700, district: "文山區" },
  { name: "文山區羅斯福路", lat: 24.9900, lng: 121.5700, district: "文山區" },
  { name: "文山區辛亥路", lat: 24.9900, lng: 121.5700, district: "文山區" },
  
  // 南港區
  { name: "南港區南港路", lat: 25.0500, lng: 121.6000, district: "南港區" },
  { name: "南港區研究院路", lat: 25.0500, lng: 121.6000, district: "南港區" },
  { name: "南港區忠孝東路", lat: 25.0500, lng: 121.6000, district: "南港區" },
  { name: "南港區東新街", lat: 25.0500, lng: 121.6000, district: "南港區" },
  { name: "南港區重陽路", lat: 25.0500, lng: 121.6000, district: "南港區" },
  
  // 新北市
  { name: "新北市板橋區", lat: 25.0100, lng: 121.4600, district: "板橋區" },
  { name: "新北市新店區", lat: 24.9700, lng: 121.5400, district: "新店區" },
  { name: "新北市永和區", lat: 25.0100, lng: 121.5100, district: "永和區" },
  { name: "新北市中和區", lat: 24.9900, lng: 121.5000, district: "中和區" },
  { name: "新北市三重區", lat: 25.0600, lng: 121.4800, district: "三重區" },
  { name: "新北市新莊區", lat: 25.0400, lng: 121.4500, district: "新莊區" },
  { name: "新北市蘆洲區", lat: 25.0800, lng: 121.4600, district: "蘆洲區" },
  { name: "新北市五股區", lat: 25.0900, lng: 121.4400, district: "五股區" },
  { name: "新北市泰山區", lat: 25.0500, lng: 121.4200, district: "泰山區" },
  { name: "新北市林口區", lat: 25.0700, lng: 121.3800, district: "林口區" }
];

// 房東姓名數據
const landlordNames = [
  "王小明", "李美華", "張志強", "陳淑芬", "林建國", "黃雅婷", "劉志明", "吳淑娟",
  "鄭文雄", "許美玲", "蔡志豪", "謝淑惠", "楊建華", "周雅芳", "徐志明", "何美玉",
  "高文斌", "梁淑芬", "江志豪", "羅美玲", "葉建國", "蘇雅婷", "呂志明", "范淑娟",
  "馬文雄", "宋美華", "孫志強", "胡淑芬", "朱建國", "郭雅婷", "洪志明", "邱淑惠",
  "薛文斌", "盧美玲", "白志豪", "石淑芬", "田建國", "史雅婷", "龍志明", "段淑娟",
  "侯文雄", "溫美華", "袁志強", "常淑芬", "康建國", "賀雅婷", "嚴志明", "華淑惠",
  "金文斌", "魏美玲", "蔣志豪", "韓淑芬", "馮建國", "秦雅婷", "尤志明", "許淑娟",
  "何文雄", "呂美華", "施志強", "張淑芬", "曹建國", "嚴雅婷", "華志明", "金淑惠",
  "魏文斌", "秦美玲", "尤志豪", "許淑芬", "何建國", "呂雅婷", "施志明", "張淑娟"
];

// 房屋名稱模板
const houseNameTemplates = [
  "溫馨", "雅緻", "舒適", "豪華", "精緻", "時尚", "現代", "古典", "歐式", "日式",
  "北歐", "簡約", "復古", "新潮", "典雅", "浪漫", "清新", "自然", "陽光", "綠意"
];

const houseTypeTemplates = [
  "套房", "雅房", "分租套房", "獨立套房", "一房一廳", "兩房一廳", "三房兩廳", "四房兩廳",
  "頂樓加蓋", "地下室", "閣樓", "挑高", "複式", "透天", "別墅", "豪宅"
];

// 詳細描述模板
const descriptions = [
  "位於{location}的{type}，交通便利，生活機能完善。",
  "全新裝潢的{type}，採光良好，通風佳，適合{target}居住。",
  "近{location}的{type}，周邊有{amenities}，生活便利。",
  "溫馨舒適的{type}，{features}，歡迎{target}入住。",
  "現代化設計的{type}，{amenities}，適合{target}居住。",
  "位於{location}的{type}，{features}，{amenities}，生活便利。",
  "全新{type}，{features}，近{location}，{amenities}。",
  "精裝潢{type}，{features}，{amenities}，適合{target}。"
];

// 目標租客
const targetTenants = ["上班族", "學生", "小家庭", "情侶", "單身貴族", "退休人士"];

// 房屋特色
const houseFeatures = [
  "採光良好", "通風佳", "安靜環境", "景觀優美", "交通便利", "生活機能完善",
  "全新裝潢", "現代化設備", "安全門禁", "24小時管理", "近捷運站", "近商圈",
  "近學校", "近醫院", "近公園", "近市場", "近銀行", "近郵局"
];

// 公設設施
const amenities = [
  "冷氣", "網路", "洗衣機", "冰箱", "熱水器", "電視", "床", "衣櫃", "書桌", "椅子",
  "沙發", "餐桌", "廚房", "衛浴", "陽台", "停車位", "電梯", "管理員", "保全系統",
  "監視器", "門禁卡", "垃圾處理", "清潔服務", "健身房", "游泳池", "交誼廳", "閱覽室",
  "KTV", "麻將間", "桌球室", "撞球室", "電影院", "咖啡廳", "餐廳", "便利商店",
  "停車場", "機車位", "腳踏車位", "充電樁", "WiFi", "有線電視", "第四台", "MOD"
];

// 房型數據
const propertyTypes = ["套房", "雅房", "分租套房", "獨立套房", "一房一廳", "兩房一廳", "三房兩廳", "四房兩廳"];
const statuses = ["available", "rented", "pending"];

// 生成隨機數組
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 生成隨機價格
function generatePrice(propertyType: string, district: string): number {
  const basePrices: { [key: string]: number } = {
    "套房": 15000,
    "雅房": 8000,
    "分租套房": 12000,
    "獨立套房": 18000,
    "一房一廳": 25000,
    "兩房一廳": 35000,
    "三房兩廳": 45000,
    "四房兩廳": 55000
  };
  
  const districtMultipliers: { [key: string]: number } = {
    "信義區": 1.5,
    "大安區": 1.4,
    "中山區": 1.3,
    "松山區": 1.2,
    "內湖區": 1.1,
    "士林區": 1.0,
    "北投區": 0.9,
    "萬華區": 0.8,
    "中正區": 1.2,
    "大同區": 0.9,
    "文山區": 0.8,
    "南港區": 1.0,
    "板橋區": 0.9,
    "新店區": 0.8,
    "永和區": 0.9,
    "中和區": 0.8,
    "三重區": 0.7,
    "新莊區": 0.7,
    "蘆洲區": 0.6,
    "五股區": 0.5,
    "泰山區": 0.5,
    "林口區": 0.6
  };
  
  const basePrice = basePrices[propertyType] || 15000;
  const multiplier = districtMultipliers[district] || 1.0;
  const price = Math.round(basePrice * multiplier);
  
  // 添加隨機變動 ±20%
  const variation = 0.8 + Math.random() * 0.4;
  return Math.round(price * variation);
}

// 生成房屋描述
function generateDescription(location: any, propertyType: string): string {
  const template = descriptions[Math.floor(Math.random() * descriptions.length)];
  const target = targetTenants[Math.floor(Math.random() * targetTenants.length)];
  const features = getRandomItems(houseFeatures, 2).join("、");
  const selectedAmenities = getRandomItems(amenities, 3).join("、");
  
  return template
    .replace("{location}", location.name)
    .replace("{type}", propertyType)
    .replace("{target}", target)
    .replace("{features}", features)
    .replace("{amenities}", selectedAmenities);
}

// 生成房屋標題
function generateTitle(location: any, propertyType: string): string {
  const nameTemplate = houseNameTemplates[Math.floor(Math.random() * houseNameTemplates.length)];
  const typeTemplate = houseTypeTemplates[Math.floor(Math.random() * houseTypeTemplates.length)];
  
  return `${nameTemplate}${typeTemplate} - ${location.district}`;
}

// 生成地址
function generateAddress(location: any): string {
  const streetNumbers = [1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99];
  const number = streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
  const floor = Math.floor(Math.random() * 20) + 1;
  
  return `${location.name}${number}號${floor}樓`;
}

// 生成公設設施
function generateAmenities(): string[] {
  const count = Math.floor(Math.random() * 8) + 3; // 3-10個公設
  return getRandomItems(amenities, count);
}

// 生成聯絡電話
function generatePhone(): string {
  const prefixes = ["02", "03", "04", "05", "06", "07", "08", "09"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 90000000) + 10000000;
  return `${prefix}-${number.toString().slice(0, 4)}-${number.toString().slice(4)}`;
}

// 生成樓層
function generateFloor(): number {
  return Math.floor(Math.random() * 20) + 1;
}

// 生成坪數
function generateArea(propertyType: string): number {
  const baseAreas: { [key: string]: number } = {
    "套房": 8,
    "雅房": 6,
    "分租套房": 10,
    "獨立套房": 12,
    "一房一廳": 15,
    "兩房一廳": 25,
    "三房兩廳": 35,
    "四房兩廳": 45
  };
  
  const baseArea = baseAreas[propertyType] || 10;
  const variation = 0.8 + Math.random() * 0.4;
  return Math.round(baseArea * variation);
}

// 生成管理費
function generateManagementFee(price: number): number {
  const baseFee = Math.round(price * 0.1);
  const variation = 0.5 + Math.random() * 1.0;
  return Math.round(baseFee * variation);
}

// 生成臥室和浴室數量
function generateRooms(propertyType: string): { bedrooms: number; bathrooms: number } {
  const roomConfigs: { [key: string]: { bedrooms: number; bathrooms: number } } = {
    "套房": { bedrooms: 1, bathrooms: 1 },
    "雅房": { bedrooms: 1, bathrooms: 0 },
    "分租套房": { bedrooms: 1, bathrooms: 1 },
    "獨立套房": { bedrooms: 1, bathrooms: 1 },
    "一房一廳": { bedrooms: 1, bathrooms: 1 },
    "兩房一廳": { bedrooms: 2, bathrooms: 1 },
    "三房兩廳": { bedrooms: 3, bathrooms: 2 },
    "四房兩廳": { bedrooms: 4, bathrooms: 2 }
  };
  
  return roomConfigs[propertyType] || { bedrooms: 1, bathrooms: 1 };
}

// 主函數
export async function generateRealisticData(db: any) {
  console.log('🏠 開始生成400個真實房屋資料...');
  
  // 清空現有數據
  db.exec('DELETE FROM ratings');
  db.exec('DELETE FROM favorites');
  db.exec('DELETE FROM listings');
  db.exec('DELETE FROM users WHERE id > 1'); // 保留測試用戶
  
  // 生成100個房東用戶
  const landlords: number[] = [];
  const passwordHash = await bcrypt.hash('Test123!@#', 10);
  
  for (let i = 0; i < 100; i++) {
    const landlordName = landlordNames[i % landlordNames.length];
    const email = `landlord${i + 1}@example.com`;
    const username = `landlord${i + 1}`;
    
    const stmt = db.prepare(`
      INSERT INTO users (email, username, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = stmt.run(email, username, passwordHash);
    landlords.push(result.lastInsertRowid as number);
  }
  
  console.log(`✅ 已創建 ${landlords.length} 個房東用戶`);
  
  // 生成400個房屋
  const listings: any[] = [];
  
  for (let i = 0; i < 400; i++) {
    const location = taipeiLocations[i % taipeiLocations.length];
    const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const landlordId = landlords[Math.floor(Math.random() * landlords.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const title = generateTitle(location, propertyType);
    const address = generateAddress(location);
    const description = generateDescription(location, propertyType);
    const price = generatePrice(propertyType, location.district);
    const amenities = generateAmenities();
    const phone = generatePhone();
    const floor = generateFloor();
    const area = generateArea(propertyType);
    const managementFee = generateManagementFee(price);
    const rooms = generateRooms(propertyType);
    
    // 添加一些隨機偏移到座標
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;
    const latitude = location.lat + latOffset;
    const longitude = location.lng + lngOffset;
    
    const stmt = db.prepare(`
      INSERT INTO listings (
        user_id, title, description, address, latitude, longitude, 
        price, bedrooms, bathrooms, area_sqft, property_type, status,
        amenities, floor, contact_phone, management_fee, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = stmt.run(
      landlordId, title, description, address, latitude, longitude,
      price, rooms.bedrooms, rooms.bathrooms, area, propertyType, status,
      JSON.stringify(amenities), floor, phone, managementFee
    );
    
    listings.push({
      id: result.lastInsertRowid,
      user_id: landlordId,
      title,
      address,
      price,
      property_type: propertyType,
      status
    });
  }
  
  console.log(`✅ 已創建 ${listings.length} 個房屋資料`);
  
  // 生成一些收藏和評分數據
  const testUserId = 1; // 使用測試用戶ID
  
  // 隨機收藏一些房屋
  const favoriteListings = getRandomItems(listings, 50);
  for (const listing of favoriteListings) {
    const stmt = db.prepare(`
      INSERT INTO favorites (user_id, listing_id, created_at)
      VALUES (?, ?, datetime('now'))
    `);
    stmt.run(testUserId, listing.id);
  }
  
  // 隨機評分一些房屋
  const ratingListings = getRandomItems(listings, 30);
  for (const listing of ratingListings) {
    const rating = Math.floor(Math.random() * 5) + 1;
    const comments = [
      "非常棒的房源！", "環境很好", "房東人很好", "交通便利", "價格合理",
      "設備齊全", "採光良好", "安靜舒適", "生活機能完善", "推薦！"
    ];
    const comment = comments[Math.floor(Math.random() * comments.length)];
    
    const stmt = db.prepare(`
      INSERT INTO ratings (user_id, listing_id, rating, comment, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    stmt.run(testUserId, listing.id, rating, comment);
  }
  
  console.log('✅ 已生成收藏和評分數據');
  console.log('🎉 400個真實房屋資料生成完成！');
  
  return {
    users: landlords.length,
    listings: listings.length,
    favorites: 50,
    ratings: 30
  };
}
