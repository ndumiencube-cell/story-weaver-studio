import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookCard from "@/components/BookCard";
import { sampleBooks } from "@/data/books";
import heroBg from "@/assets/hero-bg.jpg";
import {
  Headphones,
  BookOpen,
  Mic2,
  Star,
  ArrowRight,
  Upload,
  Sparkles,
  CreditCard,
} from "lucide-react";

const Index = () => {
  const featuredBooks = sampleBooks.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="African storytelling"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brown/90 via-brown/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
          <div className="max-w-2xl">
            <Badge className="mb-6 gradient-gold text-foreground border-0 animate-fade-in">
              <Sparkles className="w-3 h-3 mr-1" />
              isiZulu Audiobooks
            </Badge>

            <h1
              className="font-display text-5xl md:text-7xl font-bold text-cream mb-6 animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              Izwi Lami,
              <br />
              <span className="text-gradient">Indaba Yami</span>
            </h1>

            <p
              className="text-lg md:text-xl text-cream/80 mb-8 leading-relaxed animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              Experience the rich tradition of African storytelling through
              beautifully narrated isiZulu audiobooks. Listen to tales that have
              been passed down through generations, now available at your
              fingertips.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 animate-slide-up"
              style={{ animationDelay: "0.3s" }}
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/library">
                  <Headphones className="w-5 h-5 mr-2" />
                  Start Listening
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="bg-cream/10 border-cream/30 text-cream hover:bg-cream/20 hover:text-cream"
                asChild
              >
                <Link to="/author">
                  <Mic2 className="w-5 h-5 mr-2" />
                  Become an Author
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-3 gap-6 mt-12 animate-fade-in"
              style={{ animationDelay: "0.5s" }}
            >
              <div>
                <p className="font-display text-3xl font-bold text-gold">
                  500+
                </p>
                <p className="text-cream/60 text-sm">Audiobooks</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-gold">
                  100+
                </p>
                <p className="text-cream/60 text-sm">Authors</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-gold">50K</p>
                <p className="text-cream/60 text-sm">Listeners</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose IzwiLami?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The ultimate platform for isiZulu audiobooks, connecting listeners
              with authentic African stories.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-8 shadow-card text-center hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-6 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Vast Library
              </h3>
              <p className="text-muted-foreground">
                Access hundreds of isiZulu audiobooks across multiple genres,
                from folk tales to modern fiction.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-card text-center hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 rounded-full gradient-gold mx-auto mb-6 flex items-center justify-center">
                <Mic2 className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                AI Voice Generation
              </h3>
              <p className="text-muted-foreground">
                Convert your written scripts to professional-quality isiZulu
                audiobooks using our AI technology.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-card text-center hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-terracotta mx-auto mb-6 flex items-center justify-center">
                <Star className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                Quality Content
              </h3>
              <p className="text-muted-foreground">
                Every audiobook is carefully curated and rated by our community
                to ensure the best listening experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Featured Audiobooks
              </h2>
              <p className="text-muted-foreground">
                Discover our most popular isiZulu stories
              </p>
            </div>
            <Button variant="outline" asChild className="hidden md:flex">
              <Link to="/library">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredBooks.map((book, index) => (
              <div
                key={book.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <BookCard book={book} />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link to="/library">
                View All Books
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Author CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-cream mb-6">
              Share Your Stories with the World
            </h2>
            <p className="text-cream/80 text-lg mb-8">
              Are you an author with stories to tell? Join IzwiLami and reach
              thousands of listeners. Upload your scripts, generate covers, and
              start earning.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-cream/10 backdrop-blur-sm rounded-xl p-6">
                <Upload className="w-10 h-10 text-gold mx-auto mb-3" />
                <h3 className="font-display text-lg font-semibold text-cream mb-2">
                  Upload Scripts
                </h3>
                <p className="text-cream/70 text-sm">
                  Upload your written stories or documents
                </p>
              </div>
              <div className="bg-cream/10 backdrop-blur-sm rounded-xl p-6">
                <Sparkles className="w-10 h-10 text-gold mx-auto mb-3" />
                <h3 className="font-display text-lg font-semibold text-cream mb-2">
                  Generate Covers
                </h3>
                <p className="text-cream/70 text-sm">
                  Create beautiful book covers with AI
                </p>
              </div>
              <div className="bg-cream/10 backdrop-blur-sm rounded-xl p-6">
                <CreditCard className="w-10 h-10 text-gold mx-auto mb-3" />
                <h3 className="font-display text-lg font-semibold text-cream mb-2">
                  Earn Revenue
                </h3>
                <p className="text-cream/70 text-sm">
                  Get paid for every listen and sale
                </p>
              </div>
            </div>

            <Button variant="gold" size="xl" asChild>
              <Link to="/author">
                Start Creating
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
