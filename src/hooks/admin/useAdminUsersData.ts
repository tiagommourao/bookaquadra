
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AdminUser } from '@/types';

export function useAdminUsersData() {
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      // Fetch users from auth.users through the profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          phone,
          city,
          neighborhood,
          created_at,
          is_active
        `);

      if (profilesError) throw profilesError;

      // Get user roles separately to avoid relation errors
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Create a map of user_id to admin status
      const adminMap = new Map();
      userRoles?.forEach(ur => {
        if (ur.role === 'admin') {
          adminMap.set(ur.user_id, true);
        }
      });

      // Transform the data to match our AdminUser type
      return (profiles || []).map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        email: '', // We'll get this from auth.users through RLS policies
        phone: profile.phone || '',
        city: profile.city || '',
        neighborhood: profile.neighborhood || '',
        level: 'user',
        points: 0,
        sports: [],
        status: profile.is_active ? 'active' : 'blocked',
        isAdmin: adminMap.get(profile.id) || false,
        createdAt: profile.created_at,
        lastLogin: null,
        avatarUrl: profile.avatar_url,
        badges: []
      })) as AdminUser[];
    }
  });

  const setAsAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });
      
      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast({
        title: "Usuário promovido",
        description: "O usuário foi promovido a administrador com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao promover usuário",
        description: error.message || "Não foi possível promover o usuário a administrador.",
        variant: "destructive"
      });
    }
  });

  const removeAdminRole = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast({
        title: "Permissões removidas",
        description: "As permissões de administrador foram removidas com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover permissões",
        description: error.message || "Não foi possível remover as permissões de administrador.",
        variant: "destructive"
      });
    }
  });

  const blockUser = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);
      
      if (error) throw error;
      return { userId, reason };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast({
        title: "Usuário bloqueado",
        description: "O usuário foi bloqueado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao bloquear usuário",
        description: error.message || "Não foi possível bloquear o usuário.",
        variant: "destructive"
      });
    }
  });

  const unblockUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);
      
      if (error) throw error;
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast({
        title: "Usuário desbloqueado",
        description: "O usuário foi desbloqueado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao desbloquear usuário",
        description: error.message || "Não foi possível desbloquear o usuário.",
        variant: "destructive"
      });
    }
  });

  return {
    users,
    isLoading,
    error,
    setAsAdmin,
    removeAdminRole,
    blockUser,
    unblockUser
  };
}
