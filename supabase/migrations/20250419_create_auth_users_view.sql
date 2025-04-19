
-- Função segura para acessar emails dos usuários
CREATE OR REPLACE FUNCTION public.get_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  last_sign_in_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.last_sign_in_at
  FROM auth.users au;
END;
$$;

-- View segura para acessar dados dos usuários de auth
CREATE OR REPLACE VIEW public.auth_users_view AS
SELECT * FROM public.get_auth_users();

-- Permite que usuários autenticados possam acessar a view
GRANT SELECT ON public.auth_users_view TO authenticated;

-- Concede permissões para usar a função RPC
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
