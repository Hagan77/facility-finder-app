-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert facilities" ON public.facilities;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON public.payments;

-- Create new policies that allow public inserts
CREATE POLICY "Allow public inserts on facilities" 
ON public.facilities 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Allow public inserts on payments" 
ON public.payments 
FOR INSERT 
TO public
WITH CHECK (true);