// 關卡中文名稱映射
export const levelNames: Record<string, string> = {
  'Level-1': '啟程',
  'Level-2': '繞行', 
  'Level-3': '合作',
  'Level-4': '慣性',
  'Level-5': '夥伴',
  'Level-6': '窄門',
  'Level-7': '疊加',
  'Level-8': '聚集'
};

export function getLevelChineseName(levelId: string): string {
  return levelNames[levelId] || levelId;
}
