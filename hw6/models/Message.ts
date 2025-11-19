import mongoose, { Schema, InferSchemaType } from 'mongoose';

const MessageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: {
    messageType: String,
    replyToken: String,
    llmProvider: String,
    latency: Number,
    error: String,
  },
});

export type Message = InferSchemaType<typeof MessageSchema>;

export const MessageModel = mongoose.models.Message || mongoose.model('Message', MessageSchema);
