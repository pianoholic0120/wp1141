import { Listing } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Bed, Bath, Square, Phone, Building2, DollarSign, User, Home, FileText, Wrench, Star } from 'lucide-react';
import { AMENITIES } from '@/constants/amenities';
import { RatingInput } from './RatingInput';
// import { RatingDisplay } from './RatingDisplay';
import { FavoriteButton } from './FavoriteButton';

interface ListingDetailDialogProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  canEdit?: boolean;
  onRatingUpdate?: (listingId: number) => void;
  onFavoriteUpdate?: (listingId: number) => void;
}

export function ListingDetailDialog({ 
  listing, 
  open, 
  onOpenChange,
  onEdit,
  canEdit,
  onRatingUpdate,
  onFavoriteUpdate
}: ListingDetailDialogProps) {
  if (!listing) return null;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      available: "default",
      pending: "secondary",
      rented: "outline",
    };
    const labels: Record<string, string> = {
      available: "可出租",
      pending: "預約中",
      rented: "已出租",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: "公寓",
      house: "透天厝",
      condo: "大樓",
      townhouse: "連棟住宅",
      studio: "套房",
      other: "其他",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-5xl h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl mb-1 truncate">{listing.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{listing.address}</span>
              </DialogDescription>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(listing.status)}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="overview" className="gap-2">
              <Home className="w-4 h-4" />
              概覽
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <FileText className="w-4 h-4" />
              詳細資訊
            </TabsTrigger>
            <TabsTrigger value="amenities" className="gap-2">
              <Wrench className="w-4 h-4" />
              公設設施
            </TabsTrigger>
            <TabsTrigger value="rating" className="gap-2">
              <Star className="w-4 h-4" />
              評分
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 min-h-0">
            {/* 概覽標籤 */}
            <TabsContent value="overview" className="space-y-4 m-0">
              {/* 價格卡片 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    租金資訊
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">
                      NT$ {listing.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">/月</span>
                  </div>
                  {listing.management_fee && listing.management_fee > 0 && (
                    <p className="text-sm text-muted-foreground">
                      管理費：NT$ {listing.management_fee.toLocaleString()}/月
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 基本資訊卡片 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    基本資訊
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">臥室</span>
                      <div className="flex items-center gap-2 font-medium">
                        <Bed className="w-4 h-4 text-primary" />
                        <span>{listing.bedrooms} 間</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">衛浴</span>
                      <div className="flex items-center gap-2 font-medium">
                        <Bath className="w-4 h-4 text-primary" />
                        <span>{listing.bathrooms} 間</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">坪數</span>
                      <div className="flex items-center gap-2 font-medium">
                        <Square className="w-4 h-4 text-primary" />
                        <span>{listing.area_sqft} 坪</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">房型</span>
                      <div className="flex items-center gap-2 font-medium">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span>{getPropertyTypeLabel(listing.property_type)}</span>
                      </div>
                    </div>
                    {listing.floor && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">樓層</span>
                        <div className="flex items-center gap-2 font-medium">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span>{listing.floor}F</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 位置資訊卡片 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    位置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm break-words overflow-wrap-anywhere">{listing.address}</p>
                  <p className="text-xs text-muted-foreground break-all">
                    座標：{listing.latitude.toFixed(6)}, {listing.longitude.toFixed(6)}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 詳細資訊標籤 */}
            <TabsContent value="details" className="space-y-4 m-0">
              {/* 聯絡資訊卡片 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    聯絡資訊
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {listing.contact_phone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">聯絡電話</p>
                        <p className="font-medium">{listing.contact_phone}</p>
                      </div>
                    </div>
                  )}
                  {listing.username && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">發布者</p>
                        <p className="font-medium">{listing.username}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 描述卡片 */}
              {listing.description && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      房屋描述
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">
                      {listing.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 公設設施標籤 */}
            <TabsContent value="amenities" className="space-y-4 m-0">
              {listing.amenities && listing.amenities.length > 0 ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" />
                      公設與設施
                      <Badge variant="secondary">{listing.amenities.length} 項</Badge>
                    </CardTitle>
                    <CardDescription>
                      此房屋提供以下設施與公共設備
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {listing.amenities.map((amenityValue) => {
                        const amenity = AMENITIES.find((a) => a.value === amenityValue);
                        return (
                          <div
                            key={amenityValue}
                            className="flex items-center justify-center px-3 py-2 bg-primary/10 hover:bg-primary/20 rounded-md border border-primary/20 transition-colors min-h-[2.5rem]"
                          >
                            <span className="text-sm font-medium text-primary text-center break-words">
                              {amenity ? amenity.label : amenityValue}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">此房屋未提供公設資訊</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 評分標籤 */}
            <TabsContent value="rating" className="space-y-4 m-0">
              <div className="flex items-center gap-2 mb-4">
                <FavoriteButton 
                  listingId={listing.id} 
                  size="sm" 
                  onFavoriteUpdate={onFavoriteUpdate}
                />
                <span className="text-sm text-muted-foreground">收藏此房屋</span>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    為此房屋評分
                  </CardTitle>
                  <CardDescription>
                    分享您的居住體驗，幫助其他租客做出更好的選擇
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RatingInput 
                    listingId={listing.id}
                    onRatingChange={(rating) => {
                      // 可以在這裡處理評分變更
                      console.log('Rating changed:', rating);
                    }}
                    onRatingUpdate={onRatingUpdate}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* 底部操作按鈕 */}
        {canEdit && (
          <div className="flex gap-2 pt-4 border-t flex-shrink-0">
            <Button onClick={onEdit} className="flex-1">
              編輯房屋
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              關閉
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

