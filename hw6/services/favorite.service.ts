/**
 * 收藏服務
 * 處理用戶收藏演出的相關操作
 */

import { connectMongo } from '@/lib/db/mongodb';
import { FavoriteModel } from '@/models/Favorite';
import { Locale } from '@/lib/i18n';

/**
 * 添加收藏
 */
export async function addFavorite(
  userId: string,
  eventData: {
    eventId: string;
    eventTitle: string;
    eventUrl: string;
    venue?: string;
    category?: string;
    imageUrl?: string;
  },
  locale: Locale = 'zh-TW'
) {
  await connectMongo();
  const isZh = locale === 'zh-TW';

  try {
    // 檢查是否已收藏
    const existing = await FavoriteModel.findOne({
      userId,
      eventId: eventData.eventId,
    });

    if (existing) {
      return {
        success: false,
        message: isZh ? '您已經收藏過這個演出了！' : 'You have already added this event to favorites!',
        alreadyExists: true,
      };
    }

    // 創建新收藏
    await FavoriteModel.create({
      userId,
      ...eventData,
    });

    return {
      success: true,
      message: isZh ? '✅ 收藏成功！' : '✅ Added to favorites!',
    };
  } catch (error: any) {
    console.error('[Favorite Service] Error adding favorite:', error);
    
    // 處理重複收藏的錯誤（duplicate key error）
    if (error.code === 11000) {
      return {
        success: false,
        message: isZh ? '您已經收藏過這個演出了！' : 'You have already added this event to favorites!',
        alreadyExists: true,
      };
    }

    return {
      success: false,
      message: isZh ? '收藏失敗，請稍後再試。' : 'Failed to add favorite. Please try again.',
    };
  }
}

/**
 * 取消收藏
 */
export async function removeFavorite(userId: string, eventId: string, locale: Locale = 'zh-TW') {
  await connectMongo();
  const isZh = locale === 'zh-TW';

  try {
    const result = await FavoriteModel.deleteOne({
      userId,
      eventId,
    });

    if (result.deletedCount === 0) {
      return {
        success: false,
        message: isZh ? '此演出不在您的收藏中。' : 'This event is not in your favorites.',
      };
    }

    return {
      success: true,
      message: isZh ? '✅ 已取消收藏！' : '✅ Removed from favorites!',
    };
  } catch (error) {
    console.error('[Favorite Service] Error removing favorite:', error);
    return {
      success: false,
      message: isZh ? '取消收藏失敗，請稍後再試。' : 'Failed to remove favorite. Please try again.',
    };
  }
}

/**
 * 獲取用戶的所有收藏
 */
export async function getFavorites(userId: string, limit: number = 10) {
  await connectMongo();

  try {
    const favorites = await FavoriteModel.find({ userId })
      .sort({ createdAt: -1 }) // 最新的在前
      .limit(limit)
      .lean();

    return {
      success: true,
      favorites,
      total: favorites.length,
    };
  } catch (error) {
    console.error('[Favorite Service] Error getting favorites:', error);
    return {
      success: false,
      favorites: [],
      total: 0,
    };
  }
}

/**
 * 檢查演出是否已被收藏
 */
export async function isFavorited(userId: string, eventId: string) {
  await connectMongo();

  try {
    const favorite = await FavoriteModel.findOne({
      userId,
      eventId,
    });

    return {
      isFavorited: !!favorite,
    };
  } catch (error) {
    console.error('[Favorite Service] Error checking favorite:', error);
    return {
      isFavorited: false,
    };
  }
}

/**
 * 獲取收藏數量
 */
export async function getFavoriteCount(userId: string) {
  await connectMongo();

  try {
    const count = await FavoriteModel.countDocuments({ userId });
    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error('[Favorite Service] Error getting favorite count:', error);
    return {
      success: false,
      count: 0,
    };
  }
}

