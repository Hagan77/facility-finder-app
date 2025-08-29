-- Add file_location_id column to facilities table
ALTER TABLE public.facilities 
ADD COLUMN file_location_id text;