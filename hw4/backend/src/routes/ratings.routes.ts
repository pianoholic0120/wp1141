import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { 
  addOrUpdateRating, 
  deleteRating, 
  getUserRatings, 
  getListingRatings,
  getListingRatingStats,
  getUserRatingForListing
} from '../controllers/ratings.controller';

const router = Router();

// GET /api/ratings/my - 獲取用戶的評分列表（需要認證）
router.get('/my', authenticateToken, getUserRatings);

// GET /api/ratings/:listingId/stats - 獲取房屋評分統計（公開）
router.get('/:listingId/stats', getListingRatingStats);

// GET /api/ratings/:listingId/my - 獲取用戶對特定房屋的評分（需要認證）
router.get('/:listingId/my', authenticateToken, getUserRatingForListing);

// GET /api/ratings/:listingId - 獲取房屋的所有評分（公開）
router.get('/:listingId', getListingRatings);

// POST /api/ratings/:listingId - 添加或更新評分（需要認證）
router.post('/:listingId', authenticateToken, addOrUpdateRating);

// DELETE /api/ratings/:listingId - 刪除評分（需要認證）
router.delete('/:listingId', authenticateToken, deleteRating);

export default router;
