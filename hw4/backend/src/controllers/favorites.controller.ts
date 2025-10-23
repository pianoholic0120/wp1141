import { Request, Response } from 'express';
import { FavoriteModel } from '../models/Favorite';
import { AuthRequest } from '../middleware/auth.middleware';

export function addFavorite(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const { listingId } = req.params;

    if (!listingId || isNaN(Number(listingId))) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    // 檢查是否已經收藏
    if (FavoriteModel.isFavorite(userId, Number(listingId))) {
      res.status(400).json({ error: 'Listing already in favorites' });
      return;
    }

    const favorite = FavoriteModel.addFavorite(userId, Number(listingId));
    res.status(201).json({ favorite });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
}

export function removeFavorite(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const { listingId } = req.params;

    if (!listingId || isNaN(Number(listingId))) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    const success = FavoriteModel.removeFavorite(userId, Number(listingId));
    
    if (!success) {
      res.status(404).json({ error: 'Favorite not found' });
      return;
    }

    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
}

export function getUserFavorites(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const favorites = FavoriteModel.getUserFavorites(userId);
    res.json({ favorites });
  } catch (error) {
    console.error('Error getting user favorites:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
}

export function checkFavorite(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user!.userId;
    const { listingId } = req.params;

    if (!listingId || isNaN(Number(listingId))) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    const isFavorite = FavoriteModel.isFavorite(userId, Number(listingId));
    res.json({ isFavorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
}
