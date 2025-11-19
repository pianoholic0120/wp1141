import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { connectMongo } from '@/lib/db/mongodb';
import { EventModel } from '@/models/Event';

// Load .env.local first, fallback to .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config(); // Also load .env if .env.local doesn't exist

const OUTPUT_DIR = path.join(process.cwd(), 'output_site', 'pages');

function extractEventId(filename: string): string | null {
  const match = filename.match(/^event_(\d+)\.md$/);
  return match ? match[1] : null;
}

function parseEventMarkdown(content: string, eventId: string, opentixUrl: string) {
  const lines = content.split('\n');

  let title = '';
  let subtitle = '';
  let category = '';
  let rating = '';
  let organizer = '';
  let organizerId = '';
  let venue = '';
  let venueAddress = '';
  let description = '';
  const artists: string[] = [];
  let imageUrl = '';
  let priceRange = '';
  const dates: Array<{ date: Date; time: string; venue: string }> = [];
  const tags: string[] = [];

  let inDescription = false;
  let descriptionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 提取標題
    if (line.startsWith('# ') && !title) {
      title = line.replace(/^#+\s*/, '').trim();
    }

    // 提取副標題
    if (line.startsWith('## ') && !subtitle && title) {
      subtitle = line.replace(/^##+\s*/, '').trim();
    }

    // 提取類別
    if (line.includes('類別：')) {
      category = line.split('類別：')[1]?.trim() || '';
    }

    // 提取分級
    if (line.includes('分級：')) {
      rating = line.split('分級：')[1]?.trim() || '';
    }

    // 提取主辦
    if (line.includes('主辦：')) {
      const nextLine = lines[i + 1]?.trim() || '';
      organizer = nextLine.split('(')[0]?.trim() || '';
    }

    // 提取場館
    if (line.includes('場館地址：')) {
      venueAddress = line.split('場館地址：')[1]?.trim() || '';
      const venueMatch = lines[i - 2]?.trim();
      if (venueMatch && !venueMatch.startsWith('選擇')) {
        venue = venueMatch;
      }
    }

    // 提取圖片
    if (line.startsWith('![') && line.includes('](')) {
      const match = line.match(/!\[.*?\]\((.*?)\)/);
      if (match && match[1] && !imageUrl) {
        imageUrl = match[1];
      }
    }

    // 提取演出者（在特定區塊）
    if (
      line.includes('導演') ||
      line.includes('女高音') ||
      line.includes('鋼琴') ||
      line.includes('舞者') ||
      line.includes('指揮') ||
      line.includes('獨奏')
    ) {
      const parts = line.split(/[：:]/);
      if (parts.length > 1) {
        const name = parts[1]?.trim();
        if (name && !artists.includes(name)) {
          artists.push(name);
        }
      }
    }

    // 提取節目介紹
    if (line.includes('節目介紹') || line.includes('##  節目介紹')) {
      inDescription = true;
      continue;
    }

    if (inDescription) {
      if (line.startsWith('## ') && line !== '##  節目介紹') {
        inDescription = false;
      } else if (line && !line.startsWith('[') && !line.startsWith('![')) {
        descriptionLines.push(line);
      }
    }
  }

  description = descriptionLines.join('\n').trim();

  // 從標題和描述中提取可能的藝人名稱
  const titleWords = title.split(/[《》「」\s]+/).filter((w) => w.length > 1);
  titleWords.forEach((word) => {
    if (word.length >= 2 && !artists.includes(word) && !description.includes(word)) {
      // 簡單啟發式：可能是藝人名稱
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(word) || /[\u4e00-\u9fa5]{2,4}/.test(word)) {
        if (!artists.includes(word)) {
          artists.push(word);
        }
      }
    }
  });

  return {
    eventId,
    title: title || '未命名演出',
    subtitle,
    category,
    rating,
    organizer,
    organizerId,
    venue,
    venueAddress,
    description: description || subtitle || '',
    artists: [...new Set(artists)], // 去重
    imageUrl,
    opentixUrl,
    priceRange,
    dates,
    tags: [category].filter(Boolean),
    status: 'upcoming' as const,
    metadata: {
      rawMarkdown: content,
      sourceFile: `event_${eventId}.md`,
    },
  };
}

async function importEvents() {
  await connectMongo();

  const files = fs.readdirSync(OUTPUT_DIR);
  const eventFiles = files.filter((f) => f.startsWith('event_') && f.endsWith('.md'));

  console.log(`Found ${eventFiles.length} event files`);

  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const file of eventFiles) {
    try {
      const eventId = extractEventId(file);
      if (!eventId) continue;

      const filePath = path.join(OUTPUT_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const opentixUrl = `https://www.opentix.life/event/${eventId}`;

      const eventData = parseEventMarkdown(content, eventId, opentixUrl);

      const existing = await EventModel.findOne({ eventId });
      if (existing) {
        await EventModel.updateOne({ eventId }, { $set: eventData });
        updated++;
      } else {
        await EventModel.create(eventData);
        imported++;
      }

      if ((imported + updated) % 50 === 0) {
        console.log(`Progress: ${imported + updated}/${eventFiles.length}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
      errors++;
    }
  }

  console.log(`\n✅ Import complete:`);
  console.log(`   - Imported: ${imported}`);
  console.log(`   - Updated: ${updated}`);
  console.log(`   - Errors: ${errors}`);
  console.log(`   - Total: ${imported + updated}`);

  process.exit(0);
}

if (require.main === module) {
  importEvents().catch(console.error);
}

export { importEvents };
