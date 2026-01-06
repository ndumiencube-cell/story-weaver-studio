-- Create audiobooks table for storing generated audiobooks
CREATE TABLE public.audiobooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author_name TEXT,
  description TEXT,
  cover_url TEXT,
  audio_content TEXT NOT NULL, -- Base64 encoded audio
  voice_id TEXT NOT NULL,
  duration INTEGER, -- Duration in seconds (estimated)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audiobooks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own audiobooks" 
ON public.audiobooks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audiobooks" 
ON public.audiobooks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audiobooks" 
ON public.audiobooks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audiobooks" 
ON public.audiobooks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Public can view published audiobooks (for the library)
CREATE POLICY "Anyone can view published audiobooks"
ON public.audiobooks
FOR SELECT
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_audiobooks_updated_at
BEFORE UPDATE ON public.audiobooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();