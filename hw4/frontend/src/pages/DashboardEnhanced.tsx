import { useState, useEffect, useCallback, useRef } from 'react';
import { listingsService } from '@/services/listings.service';
import { ratingsService } from '@/services/ratings.service';
import { Listing } from '@/types';
import { MapView } from '@/components/map/MapView';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingDetailDialog } from '@/components/listings/ListingDetailDialog';
import { FilterPanel, FilterOptions } from '@/components/listings/FilterPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, MoveHorizontal, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCities, getDistrictsByCity } from '@/constants/locations';

export default function DashboardEnhanced() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingStats, setRatingStats] = useState<{ [key: number]: any }>({});
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});
  const [showMyListingsOnly, setShowMyListingsOnly] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(384); // 初始寬度 96 * 4 = 384px (w-96)
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [clearFilterSignal, setClearFilterSignal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const listingRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const navigate = useNavigate();
  const { user, logout} = useAuth();

  // 計算兩點之間的距離（公里）
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // 地球半徑（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const applyFilters = useCallback(async (filters: FilterOptions) => {
    try {
      setLoading(true);
      
      // 構建 API 篩選參數
      const apiFilters: any = { ...filters };
      
      // 只顯示我的房屋
      if (showMyListingsOnly && user) {
        // 這個需要特殊處理，因為 API 沒有這個參數
        // 我們先載入所有房屋，然後在前端篩選
      }
      
      // 如果有搜尋位置，添加位置參數
      if (searchLocation) {
        apiFilters.lat = searchLocation.lat;
        apiFilters.lng = searchLocation.lng;
        apiFilters.distance = 50; // 50km 範圍
      }
      
      // 調用 API 獲取篩選後的房屋
      const data = await listingsService.getAllListings(apiFilters);
      let filtered = data.listings;
      
      // 只顯示我的房屋（前端篩選）
      if (showMyListingsOnly && user) {
        filtered = filtered.filter(listing => listing.user_id === user.id);
      }
      
      // 如果有搜尋位置，按距離排序
      if (searchLocation) {
        filtered = filtered.map(listing => ({
          ...listing,
          distance: calculateDistance(
            searchLocation.lat,
            searchLocation.lng,
            listing.latitude,
            listing.longitude
          )
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
      
      setListings(data.listings);
      setFilteredListings(filtered);
      setCurrentFilters(filters);
      
      // 載入評分統計
      await loadRatingStats(filtered);
      
    } catch (error) {
      console.error('Failed to apply filters:', error);
    } finally {
      setLoading(false);
    }
  }, [showMyListingsOnly, user, searchLocation]);

  useEffect(() => {
    loadListings();
    
    // 檢查 URL 參數中的 highlight
    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get('highlight');
    if (highlightId) {
      const listingId = parseInt(highlightId);
      // 延遲執行，確保列表已載入
      setTimeout(() => {
        const listing = listings.find(l => l.id === listingId);
        if (listing) {
          setSelectedListing(listing);
          setDetailDialogOpen(true);
          setHighlightedId(listingId);
        }
      }, 1000);
    }
  }, []);

  // When showMyListingsOnly changes, reapply current filters
  useEffect(() => {
    if (listings.length > 0) {
      applyFilters(currentFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMyListingsOnly]);

  // When searchLocation changes, reapply current filters
  useEffect(() => {
    if (listings.length > 0) {
      applyFilters(currentFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLocation]);

  const loadListings = async (filters?: FilterOptions) => {
    try {
      const data = await listingsService.getAllListings(filters);
      setListings(data.listings);
      setFilteredListings(data.listings);
      console.log('Listings loaded:', data.listings.length);
      
      // 載入每個房屋的評分統計
      await loadRatingStats(data.listings);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRatingStats = async (listings: Listing[]) => {
    try {
      // 簡化評分載入，只載入前20個房屋的評分統計
      const limitedListings = listings.slice(0, 20);
      const statsMap: { [key: number]: any } = {};
      
      // 為所有房屋設置默認評分
      listings.forEach(listing => {
        statsMap[listing.id] = { 
          average_rating: 0, 
          total_ratings: 0, 
          rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } 
        };
      });
      
      // 只載入前20個房屋的實際評分
      const promises = limitedListings.map(async (listing) => {
        try {
          const stats = await ratingsService.getListingRatingStats(listing.id);
          return { listingId: listing.id, stats };
        } catch (error) {
          console.error(`Failed to load rating stats for listing ${listing.id}:`, error);
          return { 
            listingId: listing.id, 
            stats: { average_rating: 0, total_ratings: 0, rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } 
          };
        }
      });

      const results = await Promise.all(promises);
      results.forEach(({ listingId, stats }) => {
        statsMap[listingId] = stats;
      });
      
      setRatingStats(statsMap);
    } catch (error) {
      console.error('Failed to load rating stats:', error);
    }
  };

  const handleFilterChange = async (filters: FilterOptions) => {
    await applyFilters(filters);
  };

  const handleClearFilters = async () => {
    setCurrentFilters({});
    setShowMyListingsOnly(false);
    setSearchLocation(null); // 清除搜尋位置
    // 觸發清除信號
    setClearFilterSignal(true);
    setTimeout(() => setClearFilterSignal(false), 100);
    
    // 重新載入所有房屋
    await loadListings();
  };

  // 處理地圖搜尋位置選擇
  const handleLocationSearch = (location: { lat: number; lng: number; address?: string }) => {
    setSearchLocation(location);
    // 自動滾動到列表頂部
    if (scrollAreaRef.current) {
      // 獲取 ScrollArea 的 Viewport 元素
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    // useEffect 會自動處理篩選重新應用
  };

  // 清除搜尋位置
  const handleClearLocationSearch = () => {
    setSearchLocation(null);
    // useEffect 會自動處理篩選重新應用
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 點擊卡片 - 只更新地圖位置和高亮
  const handleCardClick = (listing: Listing) => {
    setSelectedListing(listing);
    setHighlightedId(listing.id);
    
    // 高亮動畫 2 秒後消失
    setTimeout(() => {
      setHighlightedId(null);
    }, 2000);
  };

  // 點擊地圖標記 - 滾動到對應卡片並高亮
  const handleMarkerClick = (listing: Listing) => {
    setSelectedListing(listing);
    setHighlightedId(listing.id);
    
    // 滾動到對應卡片
    if (listingRefs.current[listing.id]) {
      listingRefs.current[listing.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
    
    // 高亮動畫 2 秒後消失
    setTimeout(() => {
      setHighlightedId(null);
    }, 2000);
  };

  // 點擊詳細資料按鈕 - 打開彈窗
  const handleViewDetails = (listing: Listing, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止觸發卡片點擊
    setDetailListing(listing);
    setDetailDialogOpen(true);
  };

  const handleEditFromDialog = () => {
    if (detailListing) {
      setDetailDialogOpen(false);
      navigate(`/edit-listing/${detailListing.id}`);
    }
  };

  // 拖動處理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      
      // 限制最小和最大寬度
      const minWidth = 300;
      const maxWidth = containerRect.width - 400; // 留給地圖至少 400px
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Don't block the entire UI while loading - show map immediately
  console.log('Dashboard rendering - loading:', loading, 'listings:', listings.length);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">951租屋網</h1>
            <p className="text-sm text-muted-foreground">
              歡迎回來，{user?.username}！
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/my-listings')} variant="outline" size="sm">
              我的房屋
            </Button>
            <Button onClick={() => navigate('/my-favorites')} variant="outline" size="sm">
              我的收藏
            </Button>
            <Button onClick={() => navigate('/my-ratings')} variant="outline" size="sm">
              我的評分
            </Button>
            <Button onClick={() => navigate('/create-listing')} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              新增房屋
            </Button>
            <Button onClick={() => setShowLogoutDialog(true)} variant="ghost" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* Filters Bar - 橫向篩選欄 */}
      <div className="border-b bg-muted/30 px-6 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* 價格範圍 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">價格</span>
            <Input
              type="number"
              placeholder="最低"
              value={currentFilters.minPrice || ''}
              onChange={(e) => handleFilterChange({...currentFilters, minPrice: e.target.value ? parseInt(e.target.value) : undefined})}
              className="w-20 h-8 text-xs"
            />
            <span className="text-xs text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="最高"
              value={currentFilters.maxPrice || ''}
              onChange={(e) => handleFilterChange({...currentFilters, maxPrice: e.target.value ? parseInt(e.target.value) : undefined})}
              className="w-20 h-8 text-xs"
            />
          </div>

          {/* 坪數範圍 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">坪數</span>
            <Input
              type="number"
              placeholder="最小"
              value={currentFilters.minArea || ''}
              onChange={(e) => handleFilterChange({...currentFilters, minArea: e.target.value ? parseInt(e.target.value) : undefined})}
              className="w-20 h-8 text-xs"
            />
            <span className="text-xs text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="最大"
              value={currentFilters.maxArea || ''}
              onChange={(e) => handleFilterChange({...currentFilters, maxArea: e.target.value ? parseInt(e.target.value) : undefined})}
              className="w-20 h-8 text-xs"
            />
          </div>

          {/* 房型 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">房型</span>
            <Select
              value={currentFilters.propertyType || 'all'}
              onValueChange={(value) => handleFilterChange({...currentFilters, propertyType: value === 'all' ? undefined : value})}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="套房">套房</SelectItem>
                <SelectItem value="雅房">雅房</SelectItem>
                <SelectItem value="分租套房">分租套房</SelectItem>
                <SelectItem value="獨立套房">獨立套房</SelectItem>
                <SelectItem value="一房一廳">一房一廳</SelectItem>
                <SelectItem value="兩房一廳">兩房一廳</SelectItem>
                <SelectItem value="三房兩廳">三房兩廳</SelectItem>
                <SelectItem value="四房兩廳">四房兩廳</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 臥室 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">臥室</span>
            <Select
              value={currentFilters.bedrooms?.toString() || 'any'}
              onValueChange={(value) => handleFilterChange({...currentFilters, bedrooms: value === 'any' ? undefined : parseInt(value)})}
            >
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">不限</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 衛浴 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">衛浴</span>
            <Select
              value={currentFilters.bathrooms?.toString() || 'any'}
              onValueChange={(value) => handleFilterChange({...currentFilters, bathrooms: value === 'any' ? undefined : parseInt(value)})}
            >
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">不限</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 縣市 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">縣市</span>
            <Select
              value={currentFilters.city || 'all'}
              onValueChange={(value) => {
                const newFilters = {...currentFilters, city: value === 'all' ? undefined : value};
                // 如果選擇了新的縣市，清除區域選擇
                if (value !== 'all' && value !== currentFilters.city) {
                  newFilters.district = undefined;
                }
                handleFilterChange(newFilters);
              }}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {getCities().map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 區域 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">區域</span>
            <Select
              value={currentFilters.district || 'all'}
              onValueChange={(value) => handleFilterChange({...currentFilters, district: value === 'all' ? undefined : value})}
              disabled={!currentFilters.city}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {currentFilters.city && getDistrictsByCity(currentFilters.city).map((district) => (
                  <SelectItem key={district} value={district}>{district}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Separator */}
          <div className="h-6 w-px bg-border" />

          {/* Results Count */}
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            <span className="font-medium text-foreground">{filteredListings.length}</span> 個
          </div>

          {/* Search Location Indicator */}
          {searchLocation && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-md text-xs">
              <MapPin className="w-3 h-3" />
              <span>已按距離排序: {searchLocation.address || '搜尋位置'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearLocationSearch}
                className="h-5 w-5 p-0 hover:bg-primary/20"
              >
                ×
              </Button>
            </div>
          )}

          {/* My Listings Only */}
          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap px-2 py-1 rounded-md hover:bg-muted transition-colors">
            <input
              type="checkbox"
              checked={showMyListingsOnly}
              onChange={(e) => setShowMyListingsOnly(e.target.checked)}
              className="rounded border-gray-300 w-4 h-4"
            />
            <span className="text-xs">只看我的</span>
          </label>

          {/* Spacer */}
          <div className="flex-1" />

          {/* 公設篩選 (進階) */}
          <FilterPanel
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
            clearSignal={clearFilterSignal}
          />

          {/* Clear All Filters */}
          {(Object.keys(currentFilters).length > 0 || searchLocation) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 text-xs"
            >
              清除全部
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        {/* Map Section */}
        <div className="flex-1 relative">
          <MapView
            listings={filteredListings}
            onMarkerClick={handleMarkerClick}
            selectedListing={selectedListing}
            highlightedId={highlightedId}
            onLocationSearch={handleLocationSearch}
          />
        </div>

        {/* Resizable Divider with Icon */}
        <div
          className={`relative w-3 bg-border hover:bg-primary/70 cursor-col-resize transition-colors flex items-center justify-center ${
            isDragging ? 'bg-primary' : ''
          }`}
          onMouseDown={handleMouseDown}
          style={{ cursor: 'col-resize', userSelect: 'none' }}
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center">
            <div className={`bg-background border-2 rounded-full p-2 shadow-md ${
              isDragging ? 'scale-125 border-primary' : 'border-muted-foreground/30'
            } transition-all hover:border-primary hover:shadow-lg`}>
              <MoveHorizontal className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Listings Sidebar - 只顯示房屋列表 */}
        <div className="border-l flex flex-col bg-background" style={{ width: `${sidebarWidth}px` }}>
          {/* Listings List */}
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {filteredListings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No listings found.</p>
                  <Button
                    onClick={() => navigate('/create-listing')}
                    className="mt-4"
                    variant="outline"
                  >
                    新增第一間房屋
                  </Button>
                </div>
              ) : (
                filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    ref={(el) => {
                      if (el) listingRefs.current[listing.id] = el;
                    }}
                    className={`transition-all cursor-pointer relative ${
                      selectedListing?.id === listing.id
                        ? 'ring-2 ring-blue-500 ring-offset-2 rounded-xl'
                        : ''
                    } ${
                      highlightedId === listing.id
                        ? 'animate-pulse ring-4 ring-primary ring-offset-4 rounded-xl shadow-2xl'
                        : ''
                    }`}
                    onClick={() => handleCardClick(listing)}
                  >
                    <ListingCard
                      listing={listing}
                      onView={(e) => handleViewDetails(listing, e)}
                      showViewButton={true}
                      showFavorite={true}
                      showRating={true}
                      ratingStats={ratingStats[listing.id]}
                    />
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要登出嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              您將會被登出系統，需要重新登入才能繼續使用。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>
              確定登出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Listing Detail Dialog */}
      <ListingDetailDialog
        listing={detailListing}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={handleEditFromDialog}
        canEdit={detailListing?.user_id === user?.id}
      />
    </div>
  );
}

