-- Add is_published column to audiobooks table
ALTER TABLE public.audiobooks 
ADD COLUMN is_published boolean NOT NULL DEFAULT false;