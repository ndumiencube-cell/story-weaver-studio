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
import AudioPlayer from "@/components/AudioPlayer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Voice options matching the edge function
const VOICE_OPTIONS = [
  { id: "george", name: "George", gender: "Male", description: "Warm, authoritative" },
  { id: "brian", name: "Brian", gender: "Male", description: "Deep, mature" },
  { id: "daniel", name: "Daniel", gender: "Male", description: "British, professional" },
  { id: "liam", name: "Liam", gender: "Male", description: "Young, friendly" },
  { id: "charlie", name: "Charlie", gender: "Male", description: "Conversational" },
  { id: "sarah", name: "Sarah", gender: "Female", description: "Warm, engaging" },
  { id: "laura", name: "Laura", gender: "Female", description: "Soft, soothing" },
  { id: "alice", name: "Alice", gender: "Female", description: "British, elegant" },
  { id: "jessica", name: "Jessica", gender: "Female", description: "Expressive, dynamic" },
  { id: "lily", name: "Lily", gender: "Female", description: "Warm, narrative" },
];

const Author = () => {
  const { user } = useAuth();
  const [scriptText, setScriptText] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [coverPrompt, setCoverPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCover, setGeneratedCover] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("george");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["text/plain", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".pdf") && !file.name.endsWith(".docx")) {
      toast.error("Please upload a PDF, DOCX, or TXT file");
      return;
    }

    setIsUploading(true);
    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        setScriptText(text);
        toast.success("Text file loaded successfully!");
      } else {
        toast.info("PDF/DOCX parsing will be available soon. For now, please paste text directly.");
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to read file");
    } finally {
      setIsUploading(false);
    }
  };
  const myBooks = sampleBooks.slice(0, 3);

  const handleGenerateCover = async () => {
    if (!coverPrompt.trim()) {
      toast.error("Please enter a description for your book cover");
      return;
    }
    
    setIsGenerating(true);
    setGeneratedCover(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt: coverPrompt }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate cover");
      }

      setGeneratedCover(data.imageUrl);
      toast.success("Book cover generated successfully!");
    } catch (error) {
      console.error("Cover generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate cover");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConvertToAudio = async () => {
    if (!scriptText.trim()) {
      toast.error("Please enter or upload your script first");
      return;
    }

    if (scriptText.length > 5000) {
      toast.error("Script is too long. Maximum 5000 characters for demo.");
      return;
    }

    setIsConverting(true);
    setGeneratedAudio(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/convert-to-audiobook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: scriptText, voice: selectedVoice }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to convert to audiobook");
      }

      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      setGeneratedAudio(audioUrl);
      setAudioDuration(data.duration);
      
      toast.success("Audiobook generated successfully!");
    } catch (error) {
      console.error("Audiobook conversion error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to convert to audiobook");
    } finally {
      setIsConverting(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!user) {
      toast.error("Please sign in to save audiobooks to your library");
      return;
    }

    if (!generatedAudio || !bookTitle.trim()) {
      toast.error("Please generate an audiobook and add a title first");
      return;
    }

    setIsSaving(true);
    try {
      // Convert base64 to blob for storage
      const base64Data = generatedAudio.split(",")[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: "audio/mpeg" });

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}-${bookTitle.replace(/\s+/g, "-").toLowerCase()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audiobooks")
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("audiobooks")
        .getPublicUrl(fileName);

      // Save audiobook metadata
      const { error: insertError } = await supabase
        .from("audiobooks")
        .insert({
          user_id: user.id,
          title: bookTitle,
          audio_url: urlData.publicUrl,
          cover_url: generatedCover,
          voice_id: selectedVoice,
          duration: audioDuration,
        });

      if (insertError) throw insertError;

      toast.success("Audiobook saved to your library!");
      
      // Reset form
      setScriptText("");
      setBookTitle("");
      setGeneratedAudio(null);
      setGeneratedCover(null);
      setAudioDuration(null);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save audiobook");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadAudio = () => {
    if (!generatedAudio) return;
    
    const link = document.createElement("a");
    link.href = generatedAudio;
    link.download = `${bookTitle || "audiobook"}.mp3`;
    link.click();
    toast.success("Audiobook downloaded!");
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
                    <label className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer block">
                      <input
                        type="file"
                        accept=".txt,.pdf,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium mb-1">
                        {isUploading ? "Uploading..." : "Drop your document here"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports PDF, DOCX, TXT
                      </p>
                      <Button variant="outline" size="sm" className="mt-4" type="button" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Book Title:</label>
                      <Input
                        placeholder="Enter your audiobook title..."
                        value={bookTitle}
                        onChange={(e) => setBookTitle(e.target.value)}
                      />
                    </div>

                    <Textarea
                      placeholder="Paste your script here (English or isiZulu)..."
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                      className="min-h-[150px]"
                    />

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Select Voice:</label>
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a voice" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Male Voices</div>
                          {VOICE_OPTIONS.filter(v => v.gender === "Male").map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name} - {voice.description}
                            </SelectItem>
                          ))}
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">Female Voices</div>
                          {VOICE_OPTIONS.filter(v => v.gender === "Female").map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name} - {voice.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground">
                        {scriptText.length}/5000 chars
                      </span>
                    </div>

                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={handleConvertToAudio}
                      disabled={isConverting}
                    >
                      {isConverting ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <Mic2 className="w-4 h-4 mr-2" />
                          Convert to Audiobook
                        </>
                      )}
                    </Button>

                    {generatedAudio && (
                      <div className="space-y-3">
                        <AudioPlayer audioUrl={generatedAudio} title={bookTitle} compact />
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadAudio}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleSaveToLibrary}
                            disabled={isSaving || !user}
                            className="flex-1"
                          >
                            {isSaving ? (
                              <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save to Library
                              </>
                            )}
                          </Button>
                        </div>
                        {!user && (
                          <p className="text-xs text-muted-foreground text-center">
                            Sign in to save audiobooks to your library
                          </p>
                        )}
                      </div>
                    )}
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
                    <div className="aspect-[3/4] bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
                      {generatedCover ? (
                        <img 
                          src={generatedCover} 
                          alt="Generated book cover" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-8">
                          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            Your AI-generated cover will appear here
                          </p>
                        </div>
                      )}
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
