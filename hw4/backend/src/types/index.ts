export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface UserDTO {
  id: number;
  email: string;
  username: string;
}

export interface Listing {
  id: number;
  user_id: number;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  property_type: string;
  status: 'available' | 'rented' | 'pending';
  floor?: number;
  contact_phone?: string;
  management_fee?: number;
  amenities?: string; // JSON string of array
  created_at: string;
  updated_at: string;
}

export interface ListingWithUser extends Listing {
  username: string;
}

export interface ListingFilters {
  search?: string;
  distance?: number;
  lat?: number;
  lng?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  status?: string;
  amenities?: string[];
}

export interface JWTPayload {
  userId: number;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Express.Request {
  user?: {
    userId: number;
  };
}

