
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthError, AuthResponse } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Interface estendida para incluir propriedades adicionais ao User
export interface ExtendedUser extends User {
  name?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: ExtendedUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: AuthError | null;
  refreshUser: () => Promise<void>; // Nova função para atualizar dados do usuário
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Verificar se o usuário é admin usando a função check_user_role
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

  // Função para buscar dados adicionais do perfil do usuário
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        return null;
      }
      
      return profile;
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      return null;
    }
  };

  // Função para enriquecer o objeto de usuário com dados adicionais
  const enrichUserWithProfile = async (baseUser: User): Promise<ExtendedUser> => {
    const profile = await fetchUserProfile(baseUser.id);
    
    const extendedUser: ExtendedUser = {
      ...baseUser,
      name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '',
      avatarUrl: profile?.avatar_url || '',
    };
    
    return extendedUser;
  };

  // Nova função para atualizar dados do usuário
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        const enrichedUser = await enrichUserWithProfile(currentUser);
        setUser(enrichedUser);
        
        const isUserAdmin = await checkAdminRole(currentUser.id);
        setIsAdmin(isUserAdmin);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const enrichedUser = await enrichUserWithProfile(authUser);
          setUser(enrichedUser);
          
          const isUserAdmin = await checkAdminRole(authUser.id);
          setIsAdmin(isUserAdmin);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Erro na inicialização da auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Evento de autenticação:', event);
      
      if (session?.user) {
        const enrichedUser = await enrichUserWithProfile(session.user);
        setUser(enrichedUser);
        
        const isUserAdmin = await checkAdminRole(session.user.id);
        setIsAdmin(isUserAdmin);
      } else {
        setUser(null);
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
      error,
      refreshUser
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
