import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { AMENITIES } from '@/constants/amenities';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';

export interface FilterOptions {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  amenities?: string[];
  city?: string;
  district?: string;
}

interface FilterPanelProps {
  onFilterChange: (filters: FilterOptions) => void;
  onClear: () => void;
  clearSignal?: boolean; // 外部清除信號
}

export function FilterPanel({ onFilterChange, onClear, clearSignal }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterOptions>({});
  // const [showAdvanced, setShowAdvanced] = useState(false);

  // 監聽外部清除信號
  useEffect(() => {
    if (clearSignal) {
      setFilters({});
      onFilterChange({});
    }
  }, [clearSignal, onFilterChange]);

  // const handleApply = () => {
  //   onFilterChange(filters);
  // };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  // const activeFilterCount = Object.values(filters).filter(v => 
  //   v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  // ).length;

  const amenityCount = filters.amenities?.length || 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <SlidersHorizontal className="w-4 h-4" />
          公設篩選
          {amenityCount > 0 && (
            <Badge variant="secondary" className="ml-1">{amenityCount}</Badge>
          )}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-3" align="end">
        <div className="space-y-3">
        {/* 公設篩選標題 */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div>
            <h4 className="text-sm font-semibold">公設與設施篩選</h4>
            <p className="text-xs text-muted-foreground">選擇必備的公設條件</p>
          </div>
          {amenityCount > 0 && (
            <Badge variant="secondary">{amenityCount} 項已選</Badge>
          )}
        </div>

        {/* 公設選項（35 項） */}
        <div className="max-h-80 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {AMENITIES.map((amenity) => (
              <div key={amenity.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`filter-${amenity.value}`}
                  checked={filters.amenities?.includes(amenity.value) || false}
                  onCheckedChange={(checked) => {
                    const current = filters.amenities || [];
                    const updated = checked
                      ? [...current, amenity.value]
                      : current.filter((a) => a !== amenity.value);
                    setFilters({...filters, amenities: updated.length > 0 ? updated : undefined});
                    
                    // 自動套用
                    onFilterChange({
                      amenities: updated.length > 0 ? updated : undefined
                    });
                  }}
                />
                <Label htmlFor={`filter-${amenity.value}`} className="text-xs font-normal cursor-pointer leading-tight">
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* 底部按鈕 */}
        {amenityCount > 0 && (
          <div className="flex gap-2 pt-3 border-t mt-3">
            <Button variant="outline" onClick={handleClear} size="sm" className="w-full h-8">
              <X className="w-3 h-3 mr-1" />
              清除公設篩選
            </Button>
          </div>
        )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

