-- Fix security issue: Restrict payments table access to authenticated users only
-- Drop the current public read policy
DROP POLICY "Public can read payments" ON public.payments;

-- Create new policy that only allows authenticated users to read payments
CREATE POLICY "Authenticated users can read payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (true);

-- Ensure RLS is still enabled (it should be already)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;