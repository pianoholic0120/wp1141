import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ratingsService, RatingWithListing } from '@/services/ratings.service';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingDetailDialog } from '@/components/listings/ListingDetailDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Listing } from '@/types';
import { ArrowLeft, Star, Edit, Trash2 } from 'lucide-react';
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

export default function MyRatings() {
  const [ratings, setRatings] = useState<RatingWithListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const ratingsData = await ratingsService.getUserRatings();
      setRatings(ratingsData);
    } catch (error) {
      console.error('Failed to load ratings:', error);
      toast.error('載入評分列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!deleteId) return;

    try {
      await ratingsService.deleteRating(deleteId);
      setRatings(prev => prev.filter(rating => rating.id !== deleteId));
      toast.success('評分已刪除');
      setDeleteId(null);
    } catch (error: any) {
      console.error('Failed to delete rating:', error);
      toast.error(error.response?.data?.error || '刪除評分失敗');
    }
  };

  const handleViewDetails = (listingId: number) => {
    // 找到對應的房屋並顯示詳細資料對話框
    const rating = ratings.find(r => r.listing_id === listingId);
    if (rating) {
      const listing: Listing = {
        id: rating.listing.id,
        title: rating.listing.title,
        address: rating.listing.address,
        price: rating.listing.price,
        bedrooms: rating.listing.bedrooms,
        bathrooms: rating.listing.bathrooms,
        area_sqft: rating.listing.area_sqft,
        property_type: rating.listing.property_type,
        status: rating.listing.status as 'available' | 'rented' | 'pending',
        amenities: JSON.parse(rating.listing.amenities || '[]'),
        latitude: rating.listing.latitude,
        longitude: rating.listing.longitude,
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

  const handleEditRating = (listingId: number) => {
    // 找到對應的房屋並顯示詳細資料對話框
    const rating = ratings.find(r => r.listing_id === listingId);
    if (rating) {
      const listing: Listing = {
        id: rating.listing.id,
        title: rating.listing.title,
        address: rating.listing.address,
        price: rating.listing.price,
        bedrooms: rating.listing.bedrooms,
        bathrooms: rating.listing.bathrooms,
        area_sqft: rating.listing.area_sqft,
        property_type: rating.listing.property_type,
        status: rating.listing.status as 'available' | 'rented' | 'pending',
        amenities: JSON.parse(rating.listing.amenities || '[]'),
        latitude: rating.listing.latitude,
        longitude: rating.listing.longitude,
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

  const handleRatingUpdate = async (listingId: number) => {
    // 當評分更新後，重新載入評分列表
    try {
      const updatedRatings = await ratingsService.getUserRatings();
      setRatings(updatedRatings);
      toast.success('評分已更新');
    } catch (error) {
      console.error('Failed to refresh ratings:', error);
      toast.error('更新評分列表失敗');
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
            <Star className="w-6 h-6 text-yellow-500" />
            <h1 className="text-3xl font-bold">我的評分</h1>
          </div>
        </div>

        {/* Content */}
        {ratings.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">尚未評分任何房屋</h3>
            <p className="text-muted-foreground mb-4">
              開始瀏覽房屋並為您居住過的房屋評分
            </p>
            <Button onClick={() => navigate('/')}>
              瀏覽房屋
            </Button>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              {ratings.length} 個評分
            </div>
            <div className="space-y-6">
              {ratings.map((rating) => (
                <div key={rating.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < rating.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {rating.rating} 星
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {rating.comment && (
                        <p className="text-sm text-muted-foreground mb-3">
                          "{rating.comment}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRating(rating.listing_id)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        編輯
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(rating.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        刪除
                      </Button>
                    </div>
                  </div>
                  
                  <ListingCard
                    listing={{
                      id: rating.listing.id,
                      title: rating.listing.title,
                      address: rating.listing.address,
                      price: rating.listing.price,
                      bedrooms: rating.listing.bedrooms,
                      bathrooms: rating.listing.bathrooms,
                      area_sqft: rating.listing.area_sqft,
                      property_type: rating.listing.property_type,
                      status: rating.listing.status as 'available' | 'rented' | 'pending',
                      amenities: JSON.parse(rating.listing.amenities || '[]'),
                      latitude: rating.listing.latitude,
                      longitude: rating.listing.longitude,
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
                    showRating={false}
                    showViewButton={true}
                    onView={() => handleViewDetails(rating.listing_id)}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確定要刪除這個評分嗎？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作無法復原。這將永久刪除您的評分和評論。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRating} className="bg-destructive">
                刪除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* 詳細資料對話框 */}
        <ListingDetailDialog
          listing={selectedListing}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onRatingUpdate={handleRatingUpdate}
        />
      </div>
    </div>
  );
}
