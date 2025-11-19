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
  await connectMongo();

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalConversations,
    totalMessages,
    activeConversations,
    last24hMessages,
    last24hConversations,
  ] = await Promise.all([
    ConversationModel.countDocuments(),
    MessageModel.countDocuments(),
    ConversationModel.countDocuments({ status: 'active' }),
    MessageModel.countDocuments({ timestamp: { $gte: last24h } }),
    ConversationModel.countDocuments({ lastMessageAt: { $gte: last24h } }),
  ]);

  const avgMessagesPerConversation =
    totalConversations > 0 ? Math.round((totalMessages / totalConversations) * 10) / 10 : 0;

  // 計算回應時間和錯誤率
  const assistantMessages = await MessageModel.find({
    role: 'assistant',
    'metadata.latency': { $exists: true, $ne: null },
  })
    .select('metadata.latency metadata.error')
    .lean();

  const totalWithLatency = assistantMessages.length;
  const totalLatency = assistantMessages.reduce((sum: number, msg: any) => {
    return sum + (msg.metadata?.latency || 0);
  }, 0);
  const avgResponseTime = totalWithLatency > 0 ? Math.round(totalLatency / totalWithLatency) : undefined;

  // 計算錯誤率（有 error 欄位的 assistant 訊息）
  const errorMessages = await MessageModel.find({
    role: 'assistant',
    'metadata.error': { $exists: true, $ne: null, $ne: '' },
  }).countDocuments();

  const totalAssistantMessages = await MessageModel.countDocuments({ role: 'assistant' });
  const errorRate = totalAssistantMessages > 0 
    ? Math.round((errorMessages / totalAssistantMessages) * 100 * 10) / 10 
    : undefined;

  return {
    totalConversations,
    totalMessages,
    activeConversations,
    last24hMessages,
    last24hConversations,
    avgMessagesPerConversation,
    avgResponseTime,
    errorRate,
    totalErrors: errorMessages,
    totalWithLatency,
  };
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
