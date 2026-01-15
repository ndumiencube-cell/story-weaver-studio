import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Play, Pause, Upload, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onVoiceCloned: (voiceId: string, voiceName: string) => void;
  existingVoiceId?: string | null;
  existingVoiceName?: string | null;
}

export default function VoiceRecorder({ 
  onVoiceCloned, 
  existingVoiceId,
  existingVoiceName 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const MIN_DURATION = 30; // Minimum 30 seconds recommended
  const MAX_DURATION = 180; // Maximum 3 minutes

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
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
        setRecordingDuration(prev => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      toast.info("Recording started. Speak clearly in your natural voice.");
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

  const playRecording = () => {
    if (recordedUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
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

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 50MB.");
      return;
    }

    setUploadedFile(file);
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(URL.createObjectURL(file));
    toast.success(`File "${file.name}" ready for upload`);
  };

  const clearRecording = () => {
    setRecordedBlob(null);
    setUploadedFile(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordingDuration(0);
  };

  const handleCloneVoice = async () => {
    const audioSource = uploadedFile || recordedBlob;
    if (!audioSource) {
      toast.error("Please record or upload audio first");
      return;
    }

    if (!voiceName.trim()) {
      toast.error("Please enter a name for your voice");
      return;
    }

    if (!uploadedFile && recordingDuration < MIN_DURATION) {
      toast.error(`Recording too short. Please record at least ${MIN_DURATION} seconds for best quality.`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      
      // Convert webm to proper format if needed
      if (uploadedFile) {
        formData.append("audio", uploadedFile, uploadedFile.name);
      } else if (recordedBlob) {
        formData.append("audio", recordedBlob, "recording.webm");
      }
      
      formData.append("name", voiceName);
      formData.append("description", "Custom Zulu voice for audiobook narration");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clone-voice`,
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
        throw new Error(data.error || "Failed to clone voice");
      }

      onVoiceCloned(data.voiceId, data.voiceName);
      toast.success("Voice cloned successfully! You can now use it for your audiobooks.");
      clearRecording();
      setVoiceName("");
    } catch (error) {
      console.error("Voice cloning error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to clone voice");
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.min((recordingDuration / MIN_DURATION) * 100, 100);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic className="w-5 h-5 text-primary" />
            Clone Your Voice
          </CardTitle>
          {existingVoiceId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {existingVoiceName || "Custom Voice"}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Record your voice reading Zulu text for authentic pronunciation
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Name Input */}
        <div className="space-y-2">
          <Label htmlFor="voiceName">Voice Name</Label>
          <Input
            id="voiceName"
            placeholder="e.g., My Zulu Voice"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            disabled={isRecording || isUploading}
          />
        </div>

        {/* Recording Controls */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isUploading}
                variant="default"
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

            <span className="text-sm text-muted-foreground">or</span>

            <label className="flex-1">
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.webm,.m4a"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isRecording || isUploading}
              />
              <Button
                variant="outline"
                className="w-full"
                asChild
                disabled={isRecording || isUploading}
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Audio
                </span>
              </Button>
            </label>
          </div>

          {/* Recording Progress */}
          {isRecording && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Recording...
                </span>
                <span className="font-mono">{formatTime(recordingDuration)}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {recordingDuration < MIN_DURATION
                  ? `Record at least ${MIN_DURATION} seconds for best quality`
                  : "Good recording length!"}
              </p>
            </div>
          )}

          {/* Recorded/Uploaded Audio Preview */}
          {recordedUrl && !isRecording && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {uploadedFile ? uploadedFile.name : `Recording (${formatTime(recordingDuration)})`}
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={playRecording}>
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearRecording}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <audio
                ref={audioRef}
                src={recordedUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          )}

          {/* Tips */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <p><strong>Recording Tips for Best Quality:</strong></p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Record in a quiet environment</li>
                  <li>Speak clearly at a natural pace</li>
                  <li>Read a sample of Zulu text (30-60 seconds)</li>
                  <li>Keep consistent distance from microphone</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Clone Button */}
          <Button
            onClick={handleCloneVoice}
            disabled={(!recordedBlob && !uploadedFile) || !voiceName.trim() || isUploading || isRecording}
            className="w-full"
          >
            {isUploading ? (
              <>
                <span className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Cloning Voice...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Clone My Voice
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
