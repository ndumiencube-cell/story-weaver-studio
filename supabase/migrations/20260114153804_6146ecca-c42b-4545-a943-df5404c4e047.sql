-- Create ratings table for audiobooks
CREATE TABLE public.audiobook_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audiobook_id UUID NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(audiobook_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.audiobook_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for ratings
CREATE POLICY "Anyone can view ratings"
ON public.audiobook_ratings
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own ratings"
ON public.audiobook_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON public.audiobook_ratings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
ON public.audiobook_ratings
FOR DELETE
USING (auth.uid() = user_id);

-- Add average_rating and rating_count columns to audiobooks
ALTER TABLE public.audiobooks 
ADD COLUMN average_rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN rating_count INTEGER DEFAULT 0,
ADD COLUMN language TEXT DEFAULT 'isiZulu';

-- Create function to update average rating
CREATE OR REPLACE FUNCTION public.update_audiobook_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.audiobooks
    SET 
      average_rating = COALESCE((SELECT AVG(rating)::NUMERIC(2,1) FROM public.audiobook_ratings WHERE audiobook_id = OLD.audiobook_id), 0),
      rating_count = (SELECT COUNT(*) FROM public.audiobook_ratings WHERE audiobook_id = OLD.audiobook_id)
    WHERE id = OLD.audiobook_id;
    RETURN OLD;
  ELSE
    UPDATE public.audiobooks
    SET 
      average_rating = COALESCE((SELECT AVG(rating)::NUMERIC(2,1) FROM public.audiobook_ratings WHERE audiobook_id = NEW.audiobook_id), 0),
      rating_count = (SELECT COUNT(*) FROM public.audiobook_ratings WHERE audiobook_id = NEW.audiobook_id)
    WHERE id = NEW.audiobook_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update average rating
CREATE TRIGGER update_audiobook_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.audiobook_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_audiobook_rating();

-- Create function for users to rate audiobooks
CREATE OR REPLACE FUNCTION public.rate_audiobook(p_audiobook_id UUID, p_rating INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO public.audiobook_ratings (audiobook_id, user_id, rating)
  VALUES (p_audiobook_id, auth.uid(), p_rating)
  ON CONFLICT (audiobook_id, user_id)
  DO UPDATE SET rating = p_rating, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;