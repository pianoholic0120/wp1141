import api from './api';

export interface Favorite {
  id: number;
  user_id: number;
  listing_id: number;
  created_at: string;
}

export interface FavoriteWithListing extends Favorite {
  listing: {
    id: number;
    title: string;
    address: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    area_sqft: number;
    property_type: string;
    status: string;
    amenities: string;
    latitude: number;
    longitude: number;
  };
}

export const favoritesService = {
  // 添加收藏
  async addFavorite(listingId: number): Promise<Favorite> {
    const response = await api.post<{ favorite: Favorite }>(`/favorites/${listingId}`);
    return response.data.favorite;
  },

  // 移除收藏
  async removeFavorite(listingId: number): Promise<void> {
    await api.delete(`/favorites/${listingId}`);
  },

  // 獲取用戶收藏列表
  async getUserFavorites(): Promise<FavoriteWithListing[]> {
    const response = await api.get<{ favorites: FavoriteWithListing[] }>('/favorites');
    return response.data.favorites;
  },

  // 檢查是否已收藏
  async checkFavorite(listingId: number): Promise<boolean> {
    const response = await api.get<{ isFavorite: boolean }>(`/favorites/${listingId}/check`);
    return response.data.isFavorite;
  },
};
