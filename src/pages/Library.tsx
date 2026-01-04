import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookCard from "@/components/BookCard";
import { sampleBooks, categories, languages } from "@/data/books";
import { Search, Filter, SlidersHorizontal, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const Library = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "duration">("rating");

  const filteredBooks = sampleBooks
    .filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || book.category === selectedCategory;
      const matchesLanguage =
        selectedLanguage === "All Languages" || book.language === selectedLanguage;
      return matchesSearch && matchesCategory && matchesLanguage;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price") return a.price - b.price;
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Audiobook Library
            </h1>
            <p className="text-muted-foreground text-lg">
              Browse our collection of English and isiZulu audiobooks
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "rating" ? "default" : "outline"}
                onClick={() => setSortBy("rating")}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Top Rated
              </Button>
              <Button
                variant={sortBy === "price" ? "default" : "outline"}
                onClick={() => setSortBy("price")}
              >
                Price
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                className={cn(
                  "cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105",
                  selectedCategory === category
                    ? "gradient-primary text-primary-foreground border-0"
                    : ""
                )}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Language Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Globe className="w-5 h-5 text-muted-foreground mr-1" />
            {languages.map((language) => (
              <Badge
                key={language}
                variant={selectedLanguage === language ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-3 py-1 text-sm transition-all hover:scale-105",
                  selectedLanguage === language
                    ? "gradient-gold text-foreground border-0"
                    : ""
                )}
                onClick={() => setSelectedLanguage(language)}
              >
                {language}
              </Badge>
            ))}
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {filteredBooks.length}
              </span>{" "}
              audiobooks
            </p>
          </div>

          {/* Books Grid */}
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredBooks.map((book, index) => (
                <div
                  key={book.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">
                No books found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}

          {/* Payment Methods Info */}
          <section className="mt-16 bg-card rounded-2xl p-8 shadow-card">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Payment Methods
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-primary">V</span>
                </div>
                <div>
                  <p className="font-semibold">Visa</p>
                  <p className="text-sm text-muted-foreground">Credit/Debit</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-primary">M</span>
                </div>
                <div>
                  <p className="font-semibold">Mastercard</p>
                  <p className="text-sm text-muted-foreground">Credit/Debit</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-primary">PP</span>
                </div>
                <div>
                  <p className="font-semibold">PayPal</p>
                  <p className="text-sm text-muted-foreground">Digital Wallet</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-primary">EFT</span>
                </div>
                <div>
                  <p className="font-semibold">Bank Transfer</p>
                  <p className="text-sm text-muted-foreground">Direct EFT</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Library;
