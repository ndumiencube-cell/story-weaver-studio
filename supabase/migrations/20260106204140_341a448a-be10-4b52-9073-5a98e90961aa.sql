-- Drop the audio_content column that stores base64 and use storage instead
ALTER TABLE public.audiobooks DROP COLUMN audio_content;
ALTER TABLE public.audiobooks ADD COLUMN audio_url TEXT;

-- Create storage bucket for audiobooks
INSERT INTO storage.buckets (id, name, public) VALUES ('audiobooks', 'audiobooks', true);

-- Storage policies for audiobook files
CREATE POLICY "Public can read audiobook files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audiobooks');

CREATE POLICY "Authenticated users can upload audiobooks"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audiobooks' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their audiobook files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audiobooks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their audiobook files"
ON storage.objects FOR DELETE
USING (bucket_id = 'audiobooks' AND auth.uid()::text = (storage.foldername(name))[1]);