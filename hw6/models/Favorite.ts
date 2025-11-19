import mongoose, { Schema, Document } from 'mongoose';

/**
 * 收藏演出模型
 */
export interface IFavorite extends Document {
  userId: string; // LINE User ID
  eventId: string; // Opentix Event ID
  eventTitle: string; // 演出標題
  eventUrl: string; // 演出連結
  venue?: string; // 場館
  category?: string; // 類別
  imageUrl?: string; // 演出圖片
  createdAt: Date; // 收藏時間
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    eventTitle: {
      type: String,
      required: true,
    },
    eventUrl: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
    },
    category: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// 複合索引：確保同一用戶不會重複收藏同一演出
FavoriteSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const FavoriteModel = mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);

