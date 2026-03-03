import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import ChapterEditor, { Chapter, countWords, MINIMUM_WORD_COUNT } from "@/components/ChapterEditor";
import ChapterRecorder from "@/components/ChapterRecorder";
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
  Clock,
  CheckCircle2,
  Save,
  Plus,
  AlertCircle,
  Mic,
  Music,
} from "lucide-react";
import { toast } from "sonner";

// Constants
const MINIMUM_AUDIO_DURATION = 30; // seconds
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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

// Language options
const LANGUAGE_OPTIONS = [
  { id: "isiZulu", name: "isiZulu", description: "Zulu language" },
  { id: "English", name: "English", description: "English language" },
];

// Extended Chapter type to support audio chapters
interface AudioChapter extends Chapter {
  isAudioChapter?: boolean;
  audioBlob?: Blob;
  audioUrl?: string;
}

const Author = () => {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<AudioChapter[]>([]);
  const [bookTitle, setBookTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [coverPrompt, setCoverPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCover, setGeneratedCover] = useState<string | null>(null);
  const [coverGenerationCount, setCoverGenerationCount] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("george");
  const [selectedLanguage, setSelectedLanguage] = useState("isiZulu");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showUploadAudioModal, setShowUploadAudioModal] = useState(false);
  const [audioSourceMethod, setAudioSourceMethod] = useState<'record' | 'upload' | null>(null);
  const [showCoverGenerator, setShowCoverGenerator] = useState(false);
  const [selectedAudioMethod, setSelectedAudioMethod] = useState<string>('');
  const [activeTab, setActiveTab] = useState("create");

  // Handle language change - reset audio method selection
  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    setSelectedAudioMethod('');
  };

  // Handle adding audio chapter
  const handleAddAudioChapter = (title: string, audioBlob: Blob, duration: number) => {
    // Validate minimum audio duration (30 seconds)
    if (duration < MINIMUM_AUDIO_DURATION) {
      toast.error(`❌ Audio chapter too short. Minimum ${MINIMUM_AUDIO_DURATION} seconds required. You recorded ${Math.floor(duration)} seconds.`);
      return;
    }
    
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Determine if this is recorded or uploaded based on blob type
    const isRecorded = audioBlob.type.includes('webm');
    const isUploaded = !isRecorded; // MP3, WAV, M4A, etc.
    const currentMethod = isRecorded ? 'record' : 'upload';
    
    // If this is the first audio chapter, lock in the method
    if (audioSourceMethod === null) {
      setAudioSourceMethod(currentMethod);
      setSelectedAudioMethod(currentMethod);
    } else if (audioSourceMethod !== currentMethod) {
      // Mixing methods not allowed
      const methodNames = { record: 'recorded', upload: 'uploaded' };
      toast.error(
        `❌ This book uses ${methodNames[audioSourceMethod]} audio. You can't mix with ${methodNames[currentMethod]} audio. Keep the same source for voice consistency.`
      );
      return;
    }
    const newChapter: AudioChapter = {
      id: generateUUID(),
      title,
      content: "[Audio Chapter]",
      wordCount: 0,
      chapterNumber: chapters.length + 1,
      isAudioChapter: true,
      audioBlob,
      audioUrl,
      audioDuration: duration,
    };
    setChapters(prev => [...prev, newChapter]);
    setHasUnsavedChanges(true);
    toast.success(`✅ Audio chapter "${title}" added`);
  };

  // Generate combined script from chapters
  const combinedScriptText = chapters
    .sort((a, b) => a.chapterNumber - b.chapterNumber)
    .map(ch => `--- Chapter ${ch.chapterNumber}: ${ch.title} ---\n\n${ch.content}`)
    .join("\n\n");

  const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const totalCharCount = combinedScriptText.length;
  
  // Check if all chapters are audio-only (no text conversion needed)
  const hasOnlyAudioChapters = chapters.length > 0 && chapters.every(ch => (ch as AudioChapter).isAudioChapter);
  const hasAnyAudioChapters = chapters.some(ch => (ch as AudioChapter).isAudioChapter);
  const textChapters = chapters.filter(ch => !(ch as AudioChapter).isAudioChapter);
  
  // Only text chapters need to meet minimum word count
  const allChaptersMeetMinimum = textChapters.every(ch => ch.wordCount >= MINIMUM_WORD_COUNT);

  // Save draft to database
  const handleSaveDraft = async () => {
    if (!user) {
      toast.error("Please sign in to save drafts");
      return;
    }

    if (!bookTitle.trim()) {
      toast.error("Please enter a book title first");
      return;
    }

    setIsSavingDraft(true);
    try {
      let audiobookId = currentDraftId;

      // Create or update audiobook record
      if (!audiobookId) {
        const { data: newAudiobook, error: insertError } = await supabase
          .from("audiobooks")
          .insert({
            user_id: user.id,
            title: bookTitle,
            author_name: authorName || null,
            description: bookDescription || null,
            voice_id: selectedVoice,
            cover_url: generatedCover,
            is_published: false,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        audiobookId = newAudiobook.id;
        setCurrentDraftId(audiobookId);
      } else {
        // Update existing audiobook
        const { error: updateError } = await supabase
          .from("audiobooks")
          .update({
            title: bookTitle,
            author_name: authorName || null,
            description: bookDescription || null,
            voice_id: selectedVoice,
            cover_url: generatedCover,
          })
          .eq("id", audiobookId)
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }

      // Delete existing chapters for this audiobook
      const { error: deleteError } = await supabase
        .from("chapters")
        .delete()
        .eq("audiobook_id", audiobookId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      // Insert new chapters
      if (chapters.length > 0) {
        const chaptersToInsert = chapters.map(ch => ({
          audiobook_id: audiobookId,
          user_id: user.id,
          chapter_number: ch.chapterNumber,
          title: ch.title,
          content: ch.content,
          word_count: ch.wordCount,
        }));

        const { error: chaptersError } = await supabase
          .from("chapters")
          .insert(chaptersToInsert);

        if (chaptersError) throw chaptersError;
      }

      setHasUnsavedChanges(false);
      toast.success("Draft saved successfully!");
      fetchMyAudiobooks();
    } catch (error) {
      console.error("Save draft error:", error);
      toast.error("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Load chapters for an audiobook
  const loadDraft = async (audiobook: MyAudiobook) => {
    if (!user) return;

    try {
      const { data: chaptersData, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("audiobook_id", audiobook.id)
        .eq("user_id", user.id)
        .order("chapter_number", { ascending: true });

      if (error) throw error;

      setCurrentDraftId(audiobook.id);
      setBookTitle(audiobook.title);
      setAuthorName(audiobook.author_name || "");
      setBookDescription(audiobook.description || "");
      setSelectedVoice(audiobook.voice_id);
      setGeneratedCover(audiobook.cover_url);
      setGeneratedAudio(audiobook.audio_url);

      if (chaptersData && chaptersData.length > 0) {
        const loadedChapters: Chapter[] = chaptersData.map(ch => ({
          id: ch.id,
          title: ch.title,
          content: ch.content,
          wordCount: ch.word_count,
          chapterNumber: ch.chapter_number,
        }));
        setChapters(loadedChapters);
      } else {
        setChapters([]);
      }

      setHasUnsavedChanges(false);
      toast.success(`Loaded "${audiobook.title}" for editing`);
    } catch (error) {
      console.error("Load draft error:", error);
      toast.error("Failed to load draft");
    }
  };

  // Reset to new draft
  const handleNewDraft = () => {
    setCurrentDraftId(null);
    setChapters([]);
    setBookTitle("");
    setAuthorName("");
    setBookDescription("");
    setGeneratedCover(null);
    setGeneratedAudio(null);
    setAudioDuration(null);
    setSelectedVoice("george");
    setSelectedLanguage("isiZulu");
    setHasUnsavedChanges(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validExtensions = [".txt", ".pdf", ".docx"];
    const fileArray = Array.from(files);
    
    // Validate all files
    for (const file of fileArray) {
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (!validExtensions.includes(fileExtension)) {
        toast.error(`Invalid file type: ${file.name}. Please upload PDF, DOCX, or TXT files only.`);
        return;
      }
    }

    setIsUploading(true);
    const newChapters: Chapter[] = [];
    const startChapterNum = chapters.length + 1;

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
        let text = "";
        
        if (fileExtension === ".txt") {
          text = await file.text();
        } else {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: formData,
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Failed to parse ${file.name}`);
          }

          text = data.text;
        }

        // Create chapter from file
        const chapterTitle = file.name.replace(/\.(txt|pdf|docx)$/i, "");
        const wordCount = countWords(text);

        newChapters.push({
          id: generateUUID(),
          title: chapterTitle,
          content: text,
          wordCount,
          chapterNumber: startChapterNum + i,
        });
      }

      setChapters(prev => [...prev, ...newChapters]);
      setHasUnsavedChanges(true);
      
      const totalNewWords = newChapters.reduce((sum, ch) => sum + ch.wordCount, 0);
      toast.success(`Added ${newChapters.length} chapter(s) with ${totalNewWords.toLocaleString()} words`);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to read files");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddEmptyChapter = () => {
    const newChapter: Chapter = {
      id: generateUUID(),
      title: `Chapter ${chapters.length + 1}`,
      content: "",
      wordCount: 0,
      chapterNumber: chapters.length + 1,
    };
    setChapters(prev => [...prev, newChapter]);
    setHasUnsavedChanges(true);
    toast.success("New chapter added - click edit to add content");
  };

  const handleUpdateChapter = (id: string, updates: Partial<Chapter>) => {
    setChapters(prev =>
      prev.map(ch => (ch.id === id ? { ...ch, ...updates } : ch))
    );
    setHasUnsavedChanges(true);
  };

  const handleDeleteChapter = (id: string) => {
    setChapters(prev => {
      const filtered = prev.filter(ch => ch.id !== id);
      // Renumber chapters
      return filtered.map((ch, index) => ({
        ...ch,
        chapterNumber: index + 1,
      }));
    });
    setHasUnsavedChanges(true);
    toast.success("Chapter deleted");
  };

  const handleMoveChapter = (id: string, direction: "up" | "down") => {
    setChapters(prev => {
      const index = prev.findIndex(ch => ch.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newChapters = [...prev];
      [newChapters[index], newChapters[newIndex]] = [newChapters[newIndex], newChapters[index]];
      
      // Renumber chapters
      return newChapters.map((ch, i) => ({
        ...ch,
        chapterNumber: i + 1,
      }));
    });
    setHasUnsavedChanges(true);
  };

  const handleClearAllChapters = () => {
    setChapters([]);
    setHasUnsavedChanges(true);
    toast.success("All chapters cleared");
  };

  interface MyAudiobook {
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

  const [myAudiobooks, setMyAudiobooks] = useState<MyAudiobook[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyAudiobooks();
    }
  }, [user]);

  const fetchMyAudiobooks = async () => {
    if (!user) return;
    setIsLoadingBooks(true);
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
      setIsLoadingBooks(false);
    }
  };

  const handlePublishToggle = async (audiobook: MyAudiobook) => {
    try {
      const { error } = await supabase
        .from("audiobooks")
        .update({ is_published: !audiobook.is_published })
        .eq("id", audiobook.id)
        .eq("user_id", user?.id);

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

  const handleDeleteAudiobook = async (audiobook: MyAudiobook) => {
    if (!user) return;
    try {
      if (audiobook.audio_url) {
        const path = audiobook.audio_url.split("/audiobooks/")[1];
        if (path) {
          await supabase.storage.from("audiobooks").remove([path]);
        }
      }
      const { error } = await supabase
        .from("audiobooks")
        .delete()
        .eq("id", audiobook.id)
        .eq("user_id", user.id);

      if (error) throw error;
      setMyAudiobooks((prev) => prev.filter((a) => a.id !== audiobook.id));
      toast.success("Audiobook deleted");
    } catch (error) {
      console.error("Error deleting audiobook:", error);
      toast.error("Failed to delete audiobook");
    }
  };

  const handleGenerateCover = async () => {
    // Limit to 2 generations
    if (coverGenerationCount >= 2) {
      toast.error("❌ You've reached the limit of 2 cover generations. Choose one to proceed.");
      return;
    }
    
    // Use custom prompt if provided, otherwise auto-generate from book details
    let finalPrompt = coverPrompt.trim();
    
    if (!finalPrompt) {
      // Auto-generate prompt from book metadata
      if (!bookTitle.trim()) {
        toast.error("Please enter a book title first");
        return;
      }
      
      finalPrompt = `A professional and attractive book cover for "${bookTitle}"${authorName ? ` by ${authorName}` : ''}${bookDescription ? `. About: ${bookDescription.substring(0, 80)}` : ''}. Make it visually stunning and marketable.`;
    }
    
    setIsGenerating(true);
    setGeneratedCover(null);
    
    try {
      console.log("Generating cover with prompt:", finalPrompt);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt: finalPrompt }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate cover");
      }

      if (!data.imageUrl) {
        throw new Error("No image URL returned from server");
      }

      setGeneratedCover(data.imageUrl);
      setCoverGenerationCount(prev => prev + 1);
      
      const remaining = 2 - (coverGenerationCount + 1);
      if (remaining > 0) {
        toast.success(`Book cover generated! ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
      } else {
        toast.success("Book cover generated! This is your last attempt.");
      }
    } catch (error) {
      console.error("Cover generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate cover");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConvertToAudio = async () => {
    if (chapters.length === 0) {
      toast.error("Please add at least one chapter first");
      return;
    }

    // If all chapters are audio, no conversion needed - just proceed to save
    if (hasOnlyAudioChapters) {
      toast.info("All chapters are already audio. You can save directly to your library.");
      return;
    }

    // Only validate text chapters
    if (textChapters.length > 0 && !allChaptersMeetMinimum) {
      toast.error(`Each text chapter must have at least ${MINIMUM_WORD_COUNT} words`);
      return;
    }

    // Only count text content
    const textContent = textChapters
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
      .map(ch => `--- Chapter ${ch.chapterNumber}: ${ch.title} ---\n\n${ch.content}`)
      .join("\n\n");

    if (textContent.length > 5000) {
      toast.error("Total text content is too long. Maximum 5000 characters for demo.");
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
          body: JSON.stringify({ 
            text: textContent, 
            voice: selectedVoice, 
            language: selectedLanguage,
          }),
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

    if (!bookTitle.trim()) {
      toast.error("Please add a book title first");
      return;
    }

    // For text-to-audio books, need generated audio
    if (!hasOnlyAudioChapters && !generatedAudio) {
      toast.error("Please convert text to audio first");
      return;
    }

    setIsSaving(true);
    try {
      let audioUrl: string | null = null;

      // For text-to-audio: upload the generated audio file
      if (generatedAudio) {
        const base64Data = generatedAudio.split(",")[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: "audio/mpeg" });

        const fileName = `${user.id}/${Date.now()}-${bookTitle.replace(/\s+/g, "-").toLowerCase()}.mp3`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("audiobooks")
          .upload(fileName, audioBlob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("audiobooks")
          .getPublicUrl(fileName);
        
        audioUrl = urlData.publicUrl;
      }

      // For audio-only: upload all chapters and use first as preview
      if (hasOnlyAudioChapters && chapters.length > 0) {
        const audioChapters = chapters.filter(ch => (ch as AudioChapter).isAudioChapter);
        
        if (audioChapters.length > 0) {
          // Upload first audio chapter as the preview/main audio
          const firstChapter = audioChapters[0] as AudioChapter;
          if (firstChapter.audioBlob) {
            const fileName = `${user.id}/${Date.now()}-${bookTitle.replace(/\s+/g, "-").toLowerCase()}-ch1.mp3`;
            const { error: uploadError } = await supabase.storage
              .from("audiobooks")
              .upload(fileName, firstChapter.audioBlob);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from("audiobooks")
              .getPublicUrl(fileName);
            
            audioUrl = urlData.publicUrl;
          }
        }
      }

      // Save audiobook metadata
      const { error: insertError } = await supabase
        .from("audiobooks")
        .insert({
          user_id: user.id,
          title: bookTitle,
          author_name: authorName || null,
          description: bookDescription || null,
          audio_url: audioUrl,
          cover_url: generatedCover,
          voice_id: selectedVoice,
          duration: audioDuration,
          language: selectedLanguage,
        });

      if (insertError) throw insertError;

      toast.success("Audiobook saved to your library!");
      
      // Reset form
      setChapters([]);
      setBookTitle("");
      setAuthorName("");
      setBookDescription("");
      setGeneratedAudio(null);
      setGeneratedCover(null);
      setAudioDuration(null);
      setAudioSourceMethod(null);
      setCoverGenerationCount(0);
      setCoverPrompt("");
      setSelectedAudioMethod('');
      
      // Navigate to "My Books" tab
      setActiveTab("books");
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
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
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {currentDraftId ? "Edit Audiobook" : "Create New Audiobook"}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {hasUnsavedChanges && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            Unsaved changes
                          </Badge>
                        )}
                        {currentDraftId && (
                          <Button variant="ghost" size="sm" onClick={handleNewDraft}>
                            <Plus className="w-4 h-4 mr-1" />
                            New
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Book Metadata Section - FIRST */}
                    {/* Language Selection - First thing users choose */}
                    <div className="space-y-4 pb-4 border-b">
                      <h4 className="text-sm font-semibold">🌍 Language</h4>
                      <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGE_OPTIONS.map((lang) => (
                            <SelectItem key={lang.id} value={lang.id}>
                              {lang.name} - {lang.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedLanguage === "isiZulu" && (
                        <p className="text-xs text-muted-foreground">
                          📌 isiZulu books require audio (recorded or MP3). You can upload or record chapters.
                        </p>
                      )}
                      {selectedLanguage === "English" && (
                        <p className="text-xs text-muted-foreground">
                          📌 English books support all methods: write, upload docs, record, or upload MP3. Text can be converted to audio.
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 pb-4 border-b">
                      <h4 className="text-sm font-semibold">📚 Book Details</h4>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Book Title:</label>
                        <Input
                          placeholder="Enter your audiobook title..."
                          value={bookTitle}
                          onChange={(e) => setBookTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Author Name:</label>
                        <Input
                          placeholder="Your name or pen name..."
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description (optional):</label>
                        <Textarea
                          placeholder="Brief description of your audiobook..."
                          value={bookDescription}
                          onChange={(e) => setBookDescription(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>

                    {/* Add Content Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">📖 Add Chapters</h4>
                      
                      {audioSourceMethod && (
                        <div className="border border-amber-300 bg-amber-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-amber-900">
                            🔒 Using {audioSourceMethod === 'record' ? 'Recording' : 'Uploading'} for all chapters
                          </p>
                        </div>
                      )}
                      
                      {/* For Zulu: Audio-only methods */}
                      {selectedLanguage === "isiZulu" && (
                        <div className="space-y-3">
                          {!audioSourceMethod ? (
                            <Select value={selectedAudioMethod} onValueChange={setSelectedAudioMethod}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select audio method..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="record">
                                  <div className="flex items-center">
                                    <Mic className="w-4 h-4 mr-2" />
                                    Record Audio
                                  </div>
                                </SelectItem>
                                <SelectItem value="upload">
                                  <div className="flex items-center">
                                    <Music className="w-4 h-4 mr-2" />
                                    Upload MP3
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : null}

                          {selectedAudioMethod === 'record' && audioSourceMethod !== 'upload' && (
                            <button
                              type="button"
                              onClick={() => setShowRecordModal(true)}
                              className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary hover:bg-muted/50 transition-all flex flex-col items-center justify-center"
                            >
                              <Mic className="w-6 h-6 text-muted-foreground mb-2" />
                              <p className="font-medium text-sm mb-0.5">Record Chapter</p>
                              <p className="text-[12px] text-muted-foreground">
                                Click to start recording
                              </p>
                            </button>
                          )}

                          {selectedAudioMethod === 'upload' && audioSourceMethod !== 'record' && (
                            <button
                              type="button"
                              onClick={() => setShowUploadAudioModal(true)}
                              className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary hover:bg-muted/50 transition-all flex flex-col items-center justify-center"
                            >
                              <Music className="w-6 h-6 text-muted-foreground mb-2" />
                              <p className="font-medium text-sm mb-0.5">Upload Audio</p>
                              <p className="text-[12px] text-muted-foreground">
                                MP3, WAV, or M4A (min 30 seconds)
                              </p>
                            </button>
                          )}
                        </div>
                      )}

                      {/* For English: All methods */}
                      {selectedLanguage === "English" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            {/* Upload File Button */}
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".txt,.pdf,.docx"
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={isUploading}
                                multiple
                              />
                              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary hover:bg-muted/50 transition-all flex flex-col items-center justify-center">
                                {isUploading ? (
                                  <Clock className="w-6 h-6 text-muted-foreground animate-spin mb-2" />
                                ) : (
                                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                                )}
                                <p className="font-medium text-xs mb-0.5">
                                  {isUploading ? "Uploading..." : "Upload"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  PDF, DOCX, TXT
                                </p>
                              </div>
                            </label>

                            {/* Write Chapter Button */}
                            <button
                              type="button"
                              onClick={handleAddEmptyChapter}
                              className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary hover:bg-muted/50 transition-all flex flex-col items-center justify-center"
                            >
                              <FileText className="w-6 h-6 text-muted-foreground mb-2" />
                              <p className="font-medium text-xs mb-0.5">Write</p>
                              <p className="text-[10px] text-muted-foreground">
                                Type directly
                              </p>
                            </button>
                          </div>

                          {/* Audio methods dropdown */}
                          <div className="space-y-3 border-t pt-4">
                            <p className="text-xs font-medium text-muted-foreground">Or add audio:</p>
                            {!audioSourceMethod ? (
                              <Select value={selectedAudioMethod} onValueChange={setSelectedAudioMethod}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select audio method..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="record">
                                    <div className="flex items-center">
                                      <Mic className="w-4 h-4 mr-2" />
                                      Record Audio
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="upload">
                                    <div className="flex items-center">
                                      <Music className="w-4 h-4 mr-2" />
                                      Upload MP3
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : null}

                            {selectedAudioMethod === 'record' && audioSourceMethod !== 'upload' && (
                              <button
                                type="button"
                                onClick={() => setShowRecordModal(true)}
                                className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary hover:bg-muted/50 transition-all flex flex-col items-center justify-center"
                              >
                                <Mic className="w-6 h-6 text-muted-foreground mb-2" />
                                <p className="font-medium text-sm mb-0.5">Record Chapter</p>
                                <p className="text-[12px] text-muted-foreground">
                                  Click to start recording
                                </p>
                              </button>
                            )}

                            {selectedAudioMethod === 'upload' && audioSourceMethod !== 'record' && (
                              <button
                                type="button"
                                onClick={() => setShowUploadAudioModal(true)}
                                className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary hover:bg-muted/50 transition-all flex flex-col items-center justify-center"
                              >
                                <Music className="w-6 h-6 text-muted-foreground mb-2" />
                                <p className="font-medium text-sm mb-0.5">Upload Audio</p>
                                <p className="text-[12px] text-muted-foreground">
                                  MP3, WAV, or M4A (min 30 seconds)
                                </p>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chapter Editor */}
                    <ChapterEditor
                      chapters={chapters}
                      onUpdateChapter={handleUpdateChapter}
                      onDeleteChapter={handleDeleteChapter}
                      onMoveChapter={handleMoveChapter}
                    />

                    {/* Context-aware Add Chapter Button */}
                    {chapters.length > 0 && (
                      <div className="flex gap-2">
                        {selectedLanguage === "isiZulu" ? (
                          <>
                            {audioSourceMethod === 'record' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowRecordModal(true)}
                                className="flex-1"
                              >
                                <Mic className="w-4 h-4 mr-2" />
                                Record Audio Chapter
                              </Button>
                            )}
                            {audioSourceMethod === 'upload' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowUploadAudioModal(true)}
                                className="flex-1"
                              >
                                <Music className="w-4 h-4 mr-2" />
                                Upload Audio Chapter
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddEmptyChapter}
                              className="flex-1"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Text Chapter
                            </Button>
                            {audioSourceMethod === 'record' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowRecordModal(true)}
                                className="flex-1"
                              >
                                <Mic className="w-4 h-4 mr-2" />
                                Record Audio Chapter
                              </Button>
                            )}
                            {audioSourceMethod === 'upload' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowUploadAudioModal(true)}
                                className="flex-1"
                              >
                                <Music className="w-4 h-4 mr-2" />
                                Upload Audio Chapter
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearAllChapters}
                          className="text-destructive hover:text-destructive"
                        >
                          Clear All
                        </Button>
                      </div>
                    )}

                    {/* Stats */}
                    {chapters.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {chapters.length} chapter(s)
                          </span>
                          {hasAnyAudioChapters && (
                            <span className="text-muted-foreground">
                              {chapters.filter(ch => (ch as AudioChapter).isAudioChapter).length} audio
                            </span>
                          )}
                          {textChapters.length > 0 && (
                            <>
                              <span className="text-muted-foreground">
                                {totalWordCount.toLocaleString()} words
                              </span>
                              <span className="text-muted-foreground">
                                {totalCharCount.toLocaleString()}/5000 chars
                              </span>
                            </>
                          )}
                        </div>
                        {textChapters.length > 0 && !allChaptersMeetMinimum && (
                          <div className="flex items-center gap-1 text-destructive text-xs">
                            <AlertCircle className="w-3 h-3" />
                            Some text chapters need more words
                          </div>
                        )}
                      </div>
                    )}

                    {/* Save Draft Button */}
                    {user && (chapters.length > 0 || bookTitle.trim()) && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleSaveDraft}
                        disabled={isSavingDraft || !bookTitle.trim()}
                      >
                        {isSavingDraft ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Saving Draft...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {currentDraftId ? "Update Draft" : "Save Draft"}
                          </>
                        )}
                      </Button>
                    )}

                    {/* Only show voice/convert options for English text chapters */}
                    {selectedLanguage === "English" && !hasOnlyAudioChapters && (
                      <>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">Voice (for TTS):</label>
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
                        </div>

                        <Button
                          variant="hero"
                          className="w-full"
                          onClick={handleConvertToAudio}
                          disabled={isConverting || textChapters.length === 0}
                        >
                          {isConverting ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Converting...
                            </>
                          ) : (
                            <>
                              <Mic2 className="w-4 h-4 mr-2" />
                              Convert Text to Audio
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {/* For audio-only books, show message */}
                    {hasOnlyAudioChapters && chapters.length > 0 && (
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Your audio chapters are ready! Expand "Finish Your Audiobook" to add a cover and publish.
                        </p>
                      </div>
                    )}

                    {generatedAudio && (
                      <div className="space-y-3">
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                          <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Your audiobook is ready! Expand "Finish Your Audiobook" to add a cover and publish.
                          </p>
                        </div>
                        <AudioPlayer audioUrl={generatedAudio} title={bookTitle} compact />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadAudio}
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Audio
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Cover Generator - Collapsible */}
                <Card variant="elevated">
                  <CardHeader className="cursor-pointer" onClick={() => setShowCoverGenerator(!showCoverGenerator)}>
                    <CardTitle className="flex items-center gap-2 justify-between">
                      <span className="flex items-center gap-2">
                        <Image className="w-5 h-5 text-primary" />
                        Finish Your Audiobook
                      </span>
                      <span className="text-xl">{showCoverGenerator ? '−' : '+'}</span>
                    </CardTitle>
                  </CardHeader>
                  
                  {showCoverGenerator && (
                    <CardContent className="space-y-6">
                      {/* Cover Generation Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Image className="w-5 h-5 text-primary" />
                          <h4 className="text-sm font-semibold">Book Cover</h4>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                            {coverGenerationCount}/2 Used
                          </span>
                        </div>
                        
                        {/* Cover Preview with enhanced styling */}
                        <div className="aspect-[3/4] bg-gradient-to-br from-muted via-muted/80 to-muted rounded-2xl flex items-center justify-center border-2 border-dashed border-primary/30 overflow-hidden hover:border-primary/50 transition-colors shadow-lg">
                          {generatedCover ? (
                            <img 
                              src={generatedCover} 
                              alt="Generated book cover" 
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          ) : (
                            <div className="text-center p-8 space-y-3">
                              <div className="relative flex justify-center">
                                <Sparkles className="w-16 h-16 text-primary/40 animate-pulse" />
                              </div>
                              <p className="text-sm font-medium text-muted-foreground">
                                AI will craft your cover
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                Based on your book details
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Auto-populated info box */}
                        <div className="bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/10 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                          <p className="font-medium text-xs text-amber-900 dark:text-amber-200 mb-2">📋 Auto-populated from your details:</p>
                          <div className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
                            <p className="font-semibold">"{bookTitle || 'Your Book Title'}" by {authorName || 'Author Name'}</p>
                            {bookDescription && <p className="line-clamp-2 opacity-80">{bookDescription}</p>}
                          </div>
                        </div>

                        {/* Custom prompt input */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Custom Description (optional)</label>
                          <Input
                            placeholder="Leave empty to use your book details, or describe your custom cover (e.g., 'African sunset with lions')"
                            value={coverPrompt}
                            onChange={(e) => setCoverPrompt(e.target.value)}
                            disabled={coverGenerationCount >= 2}
                            className="text-sm"
                          />
                          {!coverPrompt && (
                            <p className="text-xs text-primary/70 bg-primary/5 p-2 rounded">
                              💡 Tip: Leave empty to auto-use your book details above
                            </p>
                          )}
                        </div>

                        {/* Generation limit indicator */}
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-primary to-primary/60 h-full transition-all"
                            style={{ width: `${(coverGenerationCount / 2) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center font-medium">
                          {coverGenerationCount >= 2 
                            ? "✓ Limit reached - use your generated cover" 
                            : `${2 - coverGenerationCount} generation${2 - coverGenerationCount === 1 ? '' : 's'} remaining`}
                        </p>

                        {/* Generate button */}
                        <Button
                          variant="gold"
                          className="w-full font-semibold"
                          onClick={handleGenerateCover}
                          disabled={isGenerating || coverGenerationCount >= 2}
                          size="lg"
                        >
                          {isGenerating ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Generating Magic...
                            </>
                          ) : coverGenerationCount >= 2 ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Generate Limit Reached
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4 mr-2" />
                              Generate Cover with AI
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Publish to Library Section - Shows after cover is generated or for audio-only books */}
                      {(generatedCover || (hasOnlyAudioChapters && chapters.length > 0)) && (
                        <>
                          <div className="border-t border-primary/10 pt-6 mt-6" />
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-primary" />
                              <h4 className="text-sm font-semibold">Publish to Library</h4>
                            </div>
                            
                            {/* Success state card */}
                            <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-5">
                              <div className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity bg-gradient-to-r from-transparent via-white to-transparent" />
                              <div className="relative space-y-3 text-center">
                                <div className="flex justify-center">
                                  <div className="rounded-full bg-primary/20 p-3">
                                    <CheckCircle2 className="w-8 h-8 text-primary animate-pulse" />
                                  </div>
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-foreground">
                                    🎉 Ready to Launch!
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Your audiobook is polished and ready to share with the world
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Publish button */}
                            <Button
                              variant="default"
                              className="w-full bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/90 hover:to-primary/80 font-semibold shadow-lg hover:shadow-xl transition-all text-base"
                              onClick={handleSaveToLibrary}
                              disabled={isSaving || !user || !bookTitle.trim()}
                              size="lg"
                            >
                              {isSaving ? (
                                <>
                                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                                  Publishing...
                                </>
                              ) : (
                                <>
                                  <BookOpen className="w-4 h-4 mr-2" />
                                  Publish to My Books
                                </>
                              )}
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                              ✨ Your book will appear in "My Books" and be visible to your audience
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>

              </div>
            </TabsContent>

            {/* My Books Tab */}
            <TabsContent value="books">
              {isLoadingBooks ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">Loading your audiobooks...</p>
                </div>
              ) : myAudiobooks.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold mb-2">No audiobooks yet</h3>
                  <p className="text-muted-foreground">Create your first audiobook in the Create tab</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myAudiobooks.map((book) => (
                    <Card key={book.id} className="shadow-card">
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          {book.cover_url ? (
                            <img
                              src={book.cover_url}
                              alt={book.title}
                              className="w-24 h-32 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-24 h-32 bg-muted rounded-lg flex items-center justify-center">
                              <Mic2 className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-display text-xl font-semibold">
                                  {book.title}
                                </h3>
                                <p className="text-muted-foreground">
                                  {book.author_name || "Unknown Author"}
                                </p>
                              </div>
                              <Badge
                                variant="secondary"
                                className={book.is_published 
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                                  : "bg-muted text-muted-foreground"}
                              >
                                {book.is_published ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Published
                                  </>
                                ) : (
                                  "Draft"
                                )}
                              </Badge>
                            </div>

                            {book.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {book.description}
                              </p>
                            )}

                            <div className="flex items-center gap-6 mt-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {book.duration ? `${Math.round(book.duration / 60)} min` : "N/A"}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadDraft(book)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant={book.is_published ? "outline" : "hero"}
                                size="sm"
                                onClick={() => handlePublishToggle(book)}
                                disabled={!book.audio_url}
                              >
                                {book.is_published ? "Unpublish" : "Publish"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAudiobook(book)}
                                className="text-destructive hover:text-destructive"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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

      {/* Record Chapter Modal */}
      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Record New Chapter
            </DialogTitle>
            <DialogDescription>
              Record your chapter audio. Audio chapters don't need text conversion.
            </DialogDescription>
          </DialogHeader>
          <ChapterRecorder
            chapterNumber={chapters.length + 1}
            mode="record"
            onChapterAdded={handleAddAudioChapter}
            onClose={() => setShowRecordModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Upload Audio Modal */}
      <Dialog open={showUploadAudioModal} onOpenChange={setShowUploadAudioModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Upload Audio Chapter
            </DialogTitle>
            <DialogDescription>
              Upload an MP3 or audio file as a chapter. No conversion needed.
            </DialogDescription>
          </DialogHeader>
          <ChapterRecorder
            chapterNumber={chapters.length + 1}
            mode="upload"
            onChapterAdded={handleAddAudioChapter}
            onClose={() => setShowUploadAudioModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Author;
