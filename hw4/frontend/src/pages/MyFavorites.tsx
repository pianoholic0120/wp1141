import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoritesService, FavoriteWithListing } from '@/services/favorites.service';
import { ratingsService, ListingRatingStats } from '@/services/ratings.service';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingDetailDialog } from '@/components/listings/ListingDetailDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Listing } from '@/types';

export default function MyFavorites() {
  const [favorites, setFavorites] = useState<FavoriteWithListing[]>([]);
  const [ratingStats, setRatingStats] = useState<{ [key: number]: ListingRatingStats }>({});
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favoritesData = await favoritesService.getUserFavorites();
      setFavorites(favoritesData);

      // 簡化評分統計載入，避免過多 API 請求
      const statsMap: { [key: number]: ListingRatingStats } = {};
      favoritesData.forEach((favorite) => {
        statsMap[favorite.listing_id] = { 
          average_rating: 0, 
          total_ratings: 0, 
          rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } 
        };
      });
      setRatingStats(statsMap);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      toast.error('載入收藏列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // const handleRemoveFavorite = async (listingId: number) => {
  //   try {
  //     await favoritesService.removeFavorite(listingId);
  //     setFavorites(prev => prev.filter(fav => fav.listing_id !== listingId));
  //     toast.success('已從收藏中移除');
  //   } catch (error: any) {
  //     console.error('Failed to remove favorite:', error);
  //     toast.error(error.response?.data?.error || '移除收藏失敗');
  //   }
  // };

  const handleViewDetails = (listingId: number) => {
    // 找到對應的房屋並顯示詳細資料對話框
    const favorite = favorites.find(f => f.listing_id === listingId);
    if (favorite) {
      const listing: Listing = {
        id: favorite.listing.id,
        title: favorite.listing.title,
        address: favorite.listing.address,
        price: favorite.listing.price,
        bedrooms: favorite.listing.bedrooms,
        bathrooms: favorite.listing.bathrooms,
        area_sqft: favorite.listing.area_sqft,
        property_type: favorite.listing.property_type,
        status: favorite.listing.status as 'available' | 'rented' | 'pending',
        amenities: JSON.parse(favorite.listing.amenities || '[]'),
        latitude: favorite.listing.latitude,
        longitude: favorite.listing.longitude,
        description: '',
        floor: 0,
        contact_phone: '',
        management_fee: 0,
        user_id: 0,
        created_at: '',
        updated_at: '',
        username: '',
        distance: undefined,
      };
      setSelectedListing(listing);
      setDetailDialogOpen(true);
    }
  };

  const handleFavoriteUpdate = async (listingId: number) => {
    // 當收藏狀態更新後，重新載入收藏列表
    console.log('handleFavoriteUpdate called for listingId:', listingId);
    
    try {
      const updatedFavorites = await favoritesService.getUserFavorites();
      console.log('Updated favorites from API:', updatedFavorites);
      console.log('Favorites count before:', favorites.length);
      console.log('Favorites count after:', updatedFavorites.length);
      
      setFavorites(updatedFavorites);
      toast.success('收藏列表已更新');
    } catch (error) {
      console.error('Failed to refresh favorites:', error);
      toast.error('更新收藏列表失敗');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            <h1 className="text-3xl font-bold">我的收藏</h1>
          </div>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">尚未收藏任何房屋</h3>
            <p className="text-muted-foreground mb-4">
              開始瀏覽房屋並收藏您喜歡的選項
            </p>
            <Button onClick={() => navigate('/')}>
              瀏覽房屋
            </Button>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              {favorites.length} 個收藏
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => (
                <ListingCard
                  key={favorite.id}
                  listing={{
                    id: favorite.listing.id,
                    title: favorite.listing.title,
                    address: favorite.listing.address,
                    price: favorite.listing.price,
                    bedrooms: favorite.listing.bedrooms,
                    bathrooms: favorite.listing.bathrooms,
                    area_sqft: favorite.listing.area_sqft,
                    property_type: favorite.listing.property_type,
                    status: favorite.listing.status as 'available' | 'rented' | 'pending',
                    amenities: JSON.parse(favorite.listing.amenities || '[]'),
                    latitude: favorite.listing.latitude,
                    longitude: favorite.listing.longitude,
                    description: '',
                    floor: 0,
                    contact_phone: '',
                    management_fee: 0,
                    user_id: 0,
                    created_at: '',
                    updated_at: '',
                    username: '',
                    distance: undefined,
                  }}
                  showFavorite={true}
                  showRating={true}
                  ratingStats={ratingStats[favorite.listing_id]}
                  showViewButton={true}
                  onView={() => handleViewDetails(favorite.listing_id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* 詳細資料對話框 */}
      <ListingDetailDialog
        listing={selectedListing}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onFavoriteUpdate={handleFavoriteUpdate}
      />
    </div>
  );
}
