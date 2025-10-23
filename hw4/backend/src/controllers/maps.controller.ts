import { Request, Response } from 'express';
import { geocodeAddress, reverseGeocode } from '../services/geocoding.service';
import { searchPlaces } from '../services/places.service';

export async function geocode(req: Request, res: Response): Promise<void> {
  try {
    const { address } = req.body;

    if (!address) {
      res.status(400).json({ error: 'Address is required' });
      return;
    }

    const result = await geocodeAddress(address);

    if (!result) {
      res.status(404).json({ error: 'Could not geocode address' });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({ error: 'Geocoding failed' });
  }
}

export async function reverseGeocodeHandler(req: Request, res: Response): Promise<void> {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const address = await reverseGeocode(lat, lng);

    if (!address) {
      res.status(404).json({ error: 'Could not reverse geocode coordinates' });
      return;
    }

    res.status(200).json({ address });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: 'Reverse geocoding failed' });
  }
}

export async function searchPlacesHandler(req: Request, res: Response): Promise<void> {
  try {
    const { query, location, radius } = req.query;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    let locationObj;
    if (location) {
      const [lat, lng] = (location as string).split(',').map(parseFloat);
      if (!isNaN(lat) && !isNaN(lng)) {
        locationObj = { lat, lng };
      }
    }

    const radiusNum = radius ? parseInt(radius as string) : undefined;

    const places = await searchPlaces(query as string, locationObj, radiusNum);

    res.status(200).json({ places });
  } catch (error) {
    console.error('Search places error:', error);
    res.status(500).json({ error: 'Place search failed' });
  }
}

