/**
 * 將提取的事件資料匯入資料庫
 */

import * as fs from 'fs';
import * as path from 'path';
import { connectMongo } from '../lib/db/mongodb';
import { EventModel } from '../models/Event';
import { ExtractedEvent } from './extract-events-from-site';

async function importEventsToDatabase() {
  try {
    // 連接到 MongoDB
    await connectMongo();
    console.log('Connected to MongoDB');
    
    // 讀取提取的資料
    const dataFile = path.join(__dirname, '../data/extracted-events.json');
    if (!fs.existsSync(dataFile)) {
      console.error(`Data file not found: ${dataFile}`);
      console.log('Please run extract-events-from-site.ts first');
      process.exit(1);
    }
    
    const events: ExtractedEvent[] = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    console.log(`Found ${events.length} events to import`);
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // 批次處理（每批 50 個）
    const batchSize = 50;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (event) => {
          try {
            // 轉換日期格式
            const dates = event.dates.map((d) => ({
              date: new Date(d.date),
              time: d.time,
              venue: d.venue,
            }));
            
            // 檢查是否已存在
            const existing = await EventModel.findOne({ eventId: event.eventId });
            
            if (existing) {
              // 更新現有事件
              await EventModel.updateOne(
                { eventId: event.eventId },
                {
                  $set: {
                    title: event.title,
                    subtitle: event.subtitle,
                    category: event.category,
                    rating: event.rating,
                    organizer: event.organizer,
                    organizerId: event.organizerId,
                    venue: event.venue,
                    venueAddress: event.venueAddress,
                    description: event.description,
                    artists: event.artists,
                    imageUrl: event.imageUrl,
                    opentixUrl: event.opentixUrl,
                    priceRange: event.priceRange,
                    dates: dates,
                    tags: event.tags,
                    status: event.status,
                    'metadata.sourceFile': `extracted from output_site`,
                    scrapedAt: new Date(),
                  },
                }
              );
              updated++;
            } else {
              // 創建新事件
              await EventModel.create({
                eventId: event.eventId,
                title: event.title,
                subtitle: event.subtitle,
                category: event.category,
                rating: event.rating,
                organizer: event.organizer,
                organizerId: event.organizerId,
                venue: event.venue,
                venueAddress: event.venueAddress,
                description: event.description,
                artists: event.artists,
                imageUrl: event.imageUrl,
                opentixUrl: event.opentixUrl,
                priceRange: event.priceRange,
                dates: dates,
                tags: event.tags,
                status: event.status,
                metadata: {
                  sourceFile: `extracted from output_site`,
                },
                scrapedAt: new Date(),
              });
              imported++;
            }
          } catch (error) {
            console.error(`Error importing event ${event.eventId}:`, error);
            errors++;
          }
        })
      );
      
      console.log(`Processed ${Math.min(i + batchSize, events.length)}/${events.length} events`);
    }
    
    console.log('\nImport completed:');
    console.log(`  Imported: ${imported}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Errors: ${errors}`);
    
    // 統計資訊
    const totalEvents = await EventModel.countDocuments();
    const eventsWithDates = await EventModel.countDocuments({ 'dates.0': { $exists: true } });
    const upcomingEvents = await EventModel.countDocuments({ status: 'upcoming' });
    
    console.log('\nDatabase statistics:');
    console.log(`  Total events: ${totalEvents}`);
    console.log(`  Events with dates: ${eventsWithDates}`);
    console.log(`  Upcoming events: ${upcomingEvents}`);
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  importEventsToDatabase();
}

export { importEventsToDatabase };

