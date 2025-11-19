export type LineEvent = {
  type: 'message' | 'postback' | 'follow';
  replyToken?: string;
  source?: { userId?: string };
  message?: { type: 'text' | 'image' | 'sticker'; text?: string };
};
