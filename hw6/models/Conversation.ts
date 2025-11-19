import mongoose, { Schema, InferSchemaType } from 'mongoose';

const ConversationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  platform: { type: String, default: 'line' },
  startedAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now },
  messageCount: { type: Number, default: 0 },
  metadata: {
    userName: String,
    userPictureUrl: String,
    tags: [String],
    locale: String, // 語言設定：'zh-TW' 或 'en-US'
    // Session state management
    state: String, // ConversationState enum
    lastQuery: String,
    lastSearchResults: [Schema.Types.Mixed], // Array of events
    selectedEvent: Schema.Types.Mixed, // Selected event object
    selectedEventIndex: Number,
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active',
  },
});

export type Conversation = InferSchemaType<typeof ConversationSchema>;

export const ConversationModel =
  mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
