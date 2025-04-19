
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthError, AuthResponse } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: AuthError | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Verificar se o usuário é admin usando a nova função check_user_role
  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error: roleError } = await supabase.rpc('check_user_role', {
        user_id: userId
      });
      
      if (roleError) {
        console.error('Erro ao verificar role:', roleError);
        return false;
      }
      
      return data === 'admin';
    } catch (err) {
      console.error('Erro ao verificar admin:', err);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const isUserAdmin = await checkAdminRole(user.id);
          setIsAdmin(isUserAdmin);
        }
      } catch (error) {
        console.error('Erro na inicialização da auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Evento de autenticação:', event);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const isUserAdmin = await checkAdminRole(session.user.id);
        setIsAdmin(isUserAdmin);
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    });

    initAuth();
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error }: AuthResponse = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error);
        toast.error('Erro ao fazer login: ' + error.message);
      } else {
        setError(null);
        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      toast.error('Ocorreu um erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      navigate('/login');
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin,
      isLoading,
      login,
      logout,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
