export const AMENITIES = [
  // 基本設施
  { value: '冷氣', label: '冷氣', category: 'basic' },
  { value: '暖氣', label: '暖氣', category: 'basic' },
  { value: '熱水器', label: '熱水器', category: 'basic' },
  { value: '網路', label: '網路', category: 'basic' },
  { value: '第四台', label: '第四台', category: 'basic' },
  { value: '瓦斯', label: '瓦斯', category: 'basic' },
  
  // 廚房設備
  { value: '廚房', label: '廚房', category: 'kitchen' },
  { value: '冰箱', label: '冰箱', category: 'kitchen' },
  { value: '瓦斯爐', label: '瓦斯爐', category: 'kitchen' },
  { value: '微波爐', label: '微波爐', category: 'kitchen' },
  { value: '飲水機', label: '飲水機', category: 'kitchen' },
  
  // 家具家電
  { value: '床', label: '床', category: 'furniture' },
  { value: '衣櫃', label: '衣櫃', category: 'furniture' },
  { value: '書桌', label: '書桌', category: 'furniture' },
  { value: '椅子', label: '椅子', category: 'furniture' },
  { value: '窗簾', label: '窗簾', category: 'furniture' },
  { value: '燈具', label: '燈具', category: 'furniture' },
  { value: '洗衣機', label: '洗衣機', category: 'furniture' },
  { value: '電視', label: '電視', category: 'furniture' },
  { value: '沙發', label: '沙發', category: 'furniture' },
  
  // 建築設施
  { value: '電梯', label: '電梯', category: 'building' },
  { value: '停車場', label: '停車場', category: 'building' },
  { value: '陽台', label: '陽台', category: 'building' },
  { value: '露台', label: '露台', category: 'building' },
  { value: '花園', label: '花園', category: 'building' },
  { value: '游泳池', label: '游泳池', category: 'building' },
  { value: '健身房', label: '健身房', category: 'building' },
  { value: '保全', label: '保全', category: 'building' },
  { value: '管理員', label: '管理員', category: 'building' },
  { value: '門禁', label: '門禁', category: 'building' },
  { value: '監視器', label: '監視器', category: 'building' },
  { value: '消防設備', label: '消防設備', category: 'building' },
  { value: '逃生梯', label: '逃生梯', category: 'building' },
  { value: '無障礙設施', label: '無障礙設施', category: 'building' },
  
  // 交通便利性
  { value: '近捷運站', label: '近捷運站', category: 'location' },
  { value: '近公車站', label: '近公車站', category: 'location' },
  { value: '近學校', label: '近學校', category: 'location' },
  { value: '近市場', label: '近市場', category: 'location' },
  { value: '近公園', label: '近公園', category: 'location' },
  
  // 其他特色
  { value: '寵物友善', label: '寵物友善', category: 'other' },
  { value: '獨立套房', label: '獨立套房', category: 'other' },
  { value: '可租屋補助', label: '可租屋補助', category: 'other' },
  { value: '可短租', label: '可短租', category: 'other' },
  { value: '可設籍', label: '可設籍', category: 'other' },
  { value: '禁菸', label: '禁菸', category: 'other' },
  { value: '可吸菸', label: '可吸菸', category: 'other' },
  { value: '禁酒', label: '禁酒', category: 'other' },
  { value: '安靜', label: '安靜', category: 'other' },
  { value: '採光好', label: '採光好', category: 'other' },
  { value: '通風佳', label: '通風佳', category: 'other' },
  
  // 管理相關
  { value: '管理費', label: '管理費', category: 'building' },
  { value: '水電包含', label: '水電包含', category: 'basic' },
  { value: '聯絡電話', label: '聯絡電話', category: 'other' },
  
  // 購物與生活
  { value: '近購物中心', label: '近購物中心', category: 'location' },
  { value: '近醫院', label: '近醫院', category: 'location' },
  
  // 家具與設備
  { value: '附家具', label: '附家具', category: 'furniture' },
  { value: '屋頂花園', label: '屋頂花園', category: 'building' },
  { value: '門房服務', label: '門房服務', category: 'building' },
];

export const AMENITY_CATEGORIES = {
  basic: '基本設施',
  kitchen: '廚房設備',
  furniture: '家具家電',
  building: '建築設施',
  location: '交通便利',
  other: '其他',
};

export function parseAmenities(amenitiesString: string | null | undefined): string[] {
  if (!amenitiesString) return [];
  try {
    return JSON.parse(amenitiesString);
  } catch {
    return [];
  }
}

