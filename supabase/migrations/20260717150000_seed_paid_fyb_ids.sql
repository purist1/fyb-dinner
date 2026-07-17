INSERT INTO public.paid_fyb_ids (registration_id, full_name, used)
SELECT 
  'NCO-FYB26-' || lpad(i::text, 3, '0'),
  NULL,
  false
FROM generate_series(1, 100) i
ON CONFLICT (registration_id) DO NOTHING;
