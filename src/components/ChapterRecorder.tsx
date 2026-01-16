import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Mic, Square, Play, Pause, Trash2, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { countWords, MINIMUM_WORD_COUNT } from "./ChapterEditor";

interface ChapterRecorderProps {
  onChapterAdded: (title: string, content: string, audioBlob?: Blob) => void;
  onClose: () => void;
  chapterNumber: number;
}

export default function ChapterRecorder({ 
  onChapterAdded, 
  onClose,
  chapterNumber
}: ChapterRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chapterTitle, setChapterTitle] = useState(`Chapter ${chapterNumber}`);
  const [transcribedText, setTranscribedText] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const MIN_WORD_COUNT = MINIMUM_WORD_COUNT;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  // Audio playback tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setPlaybackTime(audio.currentTime);
    const handleLoadedMetadata = () => setAudioDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [recordedUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast.info("Recording started. Read your chapter content clearly.");
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !recordedUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setPlaybackTime(value[0]);
    }
  };

  const clearRecording = () => {
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordingDuration(0);
    setPlaybackTime(0);
    setAudioDuration(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSaveChapter = () => {
    if (!chapterTitle.trim()) {
      toast.error("Please enter a chapter title");
      return;
    }

    if (!transcribedText.trim() && !recordedBlob) {
      toast.error("Please record audio or enter chapter content");
      return;
    }

    const wordCount = countWords(transcribedText);
    if (transcribedText.trim() && wordCount < MIN_WORD_COUNT) {
      toast.error(`Chapter needs at least ${MIN_WORD_COUNT} words (currently ${wordCount})`);
      return;
    }

    onChapterAdded(chapterTitle, transcribedText, recordedBlob || undefined);
    toast.success("Chapter added successfully!");
    onClose();
  };

  const wordCount = countWords(transcribedText);
  const meetsMinimum = wordCount >= MIN_WORD_COUNT;

  return (
    <div className="space-y-4">
      {/* Chapter Title */}
      <div className="space-y-1.5">
        <Label htmlFor="chapterTitle" className="text-sm font-medium">Chapter Title</Label>
        <Input
          id="chapterTitle"
          placeholder="Enter chapter title..."
          value={chapterTitle}
          onChange={(e) => setChapterTitle(e.target.value)}
          disabled={isRecording}
        />
      </div>

      {/* Recording Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Record Chapter Audio</Label>
        
        {/* Recording Controls */}
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={isTranscribing}
              className="flex-1"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        {/* Recording Progress */}
        {isRecording && (
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                Recording...
              </span>
              <span className="font-mono text-sm">{formatTime(recordingDuration)}</span>
            </div>
          </div>
        )}

        {/* Audio Player */}
        {recordedUrl && !isRecording && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-3 border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Recording ({formatTime(recordingDuration)})
              </span>
              <Button size="icon" variant="ghost" onClick={clearRecording} className="h-7 w-7">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            
            {/* Playback Controls */}
            <div className="flex items-center gap-3">
              <Button 
                size="icon" 
                variant="outline" 
                onClick={togglePlayback}
                className="h-9 w-9 shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <div className="flex-1 space-y-1">
                <Slider
                  value={[playbackTime]}
                  max={audioDuration || 1}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>{formatTime(playbackTime)}</span>
                  <span>{formatTime(audioDuration)}</span>
                </div>
              </div>
            </div>
            
            <audio
              ref={audioRef}
              src={recordedUrl}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="chapterContent" className="text-sm font-medium">
            Chapter Text Content
          </Label>
          <div className="flex items-center gap-1.5">
            {transcribedText.trim() && (
              meetsMinimum ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              )
            )}
            <span className={`text-xs ${meetsMinimum ? "text-muted-foreground" : "text-destructive"}`}>
              {wordCount} / {MIN_WORD_COUNT} words
            </span>
          </div>
        </div>
        <Textarea
          id="chapterContent"
          placeholder="Enter or paste your chapter content here. This text will be used for the audiobook conversion..."
          value={transcribedText}
          onChange={(e) => setTranscribedText(e.target.value)}
          className="min-h-[200px]"
          disabled={isRecording}
        />
        <p className="text-xs text-muted-foreground">
          The text content is required for audiobook conversion. The recording is optional and can be used for reference.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSaveChapter} 
          disabled={isRecording || isTranscribing}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          Add Chapter
        </Button>
      </div>
    </div>
  );
}