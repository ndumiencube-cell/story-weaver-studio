import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Mic, Square, Play, Pause, Trash2, Save, Upload, Music } from "lucide-react";
import { toast } from "sonner";

interface ChapterRecorderProps {
  onChapterAdded: (title: string, audioBlob: Blob, duration: number) => void;
  onClose: () => void;
  chapterNumber: number;
  mode: "record" | "upload";
}

export default function ChapterRecorder({ 
  onChapterAdded, 
  onClose,
  chapterNumber,
  mode
}: ChapterRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chapterTitle, setChapterTitle] = useState(`Chapter ${chapterNumber}`);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

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
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      console.log("Requesting microphone access...");
      
      // Try with standard constraints first, then fall back to basic audio if that fails
      let stream;
      try {
        console.log("Attempting with advanced audio constraints...");
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          } 
        });
        console.log("✅ Got stream with advanced constraints");
      } catch (constraintError) {
        // Fall back to basic audio constraint if advanced constraints fail
        console.warn("Advanced constraints failed, falling back to basic audio:", constraintError);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Got stream with basic audio constraint");
      }
      
      console.log("Stream active:", stream.active);
      console.log("Audio tracks:", stream.getAudioTracks().length);
      
      // Try different mime types for MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") 
        ? "audio/webm" 
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      
      console.log("Using mime type:", mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        console.log("Data available, size:", e.data.size);
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, chunks:", chunksRef.current.length);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        console.log("Blob created, size:", blob.size);
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      console.log("✅ Recording started");
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast.info("Recording started. Read your chapter clearly.");
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      console.error("Error name:", error instanceof DOMException ? error.name : "Not a DOMException");
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      
      let errorMessage = "Microphone access failed. ";
      
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          errorMessage += "Permission was denied. To fix: Look for a microphone icon in your address bar and click 'Allow', or check your browser settings (Settings > Privacy > Microphone > Allow this site).";
        } else if (error.name === "NotFoundError") {
          errorMessage += "No microphone found on this device.";
        } else if (error.name === "SecurityError") {
          errorMessage += "Microphone blocked by browser security. Make sure you're using HTTPS or localhost.";
        } else if (error.name === "NotReadableError") {
          errorMessage += "Microphone is in use by another application. Close other apps using your mic and try again.";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "An unknown error occurred.";
      }
      
      toast.error(errorMessage);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/webm", "audio/m4a", "audio/x-m4a"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|webm|m4a)$/i)) {
      toast.error("Please upload an MP3, WAV, WebM, or M4A file");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 100MB.");
      return;
    }

    setAudioBlob(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setUploadedFileName(file.name);
    setPlaybackTime(0);
    
    // Use filename as chapter title if not already set
    const nameWithoutExt = file.name.replace(/\.(mp3|wav|webm|m4a)$/i, "");
    if (chapterTitle === `Chapter ${chapterNumber}`) {
      setChapterTitle(nameWithoutExt);
    }
    
    toast.success(`Audio file "${file.name}" ready`);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    
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

  const clearAudio = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingDuration(0);
    setPlaybackTime(0);
    setAudioDuration(0);
    setUploadedFileName(null);
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

    if (!audioBlob) {
      toast.error(mode === "record" ? "Please record audio first" : "Please upload an audio file first");
      return;
    }

    onChapterAdded(chapterTitle, audioBlob, audioDuration);
    toast.success("Audio chapter added!");
    onClose();
  };

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

      {/* Recording or Upload Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {mode === "record" ? "Record Chapter Audio" : "Upload Audio File"}
        </Label>
        
        {mode === "record" ? (
          <>
            {/* Recording Controls */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
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

            {/* Permission Note */}
            {!isRecording && !audioUrl && (
              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded space-y-2">
                <p>💡 <strong>Microphone permission needed:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Your browser will ask for microphone access - click <strong>Allow</strong></li>
                  <li>On macOS: Also check System Settings &gt; Privacy &amp; Security &gt; Microphone to allow your browser</li>
                  <li>If you previously denied permission, go to browser Settings &gt; Privacy &gt; Microphone and remove the block</li>
                </ul>
              </div>
            )}

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
          </>
        ) : (
          <>
            {/* Upload Controls */}
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.webm,.m4a"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary hover:bg-muted/50 transition-all">
                <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium text-sm mb-1">
                  Click to upload audio file
                </p>
                <p className="text-xs text-muted-foreground">
                  MP3, WAV, WebM, M4A (max 100MB)
                </p>
              </div>
            </label>
          </>
        )}

        {/* Audio Player */}
        {audioUrl && !isRecording && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-3 border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate flex-1 mr-2">
                {uploadedFileName || `Recording (${formatTime(recordingDuration)})`}
              </span>
              <Button size="icon" variant="ghost" onClick={clearAudio} className="h-7 w-7">
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
              src={audioUrl}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Info Note */}
      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
        Audio chapters are saved directly as audio. No text-to-speech conversion needed.
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSaveChapter} 
          disabled={isRecording || !audioBlob}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          Add Chapter
        </Button>
      </div>
    </div>
  );
}
