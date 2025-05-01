
-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'BookaQuadra',
  logo text DEFAULT '',
  primary_color text DEFAULT '#06b6d4',
  secondary_color text DEFAULT '#0891b2',
  contact_email text DEFAULT '',
  contact_phone text DEFAULT '',
  cancellation_policy text DEFAULT '',
  mercado_pago_key text DEFAULT '',
  google_calendar_integration boolean DEFAULT false,
  payment_method jsonb DEFAULT null,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view site settings
CREATE POLICY "Allow admins to view site settings" 
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (is_admin());

-- Only allow admins to modify site settings
CREATE POLICY "Allow admins to modify site settings" 
  ON public.site_settings FOR ALL
  TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Add trigger to update updated_at
CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- Insert initial site settings record if none exists
INSERT INTO public.site_settings (
  company_name,
  logo,
  primary_color,
  secondary_color,
  contact_email,
  contact_phone,
  cancellation_policy,
  mercado_pago_key,
  google_calendar_integration,
  payment_method
)
SELECT
  'BookaQuadra',
  '',
  '#06b6d4',
  '#0891b2',
  '',
  '',
  '',
  '',
  false,
  '{"default": "mercadopago", "mercadopago": {"enabled": false, "environment": "sandbox"}, "stripe": {"enabled": false, "environment": "test"}}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_settings LIMIT 1
);
