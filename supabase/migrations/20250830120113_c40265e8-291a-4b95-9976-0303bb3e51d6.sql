-- Drop the existing constraint and create a new one that allows both Permit and Processing
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_category_check;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_category_check 
CHECK (category IN ('Permit', 'Processing'));

-- Insert sample payment data
INSERT INTO public.payments (name, location, sector, category, amount_paid, payment_date)
VALUES ('hagan', 'kumasi', 'mining', 'Processing', 10000, '2024-11-01');