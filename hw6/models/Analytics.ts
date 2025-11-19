import mongoose, { Schema, InferSchemaType } from 'mongoose';

const AnalyticsSchema = new Schema({
  date: { type: Date, required: true, index: true },
  metrics: {
    totalMessages: Number,
    totalConversations: Number,
    activeUsers: Number,
    avgResponseTime: Number,
    llmSuccessRate: Number,
    errorRate: Number,
  },
  hourlyBreakdown: [
    {
      hour: Number,
      messageCount: Number,
      userCount: Number,
    },
  ],
});

export type Analytics = InferSchemaType<typeof AnalyticsSchema>;

export const AnalyticsModel =
  mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);
