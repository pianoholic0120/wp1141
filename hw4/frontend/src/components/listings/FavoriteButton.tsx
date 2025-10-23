import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { favoritesService } from '@/services/favorites.service';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FavoriteButtonProps {
  listingId: number;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onFavoriteUpdate?: (listingId: number) => void;
}

export function FavoriteButton({ 
  listingId, 
  className = '',
  size = 'sm',
  variant = 'ghost',
  onFavoriteUpdate
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 檢查初始收藏狀態
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const favorite = await favoritesService.checkFavorite(listingId);
        setIsFavorite(favorite);
      } catch (error) {
        console.error('Failed to check favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [listingId]);

  const handleToggleFavorite = async () => {
    if (loading) return;

    if (isFavorite) {
      // 如果是移除收藏，顯示確認對話框
      setShowConfirmDialog(true);
    } else {
      // 如果是添加收藏，直接執行
      await addFavorite();
    }
  };

  const addFavorite = async () => {
    setLoading(true);
    try {
      await favoritesService.addFavorite(listingId);
      setIsFavorite(true);
      toast.success('已加入收藏');
      // 調用收藏更新回調
      console.log('Calling onFavoriteUpdate for listingId:', listingId);
      onFavoriteUpdate?.(listingId);
    } catch (error: any) {
      console.error('Failed to add favorite:', error);
      toast.error(error.response?.data?.error || '加入收藏失敗');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async () => {
    setLoading(true);
    try {
      console.log('removeFavorite: Starting removal for listingId:', listingId);
      console.log('removeFavorite: onFavoriteUpdate prop received:', !!onFavoriteUpdate);
      
      await favoritesService.removeFavorite(listingId);
      console.log('removeFavorite: Successfully removed from API');
      setIsFavorite(false);
      toast.success('已從收藏中移除');
      
      // 調用收藏更新回調
      console.log('removeFavorite: Calling onFavoriteUpdate for listingId:', listingId);
      if (onFavoriteUpdate) {
        console.log('removeFavorite: Calling onFavoriteUpdate...');
        onFavoriteUpdate(listingId);
        console.log('removeFavorite: onFavoriteUpdate called successfully');
      } else {
        console.log('removeFavorite: onFavoriteUpdate is not defined - this is the problem!');
      }
    } catch (error: any) {
      console.error('Failed to remove favorite:', error);
      toast.error(error.response?.data?.error || '移除收藏失敗');
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleToggleFavorite}
        disabled={loading}
        className={`${className} ${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'}`}
      >
        <Heart 
          className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} 
        />
      </Button>

      {/* 確認移除收藏對話框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認移除收藏</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要將此房屋從收藏清單中移除嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={removeFavorite} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? '移除中...' : '確認移除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
