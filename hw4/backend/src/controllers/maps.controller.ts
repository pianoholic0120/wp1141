import { Request, Response } from 'express';
import { geocodeAddress, reverseGeocode } from '../services/geocoding.service';
import { searchPlaces } from '../services/places.service';

export async function geocode(req: Request, res: Response): Promise<void> {
  try {
    const { address } = req.body;

    if (!address) {
      res.status(400).json({ error: '地址為必填項目' });
      return;
    }

    const result = await geocodeAddress(address);

    if (!result) {
      res.status(404).json({ error: '無法找到該地址' });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({ error: '地理編碼失敗' });
  }
}

export async function reverseGeocodeHandler(req: Request, res: Response): Promise<void> {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: '緯度和經度為必填項目' });
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const address = await reverseGeocode(lat, lng);

    if (!address) {
      res.status(404).json({ error: '無法找到該座標的地址' });
      return;
    }

    res.status(200).json({ address });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: '反向地理編碼失敗' });
  }
}

export async function searchPlacesHandler(req: Request, res: Response): Promise<void> {
  try {
    const { query, location, radius } = req.query;

    if (!query) {
      res.status(400).json({ error: '搜尋關鍵字為必填項目' });
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
    res.status(500).json({ error: '地點搜尋失敗' });
  }
}

