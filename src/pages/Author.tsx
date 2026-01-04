import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { sampleBooks } from "@/data/books";
import StarRating from "@/components/StarRating";
import {
  Upload,
  Sparkles,
  BookOpen,
  DollarSign,
  TrendingUp,
  FileText,
  Mic2,
  Image,
  Wand2,
  Download,
  Eye,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const Author = () => {
  const [scriptText, setScriptText] = useState("");
  const [coverPrompt, setCoverPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const myBooks = sampleBooks.slice(0, 3);

  const handleGenerateCover = () => {
    if (!coverPrompt.trim()) {
      toast.error("Please enter a description for your book cover");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Book cover generated successfully!");
    }, 2000);
  };

  const handleConvertToAudio = () => {
    if (!scriptText.trim()) {
      toast.error("Please enter or upload your script first");
      return;
    }
    toast.success("Converting to audiobook... This may take a few minutes.");
  };

  const stats = [
    { label: "Total Earnings", value: "R 12,450", icon: DollarSign, trend: "+15%" },
    { label: "Total Plays", value: "8,234", icon: TrendingUp, trend: "+23%" },
    { label: "Published Books", value: "5", icon: BookOpen, trend: "" },
    { label: "Avg. Rating", value: "4.7", icon: TrendingUp, trend: "" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Badge className="mb-4 gradient-gold text-foreground border-0">
              Author Dashboard
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome Back, Author
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your audiobooks, generate covers, and track your earnings
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="shadow-card hover:shadow-glow transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-5 h-5 text-primary" />
                    {stat.trend && (
                      <span className="text-xs text-green-600 font-medium">
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="create" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="books">My Books</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
            </TabsList>

            {/* Create Tab */}
            <TabsContent value="create" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Script Upload */}
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Upload Script
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium mb-1">Drop your document here</p>
                      <p className="text-sm text-muted-foreground">
                        Supports PDF, DOCX, TXT
                      </p>
                      <Button variant="outline" size="sm" className="mt-4">
                        Browse Files
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or paste your script
                        </span>
                      </div>
                    </div>

                    <Textarea
                      placeholder="Paste your script here (English or isiZulu)..."
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                      className="min-h-[200px]"
                    />

                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={handleConvertToAudio}
                    >
                      <Mic2 className="w-4 h-4 mr-2" />
                      Convert to Audiobook
                    </Button>
                  </CardContent>
                </Card>

                {/* Cover Generator */}
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="w-5 h-5 text-primary" />
                      Generate Book Cover
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="aspect-[3/4] bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                      <div className="text-center p-8">
                        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Your AI-generated cover will appear here
                        </p>
                      </div>
                    </div>

                    <Input
                      placeholder="Describe your book cover (e.g., 'African sunset with lions')"
                      value={coverPrompt}
                      onChange={(e) => setCoverPrompt(e.target.value)}
                    />

                    <Button
                      variant="gold"
                      className="w-full"
                      onClick={handleGenerateCover}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Cover
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* My Books Tab */}
            <TabsContent value="books">
              <div className="space-y-4">
                {myBooks.map((book) => (
                  <Card key={book.id} className="shadow-card">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-24 h-32 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-display text-xl font-semibold">
                                {book.title}
                              </h3>
                              <p className="text-muted-foreground">{book.category}</p>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Published
                            </Badge>
                          </div>

                          <div className="flex items-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">1,234 plays</span>
                            </div>
                            <StarRating rating={book.rating} size="sm" showValue />
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">R{book.price}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              Analytics
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings">
              <div className="grid md:grid-cols-2 gap-8">
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Earnings Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-secondary rounded-xl">
                        <span className="text-muted-foreground">This Month</span>
                        <span className="font-display text-2xl font-bold text-foreground">
                          R 3,240
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-secondary rounded-xl">
                        <span className="text-muted-foreground">Last Month</span>
                        <span className="font-display text-xl font-semibold">
                          R 2,890
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-secondary rounded-xl">
                        <span className="text-muted-foreground">All Time</span>
                        <span className="font-display text-xl font-semibold">
                          R 12,450
                        </span>
                      </div>
                    </div>

                    <Button variant="hero" className="w-full mt-6">
                      Withdraw Funds
                    </Button>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Payment Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Bank Account
                      </label>
                      <Input placeholder="Enter bank account number" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Bank Name
                      </label>
                      <Input placeholder="e.g., FNB, Standard Bank" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Account Holder Name
                      </label>
                      <Input placeholder="Your full name" />
                    </div>
                    <Button variant="default" className="w-full">
                      Save Payment Details
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Author;
