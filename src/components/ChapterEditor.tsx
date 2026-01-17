import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  chapterNumber: number;
  isAudioChapter?: boolean;
  audioUrl?: string;
  audioDuration?: number;
}

interface ChapterEditorProps {
  chapters: Chapter[];
  onUpdateChapter: (id: string, updates: Partial<Chapter>) => void;
  onDeleteChapter: (id: string) => void;
  onMoveChapter: (id: string, direction: "up" | "down") => void;
  minWordCount?: number;
}

const MINIMUM_WORD_COUNT = 100;

const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export default function ChapterEditor({
  chapters,
  onUpdateChapter,
  onDeleteChapter,
  onMoveChapter,
  minWordCount = MINIMUM_WORD_COUNT,
}: ChapterEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const startEditing = (chapter: Chapter) => {
    setEditingId(chapter.id);
    setEditTitle(chapter.title);
    setEditContent(chapter.content);
    setExpandedId(chapter.id);
  };

  const saveEdit = (id: string) => {
    const wordCount = countWords(editContent);
    onUpdateChapter(id, {
      title: editTitle,
      content: editContent,
      wordCount,
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (chapters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          Chapters ({chapters.length})
        </h4>
        <Badge variant="outline" className="text-xs">
          Min {minWordCount} words per chapter
        </Badge>
      </div>

      {chapters.map((chapter, index) => {
        const isEditing = editingId === chapter.id;
        const isExpanded = expandedId === chapter.id;
        const isAudio = chapter.isAudioChapter || false;
        const meetsMinimum = isAudio ? (chapter.audioDuration || 0) >= 30 : chapter.wordCount >= minWordCount;
        const currentWordCount = isEditing ? countWords(editContent) : chapter.wordCount;
        const currentMeetsMinimum = isAudio ? (chapter.audioDuration || 0) >= 30 : currentWordCount >= minWordCount;
        
        const formatDuration = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins}:${secs.toString().padStart(2, "0")}`;
        };

        return (
          <Card
            key={chapter.id}
            className={cn(
              "transition-all",
              !meetsMinimum && !isEditing && "border-destructive/50 bg-destructive/5"
            )}
          >
            <CardContent className="p-4">
              {isAudio ? (
                // Audio chapter - read only with delete/replace option
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          Ch. {chapter.chapterNumber}
                        </span>
                        <h5 className="font-medium text-foreground truncate">
                          {chapter.title}
                        </h5>
                        <Badge variant="secondary" className="text-xs">
                          🎵 Audio
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {meetsMinimum ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-destructive" />
                        )}
                        <span className={cn(
                          "text-xs",
                          meetsMinimum ? "text-muted-foreground" : "text-destructive"
                        )}>
                          {formatDuration(chapter.audioDuration || 0)} / 0:30 min
                        </span>
                      </div>
                      {chapter.audioUrl && (
                        <div className="mt-2">
                          <audio 
                            src={chapter.audioUrl} 
                            controls 
                            className="h-8 max-w-xs"
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => onDeleteChapter(chapter.id)}
                      title="Delete this audio chapter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : isEditing ? (
                // Text chapter edit
                <div className="space-y-3">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Chapter title..."
                    className="font-medium"
                  />
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Chapter content..."
                    className="min-h-[200px] text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {currentMeetsMinimum ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className={cn(
                        "text-xs",
                        currentMeetsMinimum ? "text-green-600" : "text-destructive"
                      )}>
                        {currentWordCount} / {minWordCount} words
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEdit}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => saveEdit(chapter.id)}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Text chapter view
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => onMoveChapter(chapter.id, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => onMoveChapter(chapter.id, "down")}
                        disabled={index === chapters.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>

                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleExpand(chapter.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          Ch. {chapter.chapterNumber}
                        </span>
                        <h5 className="font-medium text-foreground truncate">
                          {chapter.title}
                        </h5>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          {meetsMinimum ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-destructive" />
                          )}
                          <span className={cn(
                            "text-xs",
                            meetsMinimum ? "text-muted-foreground" : "text-destructive"
                          )}>
                            {chapter.wordCount} words
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => startEditing(chapter)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => onDeleteChapter(chapter.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                        {chapter.content}
                      </p>
                      {chapter.content.length > 500 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto mt-1"
                          onClick={() => startEditing(chapter)}
                        >
                          View full content
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { countWords, MINIMUM_WORD_COUNT };
