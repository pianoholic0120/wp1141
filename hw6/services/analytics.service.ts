/**
 * Analytics 服務
 * 提供統計資料計算
 */

import { connectMongo } from '@/lib/db/mongodb';
import { ConversationModel } from '@/models/Conversation';
import { MessageModel } from '@/models/Message';

export interface AnalyticsStats {
  totalConversations: number;
  totalMessages: number;
  activeConversations: number;
  last24hMessages: number;
  last24hConversations: number;
  avgMessagesPerConversation: number;
  avgResponseTime?: number; // 平均回應時間（毫秒）
  errorRate?: number; // 錯誤率（百分比）
  totalErrors?: number; // 總錯誤數
  totalWithLatency?: number; // 有記錄回應時間的訊息數
}

/**
 * 計算統計資料
 */
export async function calculateStats(): Promise<AnalyticsStats> {
  try {
    await connectMongo();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed');
  }

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    const [
      totalConversations,
      totalMessages,
      activeConversations,
      last24hMessages,
      last24hConversations,
    ] = await Promise.all([
      ConversationModel.countDocuments().catch(() => 0),
      MessageModel.countDocuments().catch(() => 0),
      ConversationModel.countDocuments({ status: 'active' }).catch(() => 0),
      MessageModel.countDocuments({ timestamp: { $gte: last24h } }).catch(() => 0),
      ConversationModel.countDocuments({ lastMessageAt: { $gte: last24h } }).catch(() => 0),
    ]);

    const avgMessagesPerConversation =
      totalConversations > 0 ? Math.round((totalMessages / totalConversations) * 10) / 10 : 0;

    // 計算回應時間和錯誤率
    let assistantMessages: any[] = [];
    let totalWithLatency = 0;
    let avgResponseTime: number | undefined = undefined;
    let errorRate: number | undefined = undefined;
    let totalErrors = 0;

    try {
      assistantMessages = await MessageModel.find({
        role: 'assistant',
        'metadata.latency': { $exists: true, $ne: null },
      })
        .select('metadata.latency metadata.error')
        .lean();

      totalWithLatency = assistantMessages.length;
      const totalLatency = assistantMessages.reduce((sum: number, msg: any) => {
        return sum + (msg.metadata?.latency || 0);
      }, 0);
      avgResponseTime = totalWithLatency > 0 ? Math.round(totalLatency / totalWithLatency) : undefined;
    } catch (error) {
      console.error('Failed to calculate response time:', error);
    }

    try {
      totalErrors = await MessageModel.countDocuments({
        role: 'assistant',
        'metadata.error': { $exists: true, $ne: null, $ne: '' },
      });

      const totalAssistantMessages = await MessageModel.countDocuments({ role: 'assistant' });
      errorRate = totalAssistantMessages > 0 
        ? Math.round((totalErrors / totalAssistantMessages) * 100 * 10) / 10 
        : undefined;
    } catch (error) {
      console.error('Failed to calculate error rate:', error);
    }

    return {
      totalConversations,
      totalMessages,
      activeConversations,
      last24hMessages,
      last24hConversations,
      avgMessagesPerConversation,
      avgResponseTime,
      errorRate,
      totalErrors,
      totalWithLatency,
    };
  } catch (error) {
    console.error('Failed to calculate stats:', error);
    throw error;
  }
}

/**
 * 取得每小時訊息統計
 */
export async function getHourlyStats(
  days: number = 7
): Promise<Array<{ hour: number; count: number }>> {
  await connectMongo();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const messages = await MessageModel.find({
    timestamp: { $gte: startDate },
  })
    .select('timestamp')
    .lean();

  const hourlyCounts: Record<number, number> = {};

  messages.forEach((msg: any) => {
    const hour = new Date(msg.timestamp).getHours();
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
  });

  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourlyCounts[i] || 0,
  }));
}
