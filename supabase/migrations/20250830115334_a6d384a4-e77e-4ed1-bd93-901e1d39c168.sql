-- Create payments table for payment status data
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  sector TEXT,
  category TEXT CHECK (category IN ('Permit', 'Processing')),
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (similar to facilities)
CREATE POLICY "Public can read payments" 
ON public.payments 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to insert payments
CREATE POLICY "Authenticated users can insert payments" 
ON public.payments 
FOR INSERT 
TO authenticated
WITH CHECK (true);