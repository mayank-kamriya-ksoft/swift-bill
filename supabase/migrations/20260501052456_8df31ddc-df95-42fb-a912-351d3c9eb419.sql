
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX products_name_trgm_idx ON public.products USING gin (lower(name) gin_trgm_ops);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products readable by everyone"
ON public.products FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.is_admin_request()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provided TEXT;
  expected TEXT := 'schin-admin-2026';
BEGIN
  BEGIN
    provided := current_setting('request.headers', true)::json->>'x-admin-pin';
  EXCEPTION WHEN others THEN
    provided := NULL;
  END;
  RETURN provided IS NOT NULL AND provided = expected;
END;
$$;

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT WITH CHECK (public.is_admin_request());

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE USING (public.is_admin_request()) WITH CHECK (public.is_admin_request());

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE USING (public.is_admin_request());

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.products (name, unit, price, stock) VALUES
  ('Asian Apex Ultima 1L', 'L', 650, 25),
  ('Asian Apex Ultima 4L', 'L', 2400, 12),
  ('Asian Apex Ultima 10L', 'L', 5800, 6),
  ('Berger Silk 1L', 'L', 420, 30),
  ('Berger Silk 4L', 'L', 1550, 18),
  ('Nerolac Impressions 1L', 'L', 480, 20),
  ('Wall Putty 5kg', 'kg', 320, 40),
  ('Wall Putty 20kg', 'kg', 1150, 15),
  ('Primer 1L', 'L', 280, 22),
  ('Primer 4L', 'L', 990, 10),
  ('Paint Brush 2"', 'pcs', 60, 100),
  ('Paint Brush 4"', 'pcs', 110, 80),
  ('Paint Roller 9"', 'pcs', 180, 50),
  ('Sandpaper Sheet', 'pcs', 15, 300),
  ('Masking Tape 1"', 'pcs', 70, 60),
  ('Turpentine 1L', 'L', 180, 25),
  ('Thinner 1L', 'L', 160, 30),
  ('Enamel White 1L', 'L', 420, 18),
  ('Enamel Black 1L', 'L', 420, 14),
  ('Distemper 5kg', 'kg', 380, 25);
