import api from './api';

export interface Rating {
  id: number;
  user_id: number;
  listing_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface RatingWithUser extends Rating {
  user: {
    id: number;
    username: string;
  };
}

export interface RatingWithListing extends Rating {
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

export interface ListingRatingStats {
  average_rating: number;
  total_ratings: number;
  rating_breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export const ratingsService = {
  // 添加或更新評分
  async addOrUpdateRating(listingId: number, rating: number, comment?: string): Promise<Rating> {
    const response = await api.post<{ rating: Rating }>(`/ratings/${listingId}`, {
      rating,
      comment,
    });
    return response.data.rating;
  },

  // 刪除評分
  async deleteRating(listingId: number): Promise<void> {
    await api.delete(`/ratings/${listingId}`);
  },

  // 獲取用戶的評分列表
  async getUserRatings(): Promise<RatingWithListing[]> {
    const response = await api.get<{ ratings: RatingWithListing[] }>('/ratings/my');
    return response.data.ratings;
  },

  // 獲取房屋的所有評分
  async getListingRatings(listingId: number): Promise<RatingWithUser[]> {
    const response = await api.get<{ ratings: RatingWithUser[] }>(`/ratings/${listingId}`);
    return response.data.ratings;
  },

  // 獲取房屋評分統計
  async getListingRatingStats(listingId: number): Promise<ListingRatingStats> {
    const response = await api.get<{ stats: ListingRatingStats }>(`/ratings/${listingId}/stats`);
    return response.data.stats;
  },

  // 獲取用戶對特定房屋的評分
  async getUserRatingForListing(listingId: number): Promise<Rating | null> {
    const response = await api.get<{ rating: Rating | null }>(`/ratings/${listingId}/my`);
    return response.data.rating;
  },
};
