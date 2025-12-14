-- Add UPDATE and DELETE policies for facilities table (for admin use)
CREATE POLICY "Allow public updates on facilities" 
ON public.facilities 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public deletes on facilities" 
ON public.facilities 
FOR DELETE 
USING (true);

-- Add UPDATE and DELETE policies for payments table (for admin use)
CREATE POLICY "Allow public updates on payments" 
ON public.payments 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public deletes on payments" 
ON public.payments 
FOR DELETE 
USING (true);