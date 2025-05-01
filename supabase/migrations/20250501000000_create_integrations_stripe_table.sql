
-- Create integrations_stripe table
CREATE TABLE IF NOT EXISTS public.integrations_stripe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Principal',
  environment text NOT NULL DEFAULT 'test',
  publishable_key text,
  secret_key text,
  webhook_secret text,
  webhook_url text,
  status text NOT NULL DEFAULT 'inactive',
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_tested_at timestamp with time zone,
  last_test_success boolean,
  test_result_message text
);

-- Add RLS policies
ALTER TABLE public.integrations_stripe ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view stripe integrations
CREATE POLICY "Allow admins to view stripe integrations" 
  ON public.integrations_stripe FOR SELECT
  TO authenticated
  USING (is_admin());

-- Only allow admins to create/update/delete stripe integrations
CREATE POLICY "Allow admins to modify stripe integrations" 
  ON public.integrations_stripe FOR ALL
  TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Add trigger to update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.integrations_stripe
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();
