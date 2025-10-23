export const AMENITIES = [
  // 基本設施
  { value: 'air_conditioning', label: '冷氣', category: 'basic' },
  { value: 'heating', label: '暖氣', category: 'basic' },
  { value: 'water_heater', label: '熱水器', category: 'basic' },
  { value: 'internet', label: '網路', category: 'basic' },
  { value: 'cable_tv', label: '第四台', category: 'basic' },
  { value: 'gas', label: '瓦斯', category: 'basic' },
  
  // 廚房設備
  { value: 'kitchen', label: '廚房', category: 'kitchen' },
  { value: 'refrigerator', label: '冰箱', category: 'kitchen' },
  { value: 'gas_stove', label: '瓦斯爐', category: 'kitchen' },
  { value: 'microwave', label: '微波爐', category: 'kitchen' },
  { value: 'water_dispenser', label: '飲水機', category: 'kitchen' },
  
  // 家具家電
  { value: 'bed', label: '床', category: 'furniture' },
  { value: 'wardrobe', label: '衣櫃', category: 'furniture' },
  { value: 'desk', label: '書桌', category: 'furniture' },
  { value: 'chair', label: '椅子', category: 'furniture' },
  { value: 'curtain', label: '窗簾', category: 'furniture' },
  { value: 'lighting', label: '燈具', category: 'furniture' },
  { value: 'washing_machine', label: '洗衣機', category: 'furniture' },
  { value: 'tv', label: '電視', category: 'furniture' },
  { value: 'sofa', label: '沙發', category: 'furniture' },
  
  // 建築設施
  { value: 'elevator', label: '電梯', category: 'building' },
  { value: 'parking', label: '停車位', category: 'building' },
  { value: 'balcony', label: '陽台', category: 'building' },
  { value: 'terrace', label: '露台', category: 'building' },
  { value: 'garden', label: '花園', category: 'building' },
  { value: 'swimming_pool', label: '游泳池', category: 'building' },
  { value: 'gym', label: '健身房', category: 'building' },
  { value: 'security', label: '保全', category: 'building' },
  { value: 'management', label: '管理員', category: 'building' },
  { value: 'access_control', label: '門禁', category: 'building' },
  { value: 'camera', label: '監視器', category: 'building' },
  { value: 'fire_safety', label: '消防設備', category: 'building' },
  { value: 'emergency_exit', label: '逃生梯', category: 'building' },
  { value: 'accessible', label: '無障礙設施', category: 'building' },
  
  // 交通便利性
  { value: 'near_mrt', label: '近捷運站', category: 'location' },
  { value: 'near_bus', label: '近公車站', category: 'location' },
  { value: 'near_school', label: '近學校', category: 'location' },
  { value: 'near_market', label: '近市場/超市', category: 'location' },
  { value: 'near_park', label: '近公園', category: 'location' },
  
  // 其他特色
  { value: 'pet_friendly', label: '寵物友善', category: 'other' },
  { value: 'independent_suite', label: '獨立套房', category: 'other' },
  { value: 'independent_studio', label: '獨立套房', category: 'other' },
  { value: 'rent_subsidy', label: '可租屋補助', category: 'other' },
  { value: 'short_term', label: '可短租', category: 'other' },
  { value: 'legal_registration', label: '可設籍', category: 'other' },
  { value: 'no_smoking', label: '禁菸', category: 'other' },
  { value: 'smoking_allowed', label: '可吸菸', category: 'other' },
  { value: 'no_alcohol', label: '禁酒', category: 'other' },
  { value: 'quiet', label: '安靜', category: 'other' },
  { value: 'quiet_area', label: '安靜區域', category: 'other' },
  { value: 'good_lighting', label: '採光好', category: 'other' },
  { value: 'good_ventilation', label: '通風佳', category: 'other' },
  
  // 管理相關
  { value: 'management_fee', label: '管理費', category: 'building' },
  { value: 'utilities_included', label: '水電包含', category: 'basic' },
  { value: 'contact_number', label: '聯絡電話', category: 'other' },
  { value: 'floor', label: '樓層', category: 'building' },
  
  // 購物與生活
  { value: 'near_shopping', label: '近購物中心', category: 'location' },
  { value: 'near_hospital', label: '近醫院', category: 'location' },
  
  // 家具與設備
  { value: 'furnished', label: '附家具', category: 'furniture' },
  { value: 'rooftop', label: '屋頂花園', category: 'building' },
  { value: 'concierge', label: '門房服務', category: 'building' },
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

