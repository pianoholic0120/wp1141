import { connectMongo } from '@/lib/db/mongodb';
import { ConversationModel } from '@/models/Conversation';
import { Locale, DEFAULT_LOCALE } from '@/lib/i18n';
import { logger } from '@/lib/utils/logger';

/**
 * 取得使用者的語言設定（含降級處理）
 */
export async function getUserLocale(userId: string): Promise<Locale> {
  try {
    await connectMongo();
    const conversation = await ConversationModel.findOne({ userId }).lean();
    logger.info(`[Locale] Found conversation for user ${userId}:`, {
      exists: !!conversation,
      hasMetadata: !!conversation?.metadata,
      locale: conversation?.metadata?.locale,
      fullMetadata: conversation?.metadata,
    });
    
    if (conversation?.metadata?.locale) {
      const locale = conversation.metadata.locale as Locale;
      logger.info(`[Locale] Retrieved locale: ${locale} for user: ${userId}`);
      return locale;
    } else {
      logger.info(`[Locale] No locale found in metadata for user: ${userId}, using default`);
    }
  } catch (error) {
    logger.warn('Failed to get user locale from DB, using default:', error);
    // 降級：使用預設語言
  }

  logger.info(`[Locale] Using default locale: ${DEFAULT_LOCALE} for user: ${userId}`);
  return DEFAULT_LOCALE;
}

/**
 * 設定使用者的語言（含降級處理）
 * 使用 $set 操作符來確保只更新 locale 字段，不影響其他 metadata 字段（如 favoritesList）
 */
export async function setUserLocale(userId: string, locale: Locale): Promise<void> {
  try {
    await connectMongo();
    
    // 檢查 conversation 是否存在
    let conversation = await ConversationModel.findOne({ userId }).lean();
    
    if (!conversation) {
      // 創建新的 conversation
      await ConversationModel.create({
        userId,
        metadata: { locale },
      });
      logger.info(`[Locale] Created new conversation with locale: ${locale} for user: ${userId}`);
    } else {
      // 使用 updateOne 和 $set 來只更新 locale 字段，保留其他 metadata 字段
      await ConversationModel.updateOne(
        { userId },
        {
          $set: {
            'metadata.locale': locale,
            lastMessageAt: new Date(),
          },
        }
      );
      logger.info(`[Locale] Updated locale to ${locale} for user: ${userId}, preserving other metadata fields`);
      
      // 驗證更新是否成功（包括檢查 favoritesList 是否被保留）
      const verify = await ConversationModel.findOne({ userId }).lean();
      logger.info(`[Locale] Verification - locale: ${verify?.metadata?.locale}, favoritesList exists: ${!!verify?.metadata?.favoritesList}`);
    }
  } catch (error) {
    logger.warn('Failed to save user locale to DB:', error);
    // 降級：不儲存，但功能仍可正常運作（使用記憶體或 session）
  }
}
