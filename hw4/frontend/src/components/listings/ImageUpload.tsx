import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // 提示用戶使用 URL 輸入而不是文件上傳
      alert('請使用「輸入圖片網址」功能來添加圖片。文件上傳功能需要後端圖片存儲服務支援。');
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlAdd = () => {
    if (urlInput.trim() && images.length < maxImages) {
      onImagesChange([...images, urlInput.trim()]);
      setUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleAddSampleImages = () => {
    const sampleImages = [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-17ae6b4c5fea?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=800&h=600&fit=crop'
    ];
    
    const availableSlots = maxImages - images.length;
    const imagesToAdd = sampleImages.slice(0, availableSlots);
    onImagesChange([...images, ...imagesToAdd]);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">房屋圖片</Label>
      
      {/* 現有圖片顯示 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-0">
                <img
                  src={image}
                  alt={`房屋圖片 ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 上傳選項 */}
      {images.length < maxImages && (
        <div className="space-y-4">
          {/* 文件上傳 */}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? '上傳中...' : '選擇圖片'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="text-sm text-muted-foreground">
              最多 {maxImages} 張圖片
            </span>
          </div>

          {/* URL 輸入 */}
          <div className="flex items-center gap-2">
            <Input
              ref={urlInputRef}
              placeholder="輸入圖片網址..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlAdd()}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleUrlAdd}
              disabled={!urlInput.trim()}
            >
              添加
            </Button>
          </div>

          {/* 範例圖片 */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddSampleImages}
              className="flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              使用範例圖片
            </Button>
            <span className="text-sm text-muted-foreground">
              快速添加示範圖片
            </span>
          </div>
        </div>
      )}

      {images.length >= maxImages && (
        <p className="text-sm text-muted-foreground">
          已達到最大圖片數量 ({maxImages} 張)
        </p>
      )}
    </div>
  );
}
