import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, MapPin, Loader2, Navigation, AlertCircle, Lightbulb } from 'lucide-react';
import { mapsService } from '@/services/maps.service';

interface MapSearchBoxProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
}

export function MapSearchBox({ onLocationSelect }: MapSearchBoxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  // const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');
      // setSuggestions([]);

    try {
      const result = await mapsService.geocodeAddress(searchQuery);
      
      if (result.latitude && result.longitude) {
        onLocationSelect({
          latitude: result.latitude,
          longitude: result.longitude,
          address: searchQuery,
        });
        setSearchQuery('');
      } else {
        setError('找不到該地址，請嘗試更具體的描述');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || '搜尋失敗，請重試');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const quickLocations = [
    { name: '台北101', address: '台北市信義區信義路五段7號' },
    { name: '台大', address: '台北市大安區羅斯福路四段1號' },
    { name: '西門町', address: '台北市萬華區成都路10號' },
    { name: '士林夜市', address: '台北市士林區基河路101號' },
  ];

  const handleQuickSelect = async (address: string) => {
    setSearchQuery(address);
    setSearching(true);
    setError('');

    try {
      const result = await mapsService.geocodeAddress(address);
      
      if (result.latitude && result.longitude) {
        onLocationSelect({
          latitude: result.latitude,
          longitude: result.longitude,
          address: address,
        });
        setSearchQuery('');
      }
    } catch (err) {
      setError('搜尋失敗');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Card className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl shadow-2xl border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                地圖位置搜尋
                <Badge variant="secondary" className="text-xs">探索區域</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                搜尋國家、城市、區域、街道或地標，在地圖上顯示位置
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* 搜尋輸入 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input
              placeholder="例如：台北市大安區、台北101、信義路五段..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 h-10 border-primary/30 focus-visible:ring-primary"
              disabled={searching}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            size="default"
            disabled={searching || !searchQuery.trim()}
            className="min-w-[90px]"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                搜尋中
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                搜尋
              </>
            )}
          </Button>
        </div>

        {/* 快速選擇 */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">快速前往熱門地點</p>
          <div className="flex gap-2 flex-wrap">
            {quickLocations.map((loc) => (
              <Button
                key={loc.name}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(loc.address)}
                disabled={searching}
                className="h-8 text-xs px-3 hover:bg-primary/10 hover:text-primary hover:border-primary"
              >
                <MapPin className="w-3 h-3 mr-1.5" />
                {loc.name}
              </Button>
            ))}
          </div>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 使用提示 */}
        {!searchQuery && !error && (
          <Alert className="bg-blue-50/50 border-blue-200">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-700">
              <strong>提示：</strong>輸入地址後按 Enter 快速搜尋，或點擊上方快速按鈕直接前往
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

