import { Router } from 'express';
import {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getUserListings
} from '../controllers/listings.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';
import { isOwner } from '../middleware/authorization.middleware';
import {
  validateListingCreate,
  validateListingUpdate,
  validateFilters
} from '../middleware/validation.middleware';

const router = Router();

router.get('/', optionalAuth, validateFilters, getAllListings);
router.get('/user/me', authenticateToken, getUserListings);
router.get('/:id', optionalAuth, getListingById);
router.post('/', authenticateToken, validateListingCreate, createListing);
router.put('/:id', authenticateToken, validateListingUpdate, isOwner, updateListing);
router.delete('/:id', authenticateToken, isOwner, deleteListing);

export default router;

