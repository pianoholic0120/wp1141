import { Request, Response } from 'express';
import { RatingModel } from '../models/Rating';
import { AuthRequest } from '../middleware/auth.middleware';

export function addOrUpdateRating(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const { listingId } = req.params;
    const { rating, comment } = req.body;

    if (!listingId || isNaN(Number(listingId))) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    const ratingRecord = RatingModel.addOrUpdateRating(
      userId, 
      Number(listingId), 
      rating, 
      comment
    );
    
    res.json({ rating: ratingRecord });
  } catch (error) {
    console.error('Error adding/updating rating:', error);
    res.status(500).json({ error: 'Failed to add/update rating' });
  }
}

export function deleteRating(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const { listingId } = req.params;

    if (!listingId || isNaN(Number(listingId))) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    const success = RatingModel.deleteRating(userId, Number(listingId));
    
    if (!success) {
      res.status(404).json({ error: 'Rating not found' });
      return;
    }

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ error: 'Failed to delete rating' });
  }
}

export function getUserRatings(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const ratings = RatingModel.getUserRatings(userId);
    res.json({ ratings });
  } catch (error) {
    console.error('Error getting user ratings:', error);
    res.status(500).json({ error: 'Failed to get user ratings' });
  }
}

export function getListingRatings(req: Request, res: Response): void {
  try {
    const { listingId } = req.params;

    if (!listingId || isNaN(Number(listingId))) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    const ratings = RatingModel.getListingRatings(Number(listingId));
    res.json({ ratings });
  } catch (error) {
    console.error('Error getting listing ratings:', error);
    res.status(500).json({ error: 'Failed to get listing ratings' });
  }
}

export function getListingRatingStats(req: Request, res: Response): void {
  try {
    const { listingId } = req.params;

    if (!listingId || isNaN(Number(listingId))) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    const stats = RatingModel.getListingRatingStats(Number(listingId));
    res.json({ stats });
  } catch (error) {
    console.error('Error getting listing rating stats:', error);
    res.status(500).json({ error: 'Failed to get rating statistics' });
  }
}

export function getUserRatingForListing(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const { listingId } = req.params;

    if (!listingId || isNaN(Number(listingId))) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    const rating = RatingModel.getUserRatingForListing(userId, Number(listingId));
    res.json({ rating });
  } catch (error) {
    console.error('Error getting user rating for listing:', error);
    res.status(500).json({ error: 'Failed to get user rating' });
  }
}
