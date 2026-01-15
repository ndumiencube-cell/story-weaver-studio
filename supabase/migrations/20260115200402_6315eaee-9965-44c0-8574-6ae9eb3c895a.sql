-- Add custom voice ID to profiles for storing cloned ElevenLabs voice
ALTER TABLE public.profiles 
ADD COLUMN custom_voice_id TEXT,
ADD COLUMN custom_voice_name TEXT;

-- Create storage bucket for voice samples
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-samples', 'voice-samples', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for voice samples - users can manage their own samples
CREATE POLICY "Users can upload their own voice samples"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own voice samples"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own voice samples"
ON storage.objects FOR DELETE
USING (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);