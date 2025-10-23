import { db } from '../config/database';

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

export class RatingModel {
  static addOrUpdateRating(userId: number, listingId: number, rating: number, comment?: string): Rating {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(`
      INSERT INTO ratings (user_id, listing_id, rating, comment)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, listing_id) 
      DO UPDATE SET 
        rating = excluded.rating,
        comment = excluded.comment,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    const result = stmt.run(userId, listingId, rating, comment);
    return {
      id: Number(result.lastInsertRowid),
      user_id: userId,
      listing_id: listingId,
      rating,
      comment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  static deleteRating(userId: number, listingId: number): boolean {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(`
      DELETE FROM ratings 
      WHERE user_id = ? AND listing_id = ?
    `);
    
    const result = stmt.run(userId, listingId);
    return result.changes > 0;
  }

  static getUserRatings(userId: number): RatingWithListing[] {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(`
      SELECT 
        r.id,
        r.user_id,
        r.listing_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        l.id as listing_id,
        l.title,
        l.address,
        l.price,
        l.bedrooms,
        l.bathrooms,
        l.area_sqft,
        l.property_type,
        l.status,
        l.amenities,
        l.latitude,
        l.longitude
      FROM ratings r
      JOIN listings l ON r.listing_id = l.id
      WHERE r.user_id = ?
      ORDER BY r.updated_at DESC
    `);
    
    const results = stmt.all(userId) as any[];
    
    // 轉換數據結構以匹配 RatingWithListing 接口
    return results.map(row => ({
      id: row.id,
      user_id: row.user_id,
      listing_id: row.listing_id,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      updated_at: row.updated_at,
      listing: {
        id: row.listing_id,
        title: row.title,
        address: row.address,
        price: row.price,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        area_sqft: row.area_sqft,
        property_type: row.property_type,
        status: row.status,
        amenities: row.amenities,
        latitude: row.latitude,
        longitude: row.longitude,
      }
    }));
  }

  static getListingRatings(listingId: number): RatingWithUser[] {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(`
      SELECT 
        r.id,
        r.user_id,
        r.listing_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        u.id as user_id,
        u.username
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.listing_id = ?
      ORDER BY r.created_at DESC
    `);
    
    const results = stmt.all(listingId) as any[];
    
    // 轉換數據結構以匹配 RatingWithUser 接口
    return results.map(row => ({
      id: row.id,
      user_id: row.user_id,
      listing_id: row.listing_id,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        username: row.username,
      }
    }));
  }

  static getListingRatingStats(listingId: number): ListingRatingStats {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_ratings,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
      FROM ratings 
      WHERE listing_id = ?
    `);
    
    const result = stmt.get(listingId) as {
      average_rating: number;
      total_ratings: number;
      rating_5: number;
      rating_4: number;
      rating_3: number;
      rating_2: number;
      rating_1: number;
    };
    
    return {
      average_rating: result.average_rating || 0,
      total_ratings: result.total_ratings || 0,
      rating_breakdown: {
        5: result.rating_5 || 0,
        4: result.rating_4 || 0,
        3: result.rating_3 || 0,
        2: result.rating_2 || 0,
        1: result.rating_1 || 0,
      },
    };
  }

  static getUserRatingForListing(userId: number, listingId: number): Rating | null {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(`
      SELECT * FROM ratings 
      WHERE user_id = ? AND listing_id = ?
    `);
    
    return stmt.get(userId, listingId) as Rating | null;
  }
}
