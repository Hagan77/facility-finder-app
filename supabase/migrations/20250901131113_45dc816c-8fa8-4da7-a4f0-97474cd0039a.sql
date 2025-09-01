-- Update payments table RLS policy to allow public read access
-- since the app uses custom localStorage authentication, not Supabase auth

DROP POLICY IF EXISTS "Authenticated users can read payments" ON public.payments;

-- Allow public read access to payments table
CREATE POLICY "Public can read payments" 
ON public.payments 
FOR SELECT 
USING (true);