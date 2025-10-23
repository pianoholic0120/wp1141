import api from './api';
import { Listing, ListingFormData, ListingFilters } from '../types';

export const listingsService = {
  async getAllListings(filters?: ListingFilters): Promise<{ listings: Listing[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<{ listings: Listing[]; total: number }>(
      `/listings?${params.toString()}`
    );
    
    // Parse amenities and images from JSON string to array
    const listings = response.data.listings.map(listing => ({
      ...listing,
      amenities: typeof listing.amenities === 'string' 
        ? JSON.parse(listing.amenities || '[]') 
        : listing.amenities || [],
    }));
    
    return { ...response.data, listings };
  },

  async getListing(id: number): Promise<Listing> {
    const response = await api.get<{ listing: Listing }>(`/listings/${id}`);
    const listing = response.data.listing;
    return {
      ...listing,
      amenities: typeof listing.amenities === 'string' 
        ? JSON.parse(listing.amenities || '[]') 
        : listing.amenities || [],
    };
  },

  async createListing(data: ListingFormData): Promise<Listing> {
    const response = await api.post<{ message: string; listing: Listing }>('/listings', data);
    return response.data.listing;
  },

  async updateListing(id: number, data: Partial<ListingFormData>): Promise<Listing> {
    const response = await api.put<{ message: string; listing: Listing }>(`/listings/${id}`, data);
    return response.data.listing;
  },

  async deleteListing(id: number): Promise<void> {
    await api.delete(`/listings/${id}`);
  },

  async getUserListings(): Promise<Listing[]> {
    const response = await api.get<{ listings: Listing[]; total: number }>('/listings/user/me');
    return response.data.listings.map(listing => ({
      ...listing,
      amenities: typeof listing.amenities === 'string' 
        ? JSON.parse(listing.amenities || '[]') 
        : listing.amenities || [],
    }));
  },
};

