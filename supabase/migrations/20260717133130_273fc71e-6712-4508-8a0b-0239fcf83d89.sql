
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.paid_fyb_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id TEXT NOT NULL UNIQUE,
  full_name TEXT,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paid_fyb_ids TO authenticated;
GRANT SELECT ON public.paid_fyb_ids TO anon;
GRANT ALL ON public.paid_fyb_ids TO service_role;
ALTER TABLE public.paid_fyb_ids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paid_fyb_ids public lookup" ON public.paid_fyb_ids FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "paid_fyb_ids admin manage" ON public.paid_fyb_ids FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code TEXT NOT NULL UNIQUE DEFAULT ('NIFES-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  attendee_type TEXT NOT NULL CHECK (attendee_type IN ('fyb','guest')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male','female')),
  whatsapp TEXT,
  department TEXT,
  course TEXT,
  fyb_registration_id TEXT REFERENCES public.paid_fyb_ids(registration_id),
  passport_url TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','free')),
  payment_reference TEXT,
  payment_amount INTEGER,
  checked_in BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX registrations_ticket_idx ON public.registrations (ticket_code);
CREATE INDEX registrations_email_idx ON public.registrations (email);
CREATE INDEX registrations_type_idx ON public.registrations (attendee_type);
GRANT SELECT, INSERT, UPDATE ON public.registrations TO authenticated;
GRANT SELECT, INSERT ON public.registrations TO anon;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registrations public insert" ON public.registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "registrations public read" ON public.registrations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "registrations admin update" ON public.registrations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "registrations admin delete" ON public.registrations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER registrations_updated_at BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.event_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_settings TO authenticated;
GRANT ALL ON public.event_settings TO service_role;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.event_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.event_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.event_settings (key, value) VALUES
  ('venue', 'To Be Announced'),
  ('event_date', '2026-08-26T15:00:00+01:00'),
  ('fyb_price_naira', '7000'),
  ('guest_price_naira', '5000');

CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery TO authenticated;
GRANT ALL ON public.gallery TO service_role;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery public read" ON public.gallery FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "gallery admin write" ON public.gallery FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage policies
CREATE POLICY "passports upload" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'passports');
CREATE POLICY "passports read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'passports');
CREATE POLICY "gallery read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gallery');
CREATE POLICY "gallery admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "gallery admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "gallery admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
