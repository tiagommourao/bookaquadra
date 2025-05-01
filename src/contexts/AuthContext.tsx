import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  signOut: () => Promise<void>;
  // Aliases para compatibilidade com código existente
  login: (email: string, password: string) => Promise<{
    success: boolean;
    error: string | null;
  }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState<boolean>(false);

  // Função para mapear o usuário do Supabase para nosso tipo User
  const mapUserToCustomUser = (supabaseUser: any): User | null => {
    if (!supabaseUser) return null;
    
    console.log('Mapeando usuário:', supabaseUser);
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      created_at: supabaseUser.created_at,
      app_metadata: supabaseUser.app_metadata,
      user_metadata: supabaseUser.user_metadata,
      role: null,
      name: supabaseUser.user_metadata?.full_name || '',
      avatarUrl: supabaseUser.user_metadata?.avatar_url || null
    };
  };

  // Função para verificar se o usuário é admin
  const checkUserRole = async (userId: string) => {
    try {
      console.log('Verificando papel do usuário:', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      console.log('Resultado da verificação de papel:', data);
      
      return data?.role === 'admin';
    } catch (error) {
      console.error('Erro ao verificar papel do usuário:', error);
      return false;
    }
  };

  // Função para carregar o perfil do usuário
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Carregando perfil do usuário:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      console.log('Perfil carregado:', data);
      
      return data;
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      return null;
    }
  };

  // Função para atualizar o estado do usuário
  const updateUserState = async (sessionUser: any) => {
    try {
      console.log('Atualizando estado do usuário:', sessionUser);
      
      if (!sessionUser) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsAuthenticated(false);
        setError(null);
        return;
      }

      const customUser = mapUserToCustomUser(sessionUser);
      
      // Carregar dados do usuário em paralelo
      const [userProfile, userIsAdmin] = await Promise.all([
        loadUserProfile(sessionUser.id),
        checkUserRole(sessionUser.id)
      ]);

      setUser(customUser);
      setProfile(userProfile);
      setIsAdmin(userIsAdmin);
      setIsAuthenticated(true);
      setError(null);
      
      console.log('Estado do usuário atualizado:', {
        user: customUser,
        profile: userProfile,
        isAdmin: userIsAdmin
      });
    } catch (error) {
      console.error('Erro ao atualizar estado do usuário:', error);
      setError(error.message);
    }
  };

  // Efeito para verificar autenticação inicial
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (!mounted || sessionChecked) return;

      try {
        console.log('Iniciando verificação de sessão');
        setIsLoading(true);
        setError(null);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Sessão recuperada:', session);
        
        if (sessionError) throw sessionError;

        if (session?.user && mounted) {
          await updateUserState(session.user);
        } else if (mounted) {
          await updateUserState(null);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (mounted) {
          setError(error.message);
          await updateUserState(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setSessionChecked(true);
          console.log('Verificação de sessão concluída');
        }
      }
    };

    // Verificar sessão inicial
    checkSession();

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Evento de autenticação:', event, session);

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            await updateUserState(session.user);
          } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            await updateUserState(null);
          }
        } catch (error) {
          console.error('Erro ao processar mudança de autenticação:', error);
          if (mounted) {
            setError(error.message);
          }
        }
      }
    );

    return () => {
      console.log('Limpando efeito de autenticação');
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [sessionChecked]);

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Iniciando login:', email);
      
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        await updateUserState(data.user);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de cadastro
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Erro ao criar conta:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        error: null,
      };
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      return { success: false, error: error.message };
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      console.log('Iniciando logout');
      setIsLoading(true);
      await supabase.auth.signOut();
      await updateUserState(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue = {
    user,
    profile,
    isAdmin,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    signUp,
    signOut,
    // Aliases para compatibilidade com código existente
    login: signIn,
    logout: signOut,
  };

  console.log('Estado atual do contexto:', contextValue);

  return (
    <AuthContext.Provider value={contextValue}>
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
