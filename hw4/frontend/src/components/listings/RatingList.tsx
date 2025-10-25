import { useState, useEffect } from 'react';
import { Star, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ratingsService, RatingWithUser } from '@/services/ratings.service';

interface RatingListProps {
  listingId: number;
  className?: string;
}

export function RatingList({ listingId, className = '' }: RatingListProps) {
  const [ratings, setRatings] = useState<RatingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        setLoading(true);
        const data = await ratingsService.getListingRatings(listingId);
        setRatings(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load ratings:', err);
        setError('載入評分失敗');
      } finally {
        setLoading(false);
      }
    };

    loadRatings();
  }, [listingId]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">載入評分中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">尚無評分留言</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">所有評分留言</h3>
        <Badge variant="secondary">{ratings.length} 則留言</Badge>
      </div>
      
      <div className="space-y-3">
        {ratings.map((rating) => (
          <Card key={rating.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{rating.user.username}</span>
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(rating.rating)}
                  <span className="text-sm text-muted-foreground ml-1">
                    {rating.rating}/5
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(rating.created_at)}</span>
                {rating.updated_at !== rating.created_at && (
                  <Badge variant="outline" className="text-xs">
                    已編輯
                  </Badge>
                )}
              </div>
            </CardHeader>
            {rating.comment && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {rating.comment}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
