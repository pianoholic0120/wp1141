import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { ArrowLeft, MapPin } from 'lucide-react';

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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
  });

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    if (!id) {
      console.error('No listing ID provided');
      setError('無效的 listing ID');
      navigate('/my-listings');
      return;
    }

    console.log('Loading listing:', id);

    try {
      const listing = await listingsService.getListing(parseInt(id));
      console.log('Listing loaded:', listing);
      
      setFormData({
        title: listing.title,
        description: listing.description || '',
        address: listing.address,
        latitude: listing.latitude,
        longitude: listing.longitude,
        price: listing.price.toString(),
        bedrooms: listing.bedrooms?.toString() || '',
        bathrooms: listing.bathrooms?.toString() || '',
        area_sqft: listing.area_sqft?.toString() || '',
        property_type: listing.property_type || 'apartment',
        status: listing.status || 'available',
      });
      setError('');
    } catch (err: any) {
      console.error('Failed to load listing:', err);
      console.error('Error details:', err.response?.data);
      
      let errorMsg = 'Failed to load listing.';
      if (err.response?.status === 403) {
        errorMsg = '您沒有權限編輯此 listing（只能編輯自己創建的）';
      } else if (err.response?.status === 404) {
        errorMsg = 'Listing 不存在';
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      
      setError(errorMsg);
      setTimeout(() => navigate('/my-listings'), 2000);
    } finally {
      setFetchLoading(false);
    }
  };

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
      setError('Please enter an address first');
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
      setError('Failed to geocode address. You can manually enter coordinates.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.title || formData.title.length < 5) {
      setError('Title must be at least 5 characters long');
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price greater than 0');
      setLoading(false);
      return;
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      setError('Please enter valid coordinates');
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
      };

      console.log('Updating listing:', listingData);
      await listingsService.updateListing(parseInt(id!), listingData);
      console.log('Listing updated successfully!');
      navigate('/my-listings');
    } catch (err: any) {
      console.error('Update listing error:', err);
      let errorMessage = 'Failed to update listing';
      
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

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入 listing 資料中...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/my-listings')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回 My Listings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/my-listings')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回我的房屋
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>編輯房屋資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">基本資訊</TabsTrigger>
                  <TabsTrigger value="location">位置資訊</TabsTrigger>
                  <TabsTrigger value="details">詳細資訊</TabsTrigger>
                </TabsList>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title * (至少 5 個字符)</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="台北信義區精美2房公寓"
                      required
                    />
                    {formData.title && formData.title.length < 5 && (
                      <p className="text-xs text-red-600">
                        ⚠️ Title 需要至少 5 個字符（目前：{formData.title.length}）
                      </p>
                    )}
                    {formData.title && formData.title.length >= 5 && (
                      <p className="text-xs text-green-600">
                        ✓ Title 長度符合要求
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
                      placeholder="Describe your property..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Monthly Rent (TWD) * (必須大於 0)</Label>
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
                        ✓ 價格有效：${parseFloat(formData.price).toLocaleString()} TWD/月
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
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                        placeholder="123 Main St, City, State, ZIP"
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
                      />
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
                      />
                    </div>
                  </div>

                  {formData.latitude !== 0 && formData.longitude !== 0 && (
                    <Alert>
                      <AlertDescription className="text-green-600">
                        ✓ 位置座標有效！
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">臥室</Label>
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
                      <Label htmlFor="bathrooms">衛浴</Label>
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
                      <Label htmlFor="area_sqft">坪數 (平方英尺)</Label>
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
              </Tabs>

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/my-listings')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Updating...' : 'Update Listing'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

