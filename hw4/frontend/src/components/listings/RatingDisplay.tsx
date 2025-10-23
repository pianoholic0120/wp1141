import { Star } from 'lucide-react';

interface RatingDisplayProps {
  averageRating: number;
  totalRatings: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function RatingDisplay({ 
  averageRating, 
  totalRatings, 
  size = 'sm',
  showCount = true,
  className = ''
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star 
            key={i} 
            className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star 
            key={i} 
            className={`${sizeClasses[size]} fill-yellow-400/50 text-yellow-400`}
          />
        );
      } else {
        stars.push(
          <Star 
            key={i} 
            className={`${sizeClasses[size]} text-gray-300`}
          />
        );
      }
    }
    return stars;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">
        {renderStars()}
      </div>
      {showCount && (
        <span className={`${textSizeClasses[size]} text-gray-600 ml-1`}>
          ({totalRatings})
        </span>
      )}
    </div>
  );
}
