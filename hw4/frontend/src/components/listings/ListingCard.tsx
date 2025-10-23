import { Listing } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Square, Phone, Building2, Info } from 'lucide-react';
import { AMENITIES } from '@/constants/amenities';
import { FavoriteButton } from './FavoriteButton';
import { RatingDisplay } from './RatingDisplay';

interface ListingCardProps {
  listing: Listing;
  onView?: (e: React.MouseEvent) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  showViewButton?: boolean;
  showFavorite?: boolean;
  showRating?: boolean;
  ratingStats?: {
    average_rating: number;
    total_ratings: number;
  };
}

export function ListingCard({
  listing,
  onView,
  onEdit,
  onDelete,
  showActions = false,
  showViewButton = false,
  showFavorite = true,
  showRating = true,
  ratingStats,
}: ListingCardProps) {
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{listing.title}</CardTitle>
            {showRating && ratingStats && ratingStats.total_ratings > 0 && (
              <div className="mt-1">
                <RatingDisplay 
                  averageRating={ratingStats.average_rating}
                  totalRatings={ratingStats.total_ratings}
                  size="sm"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showFavorite && (
              <FavoriteButton 
                listingId={listing.id}
                size="sm"
                variant="ghost"
              />
            )}
            <Badge className={statusColors[listing.status]}>
              {listing.status === 'available' ? '可出租' : 
               listing.status === 'pending' ? '預約中' : 
               listing.status === 'rented' ? '已出租' : listing.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">

        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{listing.address}</span>
          {listing.distance !== undefined && (
            <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {listing.distance < 1 ? `${Math.round(listing.distance * 1000)}m` : `${listing.distance.toFixed(1)}km`}
            </span>
          )}
        </div>
        
        {listing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {listing.description}
          </p>
        )}

        <div className="flex gap-4 text-sm">
          {listing.bedrooms > 0 && (
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              <span>{listing.bedrooms} 臥</span>
            </div>
          )}
          {listing.bathrooms > 0 && (
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              <span>{listing.bathrooms} 衛</span>
            </div>
          )}
          {listing.area_sqft > 0 && (
            <div className="flex items-center">
              <Square className="w-4 h-4 mr-1" />
              <span>{listing.area_sqft} 坪</span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <p className="text-2xl font-bold text-primary">
            NT$ {listing.price.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground">/月</span>
          </p>
          {listing.management_fee && listing.management_fee > 0 && (
            <p className="text-xs text-muted-foreground">
              管理費：NT$ {listing.management_fee.toLocaleString()}/月
            </p>
          )}
        </div>

        {(listing.floor || listing.contact_phone) && (
          <div className="flex gap-3 text-xs text-muted-foreground pt-2">
            {listing.floor && (
              <div className="flex items-center">
                <Building2 className="w-3 h-3 mr-1" />
                <span>{listing.floor}F</span>
              </div>
            )}
            {listing.contact_phone && (
              <div className="flex items-center">
                <Phone className="w-3 h-3 mr-1" />
                <span>{listing.contact_phone}</span>
              </div>
            )}
          </div>
        )}

        {listing.amenities && listing.amenities.length > 0 && (
          <div className="pt-2">
            <div className="flex flex-wrap gap-1">
              {listing.amenities.slice(0, 5).map((amenityValue) => {
                const amenity = AMENITIES.find((a) => a.value === amenityValue);
                return amenity ? (
                  <Badge key={amenityValue} variant="outline" className="text-xs">
                    {amenity.label}
                  </Badge>
                ) : null;
              })}
              {listing.amenities.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{listing.amenities.length - 5}
                </Badge>
              )}
            </div>
          </div>
        )}

        {listing.username && (
          <p className="text-xs text-muted-foreground pt-2">
            發布者：{listing.username}
          </p>
        )}
      </CardContent>

      {/* View Details Button */}
      {showViewButton && onView && (
        <CardFooter className="pt-3 pb-4" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onView} 
            className="w-full"
          >
            <Info className="w-4 h-4 mr-2" />
            查看詳細資料
          </Button>
        </CardFooter>
      )}

      {showActions && (
        <CardFooter className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
              編輯
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete} className="flex-1">
              刪除
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

