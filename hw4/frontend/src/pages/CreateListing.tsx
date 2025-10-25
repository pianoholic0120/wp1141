import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsService } from '@/services/listings.service';
import { mapsService } from '@/services/maps.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AmenitiesSelector } from '@/components/listings/AmenitiesSelector';
import { ArrowLeft, MapPin } from 'lucide-react';

export default function CreateListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    latitude: 0,
    longitude: 0,
    price: '',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    property_type: 'apartment',
    status: 'available' as 'available' | 'rented' | 'pending',
    floor: '',
    contact_phone: '',
    management_fee: '',
    amenities: [] as string[],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address.trim()) {
      setError('請先輸入地址');
      return;
    }

    setGeocoding(true);
    setError('');

    try {
      const result = await mapsService.geocodeAddress(formData.address);
      setFormData((prev) => ({
        ...prev,
        latitude: result.latitude,
        longitude: result.longitude,
        address: result.formattedAddress,
      }));
      setError('');
    } catch (err: any) {
      console.error('Geocoding error:', err);
      setError(
        '無法找到該地址。您可以：\n' +
        '1. 檢查 Google Maps API 設定\n' +
        '2. 在位置標籤中手動輸入座標'
      );
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    if (!formData.title || formData.title.length < 5) {
      setError('標題必須至少5個字符');
      setLoading(false);
      return;
    }

    if (!formData.address) {
      setError('請輸入地址');
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('請輸入大於0的有效價格');
      setLoading(false);
      return;
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      setError('請點擊「尋找」按鈕獲取座標，或手動輸入有效座標');
      setLoading(false);
      return;
    }

    // Amenities validation (required)
    if (!formData.amenities || formData.amenities.length === 0) {
      setError('請至少選擇一項公設或設施（切換到「公設設施」標籤）');
      setLoading(false);
      return;
    }

    try {
      const listingData = {
        ...formData,
        price: parseFloat(formData.price),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 0,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : 0,
        area_sqft: formData.area_sqft ? parseInt(formData.area_sqft) : 0,
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        management_fee: formData.management_fee ? parseFloat(formData.management_fee) : undefined,
        contact_phone: formData.contact_phone || undefined,
        amenities: formData.amenities,
      };

      console.log('Submitting listing:', listingData);
      await listingsService.createListing(listingData);
      console.log('Listing created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Create listing error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Failed to create listing';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      if (err.response?.data?.details) {
        const details = err.response.data.details;
        if (Array.isArray(details)) {
          errorMessage = details.map((d: any) => `• ${d.msg}`).join('\n');
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回主頁
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>新增房屋資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">基本資訊</TabsTrigger>
                  <TabsTrigger value="location">位置</TabsTrigger>
                  <TabsTrigger value="details">詳細資訊</TabsTrigger>
                  <TabsTrigger value="amenities">公設設施</TabsTrigger>
                </TabsList>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">標題 * (至少 5 個字符)</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="台北信義區精美2房公寓"
                      required
                    />
                    {formData.title.length > 0 && formData.title.length < 5 && (
                      <p className="text-xs text-red-600">
                        ⚠️ 標題需要至少 5 個字符（目前：{formData.title.length}）
                      </p>
                    )}
                    {formData.title.length >= 5 && (
                      <p className="text-xs text-green-600">
                        ✓ 標題長度符合要求
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">房屋描述</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="請描述您的房屋特色、周邊環境、交通便利性等..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">月租金 (新台幣) * (必須大於 0)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="25000"
                      required
                      min="0"
                      step="0.01"
                    />
                    {formData.price && parseFloat(formData.price) > 0 && (
                      <p className="text-xs text-green-600">
                        ✓ 價格有效：NT$ {parseFloat(formData.price).toLocaleString()}/月
                      </p>
                    )}
                    {formData.price && parseFloat(formData.price) <= 0 && (
                      <p className="text-xs text-red-600">
                        ⚠️ 價格必須大於 0
                      </p>
                    )}
                    {!formData.price && (
                      <p className="text-xs text-muted-foreground">
                        請輸入月租金
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="property_type">房屋類型</Label>
                    <Select
                      value={formData.property_type}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, property_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">公寓</SelectItem>
                        <SelectItem value="house">透天厝</SelectItem>
                        <SelectItem value="condo">大樓</SelectItem>
                        <SelectItem value="townhouse">連棟住宅</SelectItem>
                        <SelectItem value="studio">套房</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">地址 *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="台北市信義區信義路五段7號"
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleGeocodeAddress}
                        disabled={geocoding || !formData.address}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {geocoding ? '尋找中...' : '尋找'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      點擊「尋找」按鈕從地址獲取座標
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">緯度 *</Label>
                      <Input
                        id="latitude"
                        name="latitude"
                        type="number"
                        value={formData.latitude || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            latitude: parseFloat(e.target.value) || 0,
                          }))
                        }
                        step="any"
                        placeholder="25.0330"
                        min="-90"
                        max="90"
                      />
                      <p className="text-xs text-muted-foreground">
                        或手動輸入（例如：25.0330）
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="longitude">經度 *</Label>
                      <Input
                        id="longitude"
                        name="longitude"
                        type="number"
                        value={formData.longitude || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            longitude: parseFloat(e.target.value) || 0,
                          }))
                        }
                        step="any"
                        placeholder="121.5654"
                        min="-180"
                        max="180"
                      />
                      <p className="text-xs text-muted-foreground">
                        或手動輸入（例如：121.5654）
                      </p>
                    </div>
                  </div>

                  {formData.latitude !== 0 && formData.longitude !== 0 && (
                    <Alert>
                      <AlertDescription className="text-green-600">
                        ✓ 位置尋找成功！
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-semibold mb-2">快速選擇 (台北)：</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          address: '台北市信義區信義路五段7號',
                          latitude: 25.0339,
                          longitude: 121.5645
                        }))}
                      >
                        台北101
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          address: '台北市中正區北平西路3號',
                          latitude: 25.0478,
                          longitude: 121.5170
                        }))}
                      >
                        台北車站
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          address: '台北市大安區羅斯福路四段1號',
                          latitude: 25.0173,
                          longitude: 121.5397
                        }))}
                      >
                        台大
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          address: '台北市大安區',
                          latitude: 25.0269,
                          longitude: 121.5436
                        }))}
                      >
                        大安區
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">臥室數</Label>
                      <Input
                        id="bedrooms"
                        name="bedrooms"
                        type="number"
                        value={formData.bedrooms}
                        onChange={handleChange}
                        placeholder="2"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">衛浴數</Label>
                      <Input
                        id="bathrooms"
                        name="bathrooms"
                        type="number"
                        value={formData.bathrooms}
                        onChange={handleChange}
                        placeholder="1"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area_sqft">坪數</Label>
                      <Input
                        id="area_sqft"
                        name="area_sqft"
                        type="number"
                        value={formData.area_sqft}
                        onChange={handleChange}
                        placeholder="800"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="floor">樓層</Label>
                      <Input
                        id="floor"
                        name="floor"
                        type="number"
                        value={formData.floor}
                        onChange={handleChange}
                        placeholder="5"
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="management_fee">管理費 (新台幣/月)</Label>
                      <Input
                        id="management_fee"
                        name="management_fee"
                        type="number"
                        value={formData.management_fee}
                        onChange={handleChange}
                        placeholder="1000"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">聯絡電話</Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={handleChange}
                      placeholder="09XX-XXX-XXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">狀態</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">可出租</SelectItem>
                        <SelectItem value="pending">預約中</SelectItem>
                        <SelectItem value="rented">已出租</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="amenities" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>公設與設施（可複選）</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      請勾選房屋提供的所有設施和公設
                    </p>
                    <AmenitiesSelector
                      selectedAmenities={formData.amenities}
                      onChange={(amenities) =>
                        setFormData((prev) => ({ ...prev, amenities }))
                      }
                    />
                  </div>
                </TabsContent>

              </Tabs>

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? '建立中...' : '建立房屋'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

