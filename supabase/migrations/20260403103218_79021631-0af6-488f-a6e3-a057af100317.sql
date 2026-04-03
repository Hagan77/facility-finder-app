
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
    EXTRACT(YEAR FROM 
      CASE 
        WHEN payment_date ~ '^\d{4}-\d{2}-\d{2}' THEN payment_date::date
        WHEN payment_date ~ '^\d{1,2}/\d{1,2}/\d{4}' THEN TO_DATE(payment_date, 'MM/DD/YYYY')
        ELSE NULL
      END
    )::integer AS year,
    COALESCE(SUM(amount_paid), 0)::double precision AS subtotal
  FROM public.payments
  WHERE (_region_id IS NULL OR region_id = _region_id)
    AND (_office_id IS NULL OR office_id = _office_id)
    AND (_sector IS NULL OR LOWER(sector) = LOWER(_sector))
    AND payment_date IS NOT NULL
    AND payment_date != ''
    AND (payment_date ~ '^\d{4}-\d{2}-\d{2}' OR payment_date ~ '^\d{1,2}/\d{1,2}/\d{4}')
  GROUP BY year
  ORDER BY year DESC
$$;
