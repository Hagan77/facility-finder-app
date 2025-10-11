-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'sector_head', 'user');

-- Create enum for sectors (including all existing sectors)
CREATE TYPE public.sector_type AS ENUM (
  'hospitality',
  'health',
  'mining',
  'infrastructure',
  'education',
  'agriculture',
  'manufacturing',
  'tourism',
  'finance',
  'transportation',
  'energy',
  'chemicals',
  'telecommunication',
  'quarry'
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  sector sector_type,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's sector
CREATE OR REPLACE FUNCTION public.get_user_sector(_user_id UUID)
RETURNS sector_type
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sector
  FROM public.profiles
  WHERE id = _user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Normalize and update existing facilities data to match sector_type enum
UPDATE public.facilities 
SET sector = CASE 
  WHEN UPPER(sector) LIKE '%HOSPITALITY%' THEN 'hospitality'
  WHEN UPPER(sector) LIKE '%HEALTH%' THEN 'health'
  WHEN UPPER(sector) LIKE '%MINING%' OR UPPER(sector) LIKE '%MINES%' THEN 'mining'
  WHEN UPPER(sector) LIKE '%INFRASTRUCTURE%' THEN 'infrastructure'
  WHEN UPPER(sector) LIKE '%AGRICULTURE%' THEN 'agriculture'
  WHEN UPPER(sector) LIKE '%MANUFACTURING%' THEN 'manufacturing'
  WHEN UPPER(sector) = 'ENERGY' THEN 'energy'
  WHEN UPPER(sector) LIKE '%CHEMICAL%' OR UPPER(sector) LIKE '%PESTICIDE%' THEN 'chemicals'
  WHEN UPPER(sector) LIKE '%TELECOM%' THEN 'telecommunication'
  WHEN UPPER(sector) LIKE '%QUARRY%' THEN 'quarry'
  ELSE 'infrastructure'
END
WHERE sector IS NOT NULL;

-- Update facilities table to use sector_type enum
ALTER TABLE public.facilities 
ALTER COLUMN sector TYPE sector_type USING sector::sector_type;

-- RLS Policy for facilities based on sector
CREATE POLICY "Sector heads can view their sector facilities"
ON public.facilities
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  sector::text = public.get_user_sector(auth.uid())::text
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();