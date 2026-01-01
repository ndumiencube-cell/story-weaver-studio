import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import BookCard from "@/components/BookCard";
import { sampleBooks } from "@/data/books";
import {
  Play,
  Clock,
  BookOpen,
  Heart,
  Share2,
  ShoppingCart,
  Headphones,
  ArrowLeft,
} from "lucide-react";

const BookDetail = () => {
  const { id } = useParams();
  const book = sampleBooks.find((b) => b.id === id);
  const relatedBooks = sampleBooks.filter((b) => b.id !== id).slice(0, 4);

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 text-center">
          <h1 className="font-display text-4xl font-bold mb-4">Book Not Found</h1>
          <Button asChild>
            <Link to="/library">Back to Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link
            to="/library"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>

          {/* Book Details */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Cover */}
            <div className="md:col-span-1">
              <div className="sticky top-24">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-card">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="icon" className="flex-1">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="flex-1">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="md:col-span-2">
              <Badge className="mb-4">{book.category}</Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                {book.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                by {book.author}
              </p>

              {/* Rating and Stats */}
              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <StarRating rating={book.rating} size="lg" />
                  <span className="text-lg font-medium">{book.rating}</span>
                  <span className="text-muted-foreground">(234 ratings)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span>{book.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Headphones className="w-5 h-5" />
                  <span>1.2K listens</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold mb-3">
                  About this audiobook
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {book.description}
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Immerse yourself in this captivating isiZulu audiobook,
                  professionally narrated to bring every character and scene to
                  life. Perfect for both native speakers and those learning the
                  language, this audiobook offers a unique cultural experience
                  that celebrates the rich storytelling tradition of the Zulu
                  people.
                </p>
              </div>

              {/* Price and Actions */}
              <Card className="shadow-card mb-8">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-display text-4xl font-bold text-foreground">
                        R{book.price}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex items-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Preview
                      </Button>
                      <Button
                        variant="hero"
                        size="lg"
                        className="flex items-center gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What's Included */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">12 Chapters</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">{book.duration}</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <Headphones className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">HD Audio</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <Heart className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Offline Access</p>
                </div>
              </div>
            </div>
          </div>

          {/* Related Books */}
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              You might also like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedBooks.map((relatedBook) => (
                <BookCard key={relatedBook.id} book={relatedBook} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookDetail;
