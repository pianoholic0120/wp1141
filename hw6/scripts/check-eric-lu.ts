/**
 * 檢查資料庫中是否有 Eric Lu 的資料
 */
import { connectMongo } from '@/lib/db/mongodb';
import { EventModel } from '@/models/Event';

async function checkEricLu() {
  await connectMongo();
  
  console.log('Searching for Eric Lu events...\n');
  
  // 嘗試多種搜尋方式
  const searches = [
    { query: 'Eric Lu', desc: 'Exact match "Eric Lu"' },
    { query: 'eric lu', desc: 'Lowercase "eric lu"' },
    { query: 'Eric LU', desc: 'Mixed case "Eric LU"' },
    { query: 'eric', desc: 'Just "eric"' },
    { query: 'lu', desc: 'Just "lu"' },
  ];
  
  for (const { query, desc } of searches) {
    console.log(`\n=== ${desc} ===`);
    
    // 在 artists 陣列中搜尋
    const artistResults = await EventModel.find({
      artists: { $regex: new RegExp(query, 'i') }
    }).limit(5).lean();
    
    console.log(`Found ${artistResults.length} events in artists field:`);
    artistResults.forEach((event: any) => {
      console.log(`  - ${event.title}`);
      console.log(`    Artists: ${(event.artists || []).join(', ')}`);
      console.log(`    URL: ${event.opentixUrl}`);
    });
    
    // 在標題中搜尋
    const titleResults = await EventModel.find({
      title: { $regex: new RegExp(query, 'i') }
    }).limit(5).lean();
    
    console.log(`Found ${titleResults.length} events in title field:`);
    titleResults.forEach((event: any) => {
      console.log(`  - ${event.title}`);
      console.log(`    Artists: ${(event.artists || []).join(', ')}`);
    });
    
    // 在描述中搜尋
    const descResults = await EventModel.find({
      description: { $regex: new RegExp(query, 'i') }
    }).limit(5).lean();
    
    console.log(`Found ${descResults.length} events in description field:`);
    descResults.forEach((event: any) => {
      console.log(`  - ${event.title}`);
      console.log(`    Artists: ${(event.artists || []).join(', ')}`);
    });
  }
  
  // 檢查是否有「陸逸軒」的資料（Eric Lu 的中文名）
  console.log('\n=== Searching for 陸逸軒 (Eric Lu Chinese name) ===');
  const chineseResults = await EventModel.find({
    $or: [
      { artists: { $regex: /陸逸軒/i } },
      { title: { $regex: /陸逸軒/i } },
      { description: { $regex: /陸逸軒/i } }
    ]
  }).limit(5).lean();
  
  console.log(`Found ${chineseResults.length} events:`);
  chineseResults.forEach((event: any) => {
    console.log(`  - ${event.title}`);
    console.log(`    Artists: ${(event.artists || []).join(', ')}`);
    console.log(`    URL: ${event.opentixUrl}`);
  });
  
  process.exit(0);
}

checkEricLu().catch(console.error);




