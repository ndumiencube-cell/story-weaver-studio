-- Create chapters table for storing individual chapters of audiobooks
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audiobook_id UUID NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Chapter',
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for chapter ordering
CREATE UNIQUE INDEX chapters_audiobook_number_idx ON public.chapters(audiobook_id, chapter_number);

-- Enable Row Level Security
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Create policies for chapter access
CREATE POLICY "Users can view their own chapters" 
ON public.chapters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chapters" 
ON public.chapters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chapters" 
ON public.chapters 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chapters" 
ON public.chapters 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chapters_updated_at
BEFORE UPDATE ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();