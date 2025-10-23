import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsService } from '@/services/listings.service';
import { Listing } from '@/types';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/button';
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
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function MyListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMyListings();
  }, []);

  const loadMyListings = async () => {
    try {
      const data = await listingsService.getUserListings();
      setListings(data);
    } catch (error) {
      console.error('Failed to load listings:', error);
      toast.error('載入房屋列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await listingsService.deleteListing(deleteId);
      setListings((prev) => prev.filter((l) => l.id !== deleteId));
      toast.success('房屋刪除成功');
      setDeleteId(null);
    } catch (error: any) {
      console.error('Failed to delete listing:', error);
      toast.error(error.response?.data?.error || '刪除房屋失敗');
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/edit-listing/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入房屋列表中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold">我的房屋</h1>
              <p className="text-muted-foreground">
                管理您的出租房屋
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/create-listing')}>
            <Plus className="w-4 h-4 mr-2" />
            新增房屋
          </Button>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold mb-2">尚未有房屋</h3>
            <p className="text-muted-foreground mb-4">
              建立您的第一間房屋開始使用
            </p>
            <Button onClick={() => navigate('/create-listing')}>
              <Plus className="w-4 h-4 mr-2" />
              建立房屋
            </Button>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              {listings.length} 間房屋
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  showActions
                  onView={() => navigate(`/listing/${listing.id}`)}
                  onEdit={() => handleEdit(listing.id)}
                  onDelete={() => setDeleteId(listing.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作無法復原。這將永久從資料庫中刪除您的房屋資訊。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                刪除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

