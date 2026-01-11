-- Create regions table
CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offices table
CREATE TABLE public.offices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  office_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(region_id, office_name)
);

-- Enable RLS on regions and offices
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

-- Allow public read access to regions and offices (needed for dropdown)
CREATE POLICY "Public can read regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Public can read offices" ON public.offices FOR SELECT USING (true);

-- Add region_id and office_id to facilities table
ALTER TABLE public.facilities 
ADD COLUMN region_id UUID REFERENCES public.regions(id),
ADD COLUMN office_id UUID REFERENCES public.offices(id);

-- Add region_id and office_id to payments table
ALTER TABLE public.payments 
ADD COLUMN region_id UUID REFERENCES public.regions(id),
ADD COLUMN office_id UUID REFERENCES public.offices(id);

-- Insert all Ghana regions
INSERT INTO public.regions (name, code) VALUES
  ('Ashanti', 'AS'),
  ('Greater Accra', 'GA'),
  ('Eastern', 'ER'),
  ('Western', 'WR'),
  ('Western North', 'WN'),
  ('Central', 'CR'),
  ('Volta', 'VR'),
  ('Oti', 'OT'),
  ('Bono', 'BO'),
  ('Bono East', 'BE'),
  ('Ahafo', 'AH'),
  ('Northern', 'NR'),
  ('Savannah', 'SV'),
  ('North East', 'NE'),
  ('Upper East', 'UE'),
  ('Upper West', 'UW');

-- Insert Kumasi Main Office for Ashanti region
INSERT INTO public.offices (region_id, office_name)
SELECT id, 'Kumasi Main Office' FROM public.regions WHERE code = 'AS';

-- Tag all existing facilities as Ashanti/Kumasi
UPDATE public.facilities 
SET region_id = (SELECT id FROM public.regions WHERE code = 'AS'),
    office_id = (SELECT id FROM public.offices WHERE office_name = 'Kumasi Main Office');

-- Tag all existing payments as Ashanti/Kumasi
UPDATE public.payments 
SET region_id = (SELECT id FROM public.regions WHERE code = 'AS'),
    office_id = (SELECT id FROM public.offices WHERE office_name = 'Kumasi Main Office');