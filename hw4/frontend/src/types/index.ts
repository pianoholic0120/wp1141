export interface User {
  id: number;
  email: string;
  username: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
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
  amenities?: string[]; // Array of amenity strings
  created_at: string;
  updated_at: string;
  username?: string;
  distance?: number; // Distance in kilometers
}

export interface ListingFormData {
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
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface Place {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

