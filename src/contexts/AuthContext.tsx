
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, UserRole, Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminRoles, setAdminRoles] = useState<boolean>(false);

  const formatUser = (session: Session | null): User | null => {
    if (!session?.user) return null;
    
    return {
      id: session.user.id,
      name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
      email: session.user.email || '',
      role: session.user.app_metadata?.role || 'user',
      avatarUrl: session.user.user_metadata?.avatar_url,
      createdAt: new Date(session.user.created_at),
    };
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const profileData: Profile = {
          ...data,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at)
        };
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
    }
  };

  const checkAdminRole = async (userId: string) => {
    try {
      console.log("[isAdmin] Verificando papel de admin para usuário:", userId);
      
      // Usar a função RPC is_admin do banco de dados para verificar se o usuário é admin
      const { data, error } = await supabase
        .rpc('is_admin', { 
          user_id: userId 
        });
      
      if (error) {
        console.error('[isAdmin] Erro ao verificar papel de admin via RPC:', error);
        setAdminRoles(false);
        return;
      }
      
      console.log("[isAdmin] Resultado da verificação de admin via is_admin RPC:", data);
      setAdminRoles(!!data);
    } catch (error) {
      console.error('[isAdmin] Erro ao verificar papel de admin:', error);
      setAdminRoles(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      try {
        // Primeiro configurar o listener de autenticação para capturar eventos
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            console.log("Evento de autenticação:", event);
            setSession(currentSession);
            const formattedUser = formatUser(currentSession);
            setUser(formattedUser);
            
            if (currentSession?.user) {
              // Usar setTimeout para evitar deadlock na execução
              setTimeout(() => {
                fetchProfile(currentSession.user.id);
                checkAdminRole(currentSession.user.id);
              }, 0);
            } else {
              setProfile(null);
              setAdminRoles(false);
            }
          }
        );
        
        // Depois verificar se já existe uma sessão ativa
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        const formattedUser = formatUser(currentSession);
        setUser(formattedUser);
        
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
          await checkAdminRole(currentSession.user.id);
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Use useMemo para derivar isAdmin de adminRoles para evitar recálculos desnecessários
  const isAdmin = useMemo(() => {
    console.log("[isAdmin] Verificando isAdmin:", { adminRoles });
    return adminRoles;
  }, [adminRoles]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // onAuthStateChange vai atualizar o estado
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Erro ao realizar login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      // Redirecionamento acontece, então não atualizamos o estado aqui
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Erro ao realizar login com Google');
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // onAuthStateChange vai atualizar o estado
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Erro ao realizar logout');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!session?.user) return;
    
    try {
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
      setSession(refreshedSession);
      setUser(formatUser(refreshedSession));
      
      if (refreshedSession?.user) {
        await fetchProfile(refreshedSession.user.id);
        await checkAdminRole(refreshedSession.user.id);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        login,
        loginWithGoogle,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
