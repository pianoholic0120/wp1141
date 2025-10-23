import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ratingsService, Rating } from '@/services/ratings.service';
import { toast } from 'sonner';

interface RatingInputProps {
  listingId: number;
  onRatingChange?: (rating: Rating | null) => void;
  onRatingUpdate?: (listingId: number) => void;
  className?: string;
}

export function RatingInput({ 
  listingId, 
  onRatingChange,
  onRatingUpdate,
  className = ''
}: RatingInputProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRating, setExistingRating] = useState<Rating | null>(null);

  // 載入現有評分
  useEffect(() => {
    const loadExistingRating = async () => {
      try {
        const userRating = await ratingsService.getUserRatingForListing(listingId);
        if (userRating) {
          setExistingRating(userRating);
          setRating(userRating.rating);
          setComment(userRating.comment || '');
        }
      } catch (error) {
        console.error('Failed to load existing rating:', error);
      }
    };

    loadExistingRating();
  }, [listingId]);

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleStarHover = (hoveredRating: number) => {
    setHoverRating(hoveredRating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('請選擇評分');
      return;
    }

    setLoading(true);
    try {
      const result = await ratingsService.addOrUpdateRating(listingId, rating, comment);
      setExistingRating(result);
      onRatingChange?.(result);
      onRatingUpdate?.(listingId); // 調用評分更新回調
      toast.success(existingRating ? '評分已更新' : '評分已提交');
    } catch (error: any) {
      console.error('Failed to submit rating:', error);
      toast.error(error.response?.data?.error || '提交評分失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await ratingsService.deleteRating(listingId);
      setExistingRating(null);
      setRating(0);
      setComment('');
      onRatingChange?.(null);
      onRatingUpdate?.(listingId); // 調用評分更新回調
      toast.success('評分已刪除');
    } catch (error: any) {
      console.error('Failed to delete rating:', error);
      toast.error(error.response?.data?.error || '刪除評分失敗');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isActive = i <= (hoverRating || rating);
      stars.push(
        <Star
          key={i}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            isActive ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          onMouseLeave={handleStarLeave}
        />
      );
    }
    return stars;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label className="text-sm font-medium">評分</Label>
        <div className="flex items-center gap-2 mt-1">
          {renderStars()}
          <span className="text-sm text-gray-600">
            {rating > 0 ? `${rating} 星` : '請選擇評分'}
          </span>
        </div>
      </div>

      <div>
        <Label htmlFor="comment" className="text-sm font-medium">
          評論（選填）
        </Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="分享您的居住體驗..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={handleSubmit} 
          disabled={loading || rating === 0}
          size="sm"
        >
          {existingRating ? '更新評分' : '提交評分'}
        </Button>
        
        {existingRating && (
          <Button 
            onClick={handleDelete} 
            disabled={loading}
            variant="destructive"
            size="sm"
          >
            刪除評分
          </Button>
        )}
      </div>
    </div>
  );
}
