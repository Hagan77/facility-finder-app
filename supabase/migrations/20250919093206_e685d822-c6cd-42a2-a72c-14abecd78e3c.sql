-- Remove the public read policy on payments table
DROP POLICY IF EXISTS "Public can read payments" ON public.payments;

-- Create new policy that only allows authenticated users to read payments
CREATE POLICY "Authenticated users can read payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (true);

-- Update the facilities table to also require authentication for better security
DROP POLICY IF EXISTS "Public can read facilities" ON public.facilities;

CREATE POLICY "Authenticated users can read facilities" 
ON public.facilities 
FOR SELECT 
TO authenticated  
USING (true);