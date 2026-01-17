-- Add audio support to chapters table for mixed media books
ALTER TABLE public.chapters
ADD COLUMN is_audio_chapter BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN audio_url TEXT,
ADD COLUMN audio_duration INTEGER;

-- Add index for faster queries on audio chapters
CREATE INDEX chapters_audio_idx ON public.chapters(audiobook_id, is_audio_chapter);

-- Add comment explaining the new fields
COMMENT ON COLUMN public.chapters.is_audio_chapter IS 'Indicates if this chapter is an audio chapter (true) or text chapter (false)';
COMMENT ON COLUMN public.chapters.audio_url IS 'URL to the audio file if this is an audio chapter';
COMMENT ON COLUMN public.chapters.audio_duration IS 'Duration of audio in seconds if this is an audio chapter';

-- Update function to handle audio chapters in save operations
-- Note: Audio chapters can exist alongside text chapters, but it is recommended to keep them separate
