import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock, Heart } from "lucide-react";
import StarRating from "./StarRating";
import { Link } from "react-router-dom";

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  rating: number;
  duration: string;
  price: number;
  category: string;
  description?: string;
}

interface BookCardProps {
  book: Book;
}

const BookCard = ({ book }: BookCardProps) => {
  return (
    <Card variant="book" className="group">
      <Link to={`/book/${book.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="hero"
              size="icon"
              className="w-14 h-14 rounded-full"
            >
              <Play className="w-6 h-6 ml-1" />
            </Button>
          </div>

          {/* Price badge */}
          <Badge className="absolute top-3 right-3 gradient-gold text-foreground font-semibold border-0">
            R{book.price}
          </Badge>

          {/* Wishlist button */}
          <button className="absolute top-3 left-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background">
            <Heart className="w-4 h-4 text-primary" />
          </button>
        </div>
      </Link>

      <div className="p-4">
        <Badge variant="secondary" className="mb-2 text-xs">
          {book.category}
        </Badge>
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1 mb-1">
          {book.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
        
        <div className="flex items-center justify-between">
          <StarRating rating={book.rating} size="sm" showValue />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {book.duration}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BookCard;
