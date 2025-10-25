import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export interface Place {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius?: number
): Promise<Place[]> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY is not defined');
    }

    const params: any = {
      query: query,
      key: apiKey,
      language: 'zh-TW' as any, // 設定為繁體中文
    };

    if (location) {
      params.location = location;
    }

    if (radius) {
      params.radius = radius;
    }

    const response = await client.textSearch({ params });

    if (response.data.results) {
      return response.data.results.map((result) => ({
        name: result.name || '',
        address: result.formatted_address || '',
        latitude: result.geometry?.location.lat || 0,
        longitude: result.geometry?.location.lng || 0,
      }));
    }

    return [];
  } catch (error) {
    console.error('Places search error:', error);
    return [];
  }
}

export async function getPlaceAutocomplete(
  input: string,
  location?: { lat: number; lng: number }
): Promise<string[]> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY is not defined');
    }

    const params: any = {
      input: input,
      key: apiKey,
      language: 'zh-TW' as any, // 設定為繁體中文
    };

    if (location) {
      params.location = `${location.lat},${location.lng}`;
    }

    const response = await client.placeAutocomplete({ params });

    if (response.data.predictions) {
      return response.data.predictions.map((pred) => pred.description);
    }

    return [];
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
}

