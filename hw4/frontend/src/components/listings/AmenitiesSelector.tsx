import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AMENITIES, AMENITY_CATEGORIES } from '@/constants/amenities';

interface AmenitiesSelectorProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
}

export function AmenitiesSelector({ selectedAmenities, onChange }: AmenitiesSelectorProps) {
  const handleToggle = (value: string) => {
    const newAmenities = selectedAmenities.includes(value)
      ? selectedAmenities.filter((a) => a !== value)
      : [...selectedAmenities, value];
    onChange(newAmenities);
  };

  const amenitiesByCategory = AMENITIES.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, typeof AMENITIES>);

  return (
    <div className="space-y-6">
      {Object.entries(amenitiesByCategory).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <h4 className="font-semibold text-sm text-primary">
            {AMENITY_CATEGORIES[category as keyof typeof AMENITY_CATEGORIES]}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map((amenity) => (
              <div key={amenity.value} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.value}
                  checked={selectedAmenities.includes(amenity.value)}
                  onCheckedChange={() => handleToggle(amenity.value)}
                />
                <Label
                  htmlFor={amenity.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {selectedAmenities.length > 0 && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-semibold mb-2">
            已選擇 {selectedAmenities.length} 項公設：
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedAmenities.map((value) => {
              const amenity = AMENITIES.find((a) => a.value === value);
              return amenity ? (
                <span
                  key={value}
                  className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full"
                >
                  {amenity.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

