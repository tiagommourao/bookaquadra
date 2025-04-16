
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro na autenticação:', error);
        setError(error.message);
        toast.error('Erro na autenticação');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      if (data?.session) {
        try {
          // Verificar se o usuário já completou o onboarding
          const { data: userPrefs, error: prefsError } = await supabase
            .from('user_preferences')
            .select('onboarding_completed')
            .eq('user_id', data.session.user.id)
            .single();
          
          if (prefsError && prefsError.code !== 'PGRST116') { // PGRST116 = not found
            throw prefsError;
          }
          
          // Se não tem preferências ou onboarding não concluído, redirecionar para onboarding
          if (!userPrefs || !userPrefs.onboarding_completed) {
            // Verificar se o perfil do usuário já existe
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', data.session.user.id)
              .single();
              
            if (profileError && profileError.code !== 'PGRST116') {
              throw profileError;
            }
            
            // Se não existe perfil, criar um básico
            if (!profileData) {
              await supabase.from('profiles').insert({
                id: data.session.user.id,
                first_name: data.session.user.user_metadata?.full_name?.split(' ')?.[0] || '',
                last_name: data.session.user.user_metadata?.full_name?.split(' ')?.[1] || '',
                avatar_url: data.session.user.user_metadata?.avatar_url || '',
                is_active: true,
                credit_balance: 0,
                profile_progress: 20
              });
            }
            
            // Redirecionar para o onboarding
            navigate('/onboarding');
          } else {
            // Se já completou o onboarding, redirecionar para a página inicial
            navigate('/');
          }
        } catch (error) {
          console.error('Erro ao verificar status do usuário:', error);
          navigate('/');
        }
      } else {
        // Não há sessão ativa
        navigate('/login');
      }
    };
    
    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <div className="text-red-500">
            <p className="text-lg font-medium">Erro na autenticação</p>
            <p className="mt-2">{error}</p>
            <p className="mt-4">Redirecionando para página de login...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">Autenticando...</h1>
            <p className="text-gray-600">Estamos verificando sua conta</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
