
CREATE OR REPLACE FUNCTION public.get_revenue_by_year(
  _region_id uuid DEFAULT NULL,
  _office_id uuid DEFAULT NULL,
  _sector text DEFAULT NULL
)
RETURNS TABLE(year integer, subtotal double precision)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    EXTRACT(YEAR FROM TO_DATE(payment_date, 'MM/DD/YYYY'))::integer AS year,
    COALESCE(SUM(amount_paid), 0)::double precision AS subtotal
  FROM public.payments
  WHERE (_region_id IS NULL OR region_id = _region_id)
    AND (_office_id IS NULL OR office_id = _office_id)
    AND (_sector IS NULL OR LOWER(sector) = LOWER(_sector))
    AND payment_date IS NOT NULL
    AND payment_date != ''
  GROUP BY EXTRACT(YEAR FROM TO_DATE(payment_date, 'MM/DD/YYYY'))
  ORDER BY year DESC
$$;
