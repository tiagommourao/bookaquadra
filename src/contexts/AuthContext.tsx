import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, User } from '@/types';
import { Provider } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signInWithOAuth: (provider: Provider) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
      });
    }

    getSession();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const fetchUser = async () => {
      if (session?.user) {
        const formattedUser = formatUserData(session.user);
        setUser(formattedUser);
        await fetchProfile(formattedUser.id);
        await checkAdminRole(formattedUser.id);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [session]);

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
      }

      setProfile(profileData || null);
    } catch (error: any) {
      console.error("Erro ao buscar perfil:", error);
      setProfile(null);
    }
  };

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (error) {
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    } catch (error: any) {
      console.error("Erro ao verificar role de admin:", error);
      setIsAdmin(false);
    }
  };

  // Corrigir o método de formatação de usuário para lidar corretamente com os tipos
  const formatUserData = (userData: any): User => {
    return {
      id: userData.id,
      email: userData.email,
      created_at: userData.created_at || new Date().toISOString(),
      app_metadata: userData.app_metadata || {},
      user_metadata: userData.user_metadata || {},
      role: userData.role || 'user'
    };
  };

  const signInWithOAuth = async (provider: Provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Erro ao fazer login com OAuth:", error);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    isLoading,
    isAdmin,
    signInWithOAuth,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
