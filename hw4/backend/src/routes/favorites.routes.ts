import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { 
  addFavorite, 
  removeFavorite, 
  getUserFavorites, 
  checkFavorite 
} from '../controllers/favorites.controller';

const router = Router();

// 所有路由都需要認證
router.use(authenticateToken);

// GET /api/favorites - 獲取用戶收藏列表
router.get('/', getUserFavorites);

// GET /api/favorites/:listingId/check - 檢查是否已收藏
router.get('/:listingId/check', checkFavorite);

// POST /api/favorites/:listingId - 添加收藏
router.post('/:listingId', addFavorite);

// DELETE /api/favorites/:listingId - 移除收藏
router.delete('/:listingId', removeFavorite);

export default router;
