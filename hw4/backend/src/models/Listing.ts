import { getDatabase } from '../config/database';
import { Listing, ListingWithUser, ListingFilters } from '../types';

export class ListingModel {
  static create(userId: number, data: Omit<Listing, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Listing {
    const db = getDatabase();

    const stmt = db.prepare(`
      INSERT INTO listings (
        user_id, title, description, address, latitude, longitude,
        price, bedrooms, bathrooms, area_sqft, property_type, status,
        floor, contact_phone, management_fee, amenities
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      data.title,
      data.description,
      data.address,
      data.latitude,
      data.longitude,
      data.price,
      data.bedrooms,
      data.bathrooms,
      data.area_sqft,
      data.property_type,
      data.status || 'available',
      data.floor || null,
      data.contact_phone || null,
      data.management_fee || null,
      data.amenities || null,
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): Listing | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM listings WHERE id = ?');
    const listing = stmt.get(id) as Listing | undefined;
    return listing || null;
  }

  static findByIdWithUser(id: number): ListingWithUser | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT l.*, u.username
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `);
    const listing = stmt.get(id) as ListingWithUser | undefined;
    return listing || null;
  }

  static findAll(filters?: ListingFilters): ListingWithUser[] {
    const db = getDatabase();
    let query = `
      SELECT l.*, u.username
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters) {
      if (filters.search) {
        query += ` AND (l.title LIKE ? OR l.description LIKE ? OR l.address LIKE ?)`;
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (filters.minPrice !== undefined) {
        query += ` AND l.price >= ?`;
        params.push(filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query += ` AND l.price <= ?`;
        params.push(filters.maxPrice);
      }

      if (filters.propertyType) {
        query += ` AND l.property_type = ?`;
        params.push(filters.propertyType);
      }

      if (filters.bedrooms !== undefined) {
        query += ` AND l.bedrooms >= ?`;
        params.push(filters.bedrooms);
      }

      if (filters.bathrooms !== undefined) {
        query += ` AND l.bathrooms >= ?`;
        params.push(filters.bathrooms);
      }

      if (filters.status) {
        query += ` AND l.status = ?`;
        params.push(filters.status);
      }

      // 城市篩選
      if (filters.city) {
        query += ` AND l.address LIKE ?`;
        params.push(`%${filters.city}%`);
      }

      // 區域篩選
      if (filters.district) {
        query += ` AND l.address LIKE ?`;
        params.push(`%${filters.district}%`);
      }

      // 公設篩選 - 包含所有選中的公設
      if (filters.amenities && filters.amenities.length > 0) {
        const amenityConditions = filters.amenities.map(() => 'l.amenities LIKE ?').join(' AND ');
        query += ` AND (${amenityConditions})`;
        filters.amenities.forEach(amenity => {
          params.push(`%"${amenity}"%`);
        });
      }
    }

    query += ` ORDER BY l.created_at DESC`;

    const stmt = db.prepare(query);
    const listings = stmt.all(...params) as ListingWithUser[];

    // Apply distance filter if coordinates provided
    if (filters?.distance && filters.lat !== undefined && filters.lng !== undefined) {
      return listings.filter(listing => {
        const distance = this.calculateDistance(
          filters.lat!,
          filters.lng!,
          listing.latitude,
          listing.longitude
        );
        return distance <= filters.distance!;
      });
    }

    return listings;
  }

  static findByUserId(userId: number): ListingWithUser[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT l.*, u.username
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `);
    return stmt.all(userId) as ListingWithUser[];
  }

  static update(id: number, data: Partial<Listing>): boolean {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'title', 'description', 'address', 'latitude', 'longitude',
      'price', 'bedrooms', 'bathrooms', 'area_sqft', 'property_type', 'status',
      'floor', 'contact_phone', 'management_fee', 'amenities'
    ];

    for (const field of allowedFields) {
      if (data[field as keyof Listing] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field as keyof Listing]);
      }
    }

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE listings SET ${updates.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  static delete(id: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM listings WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static findNearby(lat: number, lng: number, radius: number): ListingWithUser[] {
    const allListings = this.findAll();
    return allListings.filter(listing => {
      const distance = this.calculateDistance(lat, lng, listing.latitude, listing.longitude);
      return distance <= radius;
    });
  }

  static search(query: string): ListingWithUser[] {
    return this.findAll({ search: query });
  }

  // Haversine formula to calculate distance between two coordinates
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

