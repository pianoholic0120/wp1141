import api from './api';
import { GeocodeResult, Place } from '../types';

export const mapsService = {
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    const response = await api.post<GeocodeResult>('/maps/geocode', { address });
    return response.data;
  },

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const response = await api.post<{ address: string }>('/maps/reverse-geocode', {
      latitude,
      longitude,
    });
    return response.data.address;
  },

  async searchPlaces(query: string, location?: { lat: number; lng: number }, radius?: number): Promise<Place[]> {
    const params = new URLSearchParams({ query });
    
    if (location) {
      params.append('location', `${location.lat},${location.lng}`);
    }
    
    if (radius) {
      params.append('radius', radius.toString());
    }

    const response = await api.get<{ places: Place[] }>(`/maps/places?${params.toString()}`);
    return response.data.places;
  },
};

