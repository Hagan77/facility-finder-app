INSERT INTO public.offices (region_id, office_name)
SELECT id, 'Wa Main Office' FROM public.regions WHERE code='UW'
ON CONFLICT DO NOTHING;