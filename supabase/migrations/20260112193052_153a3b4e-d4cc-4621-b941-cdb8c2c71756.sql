-- Add play_count column to audiobooks
ALTER TABLE public.audiobooks ADD COLUMN play_count integer NOT NULL DEFAULT 0;

-- Create a function to increment play count that can be called by anyone for published audiobooks
CREATE OR REPLACE FUNCTION public.increment_play_count(audiobook_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.audiobooks
  SET play_count = play_count + 1
  WHERE id = audiobook_id AND is_published = true;
END;
$$;