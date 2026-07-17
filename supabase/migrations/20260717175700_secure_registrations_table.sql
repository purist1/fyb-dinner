-- Secure registrations table from general public listing, only allowing targeted lookup via a secure RPC function

-- 1. Drop the permissive public select policy
DROP POLICY IF EXISTS "registrations public read" ON public.registrations;

-- 2. Add an admin-only SELECT policy
CREATE POLICY "registrations admin read" ON public.registrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Create get_ticket_by_code RPC function to fetch a single ticket by its random code
CREATE OR REPLACE FUNCTION public.get_ticket_by_code(p_ticket_code text)
RETURNS TABLE (
  ticket_code text,
  attendee_type text,
  full_name text,
  email text,
  department text,
  course text,
  passport_url text,
  payment_status text,
  payment_amount integer,
  checked_in boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ticket_code, attendee_type, full_name, email, department, course, passport_url, payment_status, payment_amount, checked_in
  FROM public.registrations
  WHERE ticket_code = p_ticket_code
  LIMIT 1;
$$;

-- 4. Grant execution permission on function to public/anon
GRANT EXECUTE ON FUNCTION public.get_ticket_by_code(text) TO anon, authenticated;
