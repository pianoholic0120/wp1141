import mongoose, { Schema, InferSchemaType } from 'mongoose';

const EventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: 'text' },
    subtitle: String, // 英文名稱
    category: { type: String, index: true }, // 音樂、戲劇、舞蹈等
    rating: String, // 建議年齡（分級）
    organizer: String, // 主辦單位
    organizerId: String,
    organizerContact: String, // 主辦單位聯絡方式
    venue: String,
    venueAddress: String,
    description: { type: String, index: 'text' },
    artists: [String], // 演出者列表
    imageUrl: String,
    opentixUrl: { type: String, required: true },
    priceRange: String,
    discountInfo: String, // 折扣方案
    duration: String, // 演出全長
    preShowTalk: String, // 演前導聆
    openTime: String, // 開放時間
    dates: [
      {
        date: Date,
        time: String,
        venue: String,
      },
    ],
    tags: [String],
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'ended'],
      default: 'upcoming',
    },
    scrapedAt: { type: Date, default: Date.now },
    metadata: {
      rawMarkdown: String,
      sourceFile: String,
    },
  },
  {
    timestamps: true,
  }
);

// 複合索引：標題和描述全文搜尋
EventSchema.index({ title: 'text', description: 'text', artists: 'text' });

export type Event = InferSchemaType<typeof EventSchema>;

export const EventModel = mongoose.models.Event || mongoose.model('Event', EventSchema);
