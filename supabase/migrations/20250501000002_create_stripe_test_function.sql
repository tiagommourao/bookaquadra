
-- Create function to test Stripe connection
CREATE OR REPLACE FUNCTION public.test_stripe_integration(integration_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  integration RECORD;
BEGIN
  -- Buscar a integração
  SELECT * INTO integration FROM public.integrations_stripe WHERE id = integration_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Integração não encontrada');
  END IF;
  
  -- Em produção, aqui seria feita uma chamada real à API do Stripe
  -- Por enquanto, apenas validamos se os campos obrigatórios estão preenchidos
  IF integration.secret_key IS NULL OR integration.secret_key = '' THEN
    result := json_build_object('success', false, 'message', 'Secret Key não configurada');
  ELSIF integration.publishable_key IS NULL OR integration.publishable_key = '' THEN
    result := json_build_object('success', false, 'message', 'Publishable Key não configurada');
  ELSE
    result := json_build_object('success', true, 'message', 'Conexão testada com sucesso');
  END IF;
  
  -- Atualizar o registro com o resultado do teste
  UPDATE public.integrations_stripe
  SET 
    last_tested_at = now(),
    last_test_success = (result->>'success')::boolean,
    test_result_message = result->>'message'
  WHERE id = integration_id;
  
  RETURN result;
END;
$$;

-- Create trigger for integrations_stripe logs
CREATE OR REPLACE FUNCTION public.log_integrations_stripe_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.integrations_stripe_logs(integration_id, action, details, created_by)
    VALUES (NEW.id, 'create', json_build_object('name', NEW.name, 'environment', NEW.environment), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Registra apenas os campos não sensíveis que foram alterados
    INSERT INTO public.integrations_stripe_logs(integration_id, action, details, created_by)
    VALUES (
      NEW.id, 
      'update', 
      json_build_object(
        'name', CASE WHEN NEW.name <> OLD.name THEN NEW.name ELSE null END,
        'environment', CASE WHEN NEW.environment <> OLD.environment THEN NEW.environment ELSE null END,
        'status', CASE WHEN NEW.status <> OLD.status THEN NEW.status ELSE null END,
        'webhook_url', CASE WHEN NEW.webhook_url <> OLD.webhook_url THEN NEW.webhook_url ELSE null END
      ),
      NEW.updated_by
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.integrations_stripe_logs(integration_id, action, details, created_by)
    VALUES (OLD.id, 'delete', json_build_object('name', OLD.name), auth.uid());
  END IF;
  RETURN NULL;
END;
$$;

-- Create table for stripe logs if it doesn't exist
CREATE TABLE IF NOT EXISTS public.integrations_stripe_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES public.integrations_stripe(id),
  action text NOT NULL,
  details jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create trigger for integrations_stripe
CREATE TRIGGER log_stripe_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.integrations_stripe
  FOR EACH ROW EXECUTE PROCEDURE public.log_integrations_stripe_changes();

-- Add RLS policies to logs
ALTER TABLE public.integrations_stripe_logs ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view stripe logs
CREATE POLICY "Allow admins to view stripe logs" 
  ON public.integrations_stripe_logs FOR SELECT
  TO authenticated
  USING (is_admin());
