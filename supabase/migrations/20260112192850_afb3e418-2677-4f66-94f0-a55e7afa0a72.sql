-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view published audiobooks" ON public.audiobooks;

-- Create a proper policy that only shows published audiobooks OR the user's own audiobooks
CREATE POLICY "View published or own audiobooks" 
ON public.audiobooks 
FOR SELECT 
USING (is_published = true OR auth.uid() = user_id);