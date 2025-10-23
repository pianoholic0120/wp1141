import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const dbPath = path.join(__dirname, '../../database/rental_listings.db');
const db = new Database(dbPath);

// Sample amenities combinations
const amenityOptions = [
  ['air_conditioning', 'elevator', 'near_mrt', 'internet', 'independent_suite', 'washing_machine', 'bed', 'wardrobe'],
  ['air_conditioning', 'parking', 'internet', 'kitchen', 'refrigerator', 'gas_stove', 'bed', 'desk'],
  ['elevator', 'near_mrt', 'near_bus', 'internet', 'security', 'independent_suite', 'tv', 'sofa'],
  ['air_conditioning', 'elevator', 'parking', 'internet', 'near_mrt', 'balcony', 'kitchen', 'refrigerator'],
  ['near_mrt', 'near_school', 'internet', 'independent_suite', 'bed', 'wardrobe', 'desk', 'washing_machine'],
  ['air_conditioning', 'elevator', 'internet', 'parking', 'security', 'gym', 'kitchen', 'refrigerator'],
  ['near_mrt', 'near_market', 'internet', 'independent_suite', 'pet_friendly', 'bed', 'wardrobe'],
  ['air_conditioning', 'heating', 'internet', 'independent_suite', 'kitchen', 'gas_stove', 'microwave'],
];

// Virtual listings with real Taiwan coordinates
const virtualListings = [
  {
    title: '台北101旁豪華公寓',
    description: '鄰近台北101，交通便利，採光極佳，附近生活機能完善，適合上班族。',
    address: '台北市信義區信義路五段7號',
    latitude: 25.0330,
    longitude: 121.5654,
    price: 35000,
    bedrooms: 2,
    bathrooms: 1,
    area_sqft: 800,
    property_type: 'apartment',
    status: 'available',
    floor: 15,
    contact_phone: '02-2345-6789',
    management_fee: 2000,
    amenities: 0,
  },
  {
    title: '師大商圈溫馨套房',
    description: '位於師大夜市旁，生活機能佳，適合學生或小資族，傢俱齊全可直接入住。',
    address: '台北市大安區師大路39號',
    latitude: 25.0258,
    longitude: 121.5279,
    price: 18000,
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 400,
    property_type: 'studio',
    status: 'available',
    floor: 3,
    contact_phone: '02-2363-4567',
    management_fee: 800,
    amenities: 1,
  },
  {
    title: '東區時尚大樓',
    description: '位於東區商圈核心地帶，購物餐飲便利，24小時警衛管理，安全有保障。',
    address: '台北市大安區忠孝東路四段205號',
    latitude: 25.0417,
    longitude: 121.5431,
    price: 28000,
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 600,
    property_type: 'condo',
    status: 'available',
    floor: 8,
    contact_phone: '02-2711-2345',
    management_fee: 1500,
    amenities: 2,
  },
  {
    title: '中山捷運站獨立套房',
    description: '捷運中山站步行3分鐘，獨立衛浴廚房，適合一人或情侶居住。',
    address: '台北市中山區南京東路一段32號',
    latitude: 25.0524,
    longitude: 121.5200,
    price: 22000,
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 450,
    property_type: 'studio',
    status: 'available',
    floor: 5,
    contact_phone: '02-2531-8888',
    management_fee: 1000,
    amenities: 3,
  },
  {
    title: '公館商圈學生宿舍',
    description: '鄰近台大、師大，公館商圈美食林立，生活機能極佳，適合學生。',
    address: '台北市中正區羅斯福路三段269號',
    latitude: 25.0141,
    longitude: 121.5347,
    price: 15000,
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 350,
    property_type: 'apartment',
    status: 'available',
    floor: 2,
    contact_phone: '02-2363-9999',
    management_fee: 500,
    amenities: 4,
  },
  {
    title: '內湖科學園區3房',
    description: '適合科技業上班族，近內湖科學園區，附停車位，社區設施完善。',
    address: '台北市內湖區瑞光路76號',
    latitude: 25.0793,
    longitude: 121.5735,
    price: 42000,
    bedrooms: 3,
    bathrooms: 2,
    area_sqft: 1200,
    property_type: 'condo',
    status: 'available',
    floor: 12,
    contact_phone: '02-8797-1234',
    management_fee: 3000,
    amenities: 5,
  },
  {
    title: '士林夜市旁便利套房',
    description: '士林夜市步行5分鐘，捷運劍潭站旁，美食購物超方便。',
    address: '台北市士林區大東路12號',
    latitude: 25.0935,
    longitude: 121.5249,
    price: 19000,
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 420,
    property_type: 'studio',
    status: 'available',
    floor: 4,
    contact_phone: '02-2883-5678',
    management_fee: 900,
    amenities: 6,
  },
  {
    title: '松山機場旁商務公寓',
    description: '近松山機場及民生社區，適合商務人士，交通便利。',
    address: '台北市松山區敦化北路145號',
    latitude: 25.0615,
    longitude: 121.5502,
    price: 32000,
    bedrooms: 2,
    bathrooms: 1,
    area_sqft: 750,
    property_type: 'apartment',
    status: 'available',
    floor: 10,
    contact_phone: '02-2547-3456',
    management_fee: 1800,
    amenities: 7,
  },
  {
    title: '西門町熱鬧商圈套房',
    description: '西門町核心地段，年輕潮流匯聚，捷運站旁，娛樂購物便利。',
    address: '台北市萬華區漢中街116號',
    latitude: 25.0447,
    longitude: 121.5070,
    price: 20000,
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 380,
    property_type: 'studio',
    status: 'available',
    floor: 6,
    contact_phone: '02-2312-7890',
    management_fee: 1000,
    amenities: 0,
  },
  {
    title: '大直美麗華旁高級住宅',
    description: '鄰近美麗華摩天輪，環境優美，社區管理嚴謹，適合家庭居住。',
    address: '台北市中山區北安路621號',
    latitude: 25.0833,
    longitude: 121.5478,
    price: 45000,
    bedrooms: 3,
    bathrooms: 2,
    area_sqft: 1400,
    property_type: 'condo',
    status: 'available',
    floor: 18,
    contact_phone: '02-8502-3456',
    management_fee: 3500,
    amenities: 1,
  },
  {
    title: '南港軟體園區小資套房',
    description: '南港軟體園區步行10分鐘，適合科技業從業人員，生活便利。',
    address: '台北市南港區園區街3號',
    latitude: 25.0587,
    longitude: 121.6161,
    price: 17000,
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 360,
    property_type: 'studio',
    status: 'available',
    floor: 7,
    contact_phone: '02-2655-4321',
    management_fee: 700,
    amenities: 2,
  },
  {
    title: '文山區政大旁學生雅房',
    description: '鄰近政治大學，適合學生居住，環境安靜，採光良好。',
    address: '台北市文山區指南路二段64號',
    latitude: 24.9875,
    longitude: 121.5753,
    price: 12000,
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 300,
    property_type: 'apartment',
    status: 'available',
    floor: 3,
    contact_phone: '02-2939-5678',
    management_fee: 400,
    amenities: 3,
  },
];

async function seedData() {
  try {
    console.log('🌱 開始填充虛擬數據...');

    // Create demo user
    const hashedPassword = await bcrypt.hash('Demo123!@#', 10);
    
    // Check if demo user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@example.com');
    
    let demoUserId: number;
    
    if (existingUser) {
      demoUserId = (existingUser as any).id;
      console.log(`✅ Demo 用戶已存在 (ID: ${demoUserId})`);
    } else {
      const userResult = db.prepare(`
        INSERT INTO users (username, email, password_hash, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run('demo_landlord', 'demo@example.com', hashedPassword);
      
      demoUserId = userResult.lastInsertRowid as number;
      console.log(`✅ 創建 Demo 用戶 (ID: ${demoUserId})`);
    }

    // Insert virtual listings
    const insertStmt = db.prepare(`
      INSERT INTO listings (
        user_id, title, description, address, latitude, longitude,
        price, bedrooms, bathrooms, area_sqft, property_type, status,
        floor, contact_phone, management_fee, amenities, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    let insertedCount = 0;
    for (const listing of virtualListings) {
      const amenitiesJson = JSON.stringify(amenityOptions[listing.amenities]);
      
      insertStmt.run(
        demoUserId,
        listing.title,
        listing.description,
        listing.address,
        listing.latitude,
        listing.longitude,
        listing.price,
        listing.bedrooms,
        listing.bathrooms,
        listing.area_sqft,
        listing.property_type,
        listing.status,
        listing.floor,
        listing.contact_phone,
        listing.management_fee,
        amenitiesJson
      );
      
      insertedCount++;
    }

    console.log(`✅ 成功插入 ${insertedCount} 個虛擬房屋`);
    console.log('🎉 虛擬數據填充完成！');
    console.log('');
    console.log('📊 數據統計：');
    console.log(`   - Demo 用戶： demo@example.com / Demo123!@#`);
    console.log(`   - 虛擬房屋： ${insertedCount} 個`);
    console.log(`   - 位置範圍： 台北市各區`);
    console.log('');
    console.log('💡 提示：');
    console.log('   - 所有虛擬房屋都屬於 demo@example.com 用戶');
    console.log('   - 其他用戶可以查看但無法編輯這些房屋');
    console.log('   - 可以使用篩選功能測試各種條件');

  } catch (error) {
    console.error('❌ 填充虛擬數據失敗：', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run the seed function
seedData().catch(console.error);

