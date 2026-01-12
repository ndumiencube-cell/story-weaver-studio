import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookCard from "@/components/BookCard";
import AudioPlayer from "@/components/AudioPlayer";
import { sampleBooks, categories, languages } from "@/data/books";
import { Search, Filter, SlidersHorizontal, Globe, Library as LibraryIcon, BookOpen, Send, Sparkles, Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Audiobook {
  id: string;
  title: string;
  author_name: string | null;
  cover_url: string | null;
  audio_url: string | null;
  voice_id: string;
  duration: number | null;
  description: string | null;
  is_published: boolean;
  created_at: string;
}

const Library = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "duration">("rating");
  const [myAudiobooks, setMyAudiobooks] = useState<Audiobook[]>([]);
  const [publishedAudiobooks, setPublishedAudiobooks] = useState<Audiobook[]>([]);
  const [isLoadingAudiobooks, setIsLoadingAudiobooks] = useState(false);
  const [isLoadingPublished, setIsLoadingPublished] = useState(false);
  const [selectedAudiobook, setSelectedAudiobook] = useState<Audiobook | null>(null);
  const [discoverSearch, setDiscoverSearch] = useState("");

  useEffect(() => {
    fetchPublishedAudiobooks();
    if (user) {
      fetchMyAudiobooks();
    }
  }, [user]);

  const fetchPublishedAudiobooks = async () => {
    setIsLoadingPublished(true);
    try {
      const { data, error } = await supabase
        .from("audiobooks")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPublishedAudiobooks(data || []);
    } catch (error) {
      console.error("Error fetching published audiobooks:", error);
    } finally {
      setIsLoadingPublished(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Unknown";
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  const fetchMyAudiobooks = async () => {
    if (!user) return;
    
    setIsLoadingAudiobooks(true);
    try {
      const { data, error } = await supabase
        .from("audiobooks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyAudiobooks(data || []);
    } catch (error) {
      console.error("Error fetching audiobooks:", error);
    } finally {
      setIsLoadingAudiobooks(false);
    }
  };

  const handleDeleteAudiobook = async (audiobook: Audiobook) => {
    if (!user) return;
    
    try {
      // Delete from storage if there's an audio file
      if (audiobook.audio_url) {
        const path = audiobook.audio_url.split("/audiobooks/")[1];
        if (path) {
          await supabase.storage.from("audiobooks").remove([path]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from("audiobooks")
        .delete()
        .eq("id", audiobook.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setMyAudiobooks((prev) => prev.filter((a) => a.id !== audiobook.id));
      toast.success("Audiobook deleted successfully");
    } catch (error) {
      console.error("Error deleting audiobook:", error);
      toast.error("Failed to delete audiobook");
    }
  };

  const handlePublishToggle = async (audiobook: Audiobook) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("audiobooks")
        .update({ is_published: !audiobook.is_published })
        .eq("id", audiobook.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setMyAudiobooks((prev) =>
        prev.map((a) =>
          a.id === audiobook.id ? { ...a, is_published: !a.is_published } : a
        )
      );
      toast.success(audiobook.is_published ? "Audiobook unpublished" : "Audiobook published!");
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Failed to update publish status");
    }
  };

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

          <Tabs defaultValue="discover" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="discover" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Curated
              </TabsTrigger>
              <TabsTrigger value="my-library" className="flex items-center gap-2">
                <LibraryIcon className="w-4 h-4" />
                My Library
              </TabsTrigger>
            </TabsList>

            {/* Discover Tab - Published Audiobooks from All Users */}
            <TabsContent value="discover" className="space-y-6">
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search published audiobooks..."
                  value={discoverSearch}
                  onChange={(e) => setDiscoverSearch(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {/* Results Count */}
              <div>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {publishedAudiobooks.filter(a => 
                      a.title.toLowerCase().includes(discoverSearch.toLowerCase()) ||
                      (a.author_name || "").toLowerCase().includes(discoverSearch.toLowerCase())
                    ).length}
                  </span>{" "}
                  community audiobooks available
                </p>
              </div>

              {isLoadingPublished ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">Loading audiobooks...</p>
                </div>
              ) : publishedAudiobooks.length === 0 ? (
                <div className="text-center py-16">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold mb-2">
                    No published audiobooks yet
                  </h3>
                  <p className="text-muted-foreground">
                    Be the first to publish an audiobook!
                  </p>
                </div>
              ) : (
                <>
                  {/* Currently Playing */}
                  {selectedAudiobook && (
                    <Card className="overflow-hidden mb-6 border-primary/20">
                      <CardContent className="p-0">
                        <AudioPlayer
                          audioUrl={selectedAudiobook.audio_url || ""}
                          title={selectedAudiobook.title}
                          author={selectedAudiobook.author_name || "Unknown Author"}
                          coverUrl={selectedAudiobook.cover_url || undefined}
                          description={selectedAudiobook.description || undefined}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Audiobooks Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {publishedAudiobooks
                      .filter(a => 
                        a.title.toLowerCase().includes(discoverSearch.toLowerCase()) ||
                        (a.author_name || "").toLowerCase().includes(discoverSearch.toLowerCase())
                      )
                      .map((audiobook, index) => (
                      <Card 
                        key={audiobook.id} 
                        className={cn(
                          "group cursor-pointer transition-all duration-300 hover:shadow-glow overflow-hidden",
                          selectedAudiobook?.id === audiobook.id && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedAudiobook(audiobook)}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="relative aspect-[3/4] overflow-hidden">
                          {audiobook.cover_url ? (
                            <img
                              src={audiobook.cover_url}
                              alt={audiobook.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
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
                        </div>

                        <div className="p-4">
                          <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1 mb-1">
                            {audiobook.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                            {audiobook.author_name || "Unknown Author"}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDuration(audiobook.duration)}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Browse Tab */}
            <TabsContent value="browse" className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4">
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
              <div className="flex flex-wrap gap-2">
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
              <div className="flex flex-wrap gap-2">
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
              <div>
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
            </TabsContent>

            {/* My Library Tab */}
            <TabsContent value="my-library" className="space-y-6">
              {!user ? (
                <div className="text-center py-16">
                  <LibraryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold mb-2">
                    Sign in to view your library
                  </h3>
                  <p className="text-muted-foreground">
                    Create audiobooks and save them to your personal library
                  </p>
                </div>
              ) : isLoadingAudiobooks ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">Loading your audiobooks...</p>
                </div>
              ) : myAudiobooks.length === 0 ? (
                <div className="text-center py-16">
                  <LibraryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold mb-2">
                    Your library is empty
                  </h3>
                  <p className="text-muted-foreground">
                    Create your first audiobook in the Author dashboard
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {myAudiobooks.map((audiobook) => (
                    <Card key={audiobook.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col">
                          <AudioPlayer
                            audioUrl={audiobook.audio_url || ""}
                            title={audiobook.title}
                            author={audiobook.author_name || "You"}
                            coverUrl={audiobook.cover_url || undefined}
                            description={audiobook.description || undefined}
                            onDelete={() => handleDeleteAudiobook(audiobook)}
                          />
                          <div className="px-4 pb-4 flex items-center gap-2">
                            <Button
                              variant={audiobook.is_published ? "outline" : "default"}
                              size="sm"
                              onClick={() => handlePublishToggle(audiobook)}
                              className="flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              {audiobook.is_published ? "Unpublish" : "Publish"}
                            </Button>
                            {audiobook.is_published && (
                              <span className="text-xs text-green-600 font-medium">Published</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

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
