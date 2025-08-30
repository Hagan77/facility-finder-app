-- Allow authenticated users to insert facilities
CREATE POLICY "Authenticated users can insert facilities" 
ON public.facilities 
FOR INSERT 
TO authenticated
WITH CHECK (true);