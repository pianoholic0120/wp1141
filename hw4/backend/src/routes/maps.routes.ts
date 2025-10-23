import { Router } from 'express';
import { geocode, reverseGeocodeHandler, searchPlacesHandler } from '../controllers/maps.controller';

const router = Router();

router.post('/geocode', geocode);
router.post('/reverse-geocode', reverseGeocodeHandler);
router.get('/places', searchPlacesHandler);

export default router;

