import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ListingModel } from '../models/Listing';

export function isOwner(req: AuthRequest, res: Response, next: NextFunction): void {
  const listingId = parseInt(req.params.id);
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const listing = ListingModel.findById(listingId);

  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }

  if (listing.user_id !== userId) {
    res.status(403).json({ error: 'Access denied. You do not own this listing.' });
    return;
  }

  next();
}

