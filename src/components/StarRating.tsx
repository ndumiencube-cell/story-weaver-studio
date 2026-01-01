import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

const StarRating = ({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
}: StarRatingProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, index) => (
        <Star
          key={index}
          className={`${sizeClasses[size]} ${
            index < Math.floor(rating)
              ? "fill-gold text-gold"
              : index < rating
              ? "fill-gold/50 text-gold"
              : "fill-muted text-muted"
          }`}
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
