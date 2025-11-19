/**
 * 文字格式化工具
 * 用於清理 Markdown 格式，轉換為 LINE 友好的純文字格式
 */

/**
 * 清理 Markdown 格式，轉換為純文字
 */
export function cleanMarkdown(text: string): string {
  let cleaned = text;

  // 移除粗體 **text** 或 __text__
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');

  // 移除斜體 *text* 或 _text_
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

  // 移除連結格式 [text](url) 轉換為 text: url
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2');

  // 移除刪除線 ~~text~~
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');

  // 移除行內代碼 `code`
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // 清理多餘的空格和換行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
}
