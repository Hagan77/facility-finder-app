
CREATE OR REPLACE FUNCTION public.get_total_revenue(
  _region_id uuid DEFAULT NULL,
  _office_id uuid DEFAULT NULL,
  _sector text DEFAULT NULL
)
RETURNS double precision
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(amount_paid), 0)::double precision
  FROM public.payments
  WHERE (_region_id IS NULL OR region_id = _region_id)
    AND (_office_id IS NULL OR office_id = _office_id)
    AND (_sector IS NULL OR LOWER(sector) = LOWER(_sector))
$$;
