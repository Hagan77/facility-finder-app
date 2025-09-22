-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can read facilities" ON public.facilities;
DROP POLICY IF EXISTS "Authenticated users can read payments" ON public.payments;

-- Create public read policies for search functionality
CREATE POLICY "Public can read facilities" 
ON public.facilities 
FOR SELECT 
USING (true);

CREATE POLICY "Public can read payments" 
ON public.payments 
FOR SELECT 
USING (true);