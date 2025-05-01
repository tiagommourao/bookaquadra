import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, Profile } from '@/types';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean; // Adicionada propriedade faltante
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: 'google' | 'facebook') => Promise<void>;
  logout: () => Promise<void>; // Adicionada propriedade faltante
  register: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  isAuthenticated: false, // Adicionada propriedade faltante
  login: async () => {},
  loginWithProvider: async () => {},
  logout: async () => {}, // Adicionada propriedade faltante
  register: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  uploadAvatar: async () => null,
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);

  // Adicionada propriedade isAuthenticated baseada no estado existente
  const isAuthenticated = !!user;

  useEffect(() => {
    const getSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          setUser(session.user);
          await fetchProfile(session.user.id);
          await checkAdminRole(session.user.id);
        }
      } catch (error) {
        console.error("Erro ao obter sessão:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        await checkAdminRole(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil:", error);
        setProfile(null);
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      setProfile(null);
    }
  };

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error("Erro ao verificar role de admin:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.role === 'admin');
      }
    } catch (error) {
      console.error("Erro ao verificar role de admin:", error);
      setIsAdmin(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user.id);
        await checkAdminRole(data.user.id);
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithProvider = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({ provider: provider });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Erro ao fazer login com provedor:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Implementação da função logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user.id);
        await checkAdminRole(data.user.id);
      }
    } catch (error: any) {
      console.error("Erro ao registrar:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Erro ao resetar a senha:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    try {
      setIsLoading(true);
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      setIsLoading(true);
      if (!user) throw new Error("Usuário não autenticado");

      const filePath = `avatars/${user.id}/${file.name}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const publicURL = `${supabase.storageUrl}/avatars/${filePath}`;
      await updateProfile({ avatar_url: publicURL });
      return publicURL;
    } catch (error: any) {
      console.error("Erro ao fazer upload do avatar:", error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isLoading,
        isAuthenticated, // Adicionada propriedade faltante
        login,
        loginWithProvider,
        logout, // Adicionada propriedade faltante
        register,
        resetPassword,
        updateProfile,
        uploadAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
