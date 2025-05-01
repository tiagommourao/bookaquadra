
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
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

  // Função para mapear o usuário do Supabase para nosso tipo User
  const mapUserToCustomUser = (supabaseUser: any): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      created_at: supabaseUser.created_at,
      app_metadata: supabaseUser.app_metadata,
      user_metadata: supabaseUser.user_metadata,
      role: null, // Será definido posteriormente
      // Adicionado para compatibilidade com o código existente
      name: supabaseUser.user_metadata?.full_name || '',
      avatarUrl: supabaseUser.user_metadata?.avatar_url || null
    };
  };

  // Função para verificar se o usuário é admin
  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar papel do usuário:', error);
        return false;
      }

      return data?.role === 'admin';
    } catch (error) {
      console.error('Erro ao verificar papel do usuário:', error);
      return false;
    }
  };

  // Função para carregar o perfil do usuário
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil do usuário:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      return null;
    }
  };

  // Efeito para verificar autenticação inicial
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const customUser = mapUserToCustomUser(session.user);
          setUser(customUser);
          setIsAuthenticated(true);

          // Carregar perfil e verificar papel
          const userProfile = await loadUserProfile(session.user.id);
          setProfile(userProfile);

          const userIsAdmin = await checkUserRole(session.user.id);
          setIsAdmin(userIsAdmin);
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const customUser = mapUserToCustomUser(session.user);
          setUser(customUser);
          setIsAuthenticated(true);

          // Carregar perfil e verificar papel
          const userProfile = await loadUserProfile(session.user.id);
          setProfile(userProfile);

          const userIsAdmin = await checkUserRole(session.user.id);
          setIsAdmin(userIsAdmin);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setIsAuthenticated(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro ao fazer login:', error);
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const customUser = mapUserToCustomUser(data.user);
        setUser(customUser);
        setIsAuthenticated(true);

        // Carregar perfil e verificar papel
        const userProfile = await loadUserProfile(data.user.id);
        setProfile(userProfile);

        const userIsAdmin = await checkUserRole(data.user.id);
        setIsAdmin(userIsAdmin);
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      return { success: false, error: error.message };
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
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isLoading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        // Aliases para compatibilidade com código existente
        login: signIn,
        logout: signOut,
      }}
    >
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
