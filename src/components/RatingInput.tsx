import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface RatingInputProps {
  audiobookId: string;
  currentRating?: number;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

const RatingInput = ({ audiobookId, currentRating = 0, onRatingChange, className }: RatingInputProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(currentRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (value: number) => {
    if (!user) {
      toast.error("Please sign in to rate audiobooks");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc("rate_audiobook", {
        p_audiobook_id: audiobookId,
        p_rating: value,
      });

      if (error) throw error;

      setRating(value);
      onRatingChange?.(value);
      toast.success(`Rated ${value} star${value > 1 ? "s" : ""}!`);
    } catch (error) {
      console.error("Error rating audiobook:", error);
      toast.error("Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-sm text-muted-foreground mr-2">Rate:</span>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          onClick={() => handleRate(value)}
          onMouseEnter={() => setHoverRating(value)}
          onMouseLeave={() => setHoverRating(0)}
          disabled={isSubmitting}
          className={cn(
            "p-0.5 transition-all duration-150 hover:scale-110 disabled:opacity-50",
            isSubmitting && "cursor-not-allowed"
          )}
          aria-label={`Rate ${value} stars`}
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              value <= displayRating
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground hover:text-amber-300"
            )}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="text-sm text-muted-foreground ml-2">
          Your rating: {rating}/5
        </span>
      )}
    </div>
  );
};

export default RatingInput;
