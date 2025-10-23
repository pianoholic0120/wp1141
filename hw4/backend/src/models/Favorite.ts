import { db } from '../config/database';

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

export class FavoriteModel {
  static addFavorite(userId: number, listingId: number): Favorite {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(`
      INSERT INTO favorites (user_id, listing_id)
      VALUES (?, ?)
    `);
    
    const result = stmt.run(userId, listingId);
    return {
      id: Number(result.lastInsertRowid),
      user_id: userId,
      listing_id: listingId,
      created_at: new Date().toISOString(),
    };
  }

  static removeFavorite(userId: number, listingId: number): boolean {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(`
      DELETE FROM favorites 
      WHERE user_id = ? AND listing_id = ?
    `);
    
    const result = stmt.run(userId, listingId);
    return result.changes > 0;
  }

  static getUserFavorites(userId: number): FavoriteWithListing[] {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(`
      SELECT 
        f.id,
        f.user_id,
        f.listing_id,
        f.created_at,
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
      FROM favorites f
      JOIN listings l ON f.listing_id = l.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `);
    
    const results = stmt.all(userId) as any[];
    
    // 轉換數據結構以匹配 FavoriteWithListing 接口
    return results.map(row => ({
      id: row.id,
      user_id: row.user_id,
      listing_id: row.listing_id,
      created_at: row.created_at,
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

  static isFavorite(userId: number, listingId: number): boolean {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(`
      SELECT id FROM favorites 
      WHERE user_id = ? AND listing_id = ?
    `);
    
    const result = stmt.get(userId, listingId);
    return !!result;
  }

  static getFavoriteCount(listingId: number): number {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM favorites 
      WHERE listing_id = ?
    `);
    
    const result = stmt.get(listingId) as { count: number };
    return result.count;
  }
}
