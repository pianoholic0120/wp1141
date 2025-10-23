import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY is not defined in environment');
      throw new Error('GOOGLE_MAPS_API_KEY is not defined');
    }

    console.log('Geocoding address:', address);
    console.log('Using API Key:', apiKey.substring(0, 10) + '...');

    const response = await client.geocode({
      params: {
        address: address,
        key: apiKey,
      },
    });

    console.log('Geocoding API status:', response.data.status);
    console.log('Results count:', response.data.results?.length || 0);

    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const geocodeResult = {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
      console.log('Geocoding successful:', geocodeResult);
      return geocodeResult;
    }

    if (response.data.status === 'ZERO_RESULTS') {
      console.error('No results found for address:', address);
    } else if (response.data.status === 'REQUEST_DENIED') {
      console.error('API request denied. Check API key and enabled APIs.');
    } else if (response.data.status === 'INVALID_REQUEST') {
      console.error('Invalid request. Address may be empty or malformed.');
    }

    console.error('Geocoding failed with status:', response.data.status);
    console.error('Error message:', response.data.error_message);
    return null;
  } catch (error: any) {
    console.error('Geocoding error:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY is not defined');
    }

    const response = await client.reverseGeocode({
      params: {
        latlng: { lat, lng },
        key: apiKey,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

