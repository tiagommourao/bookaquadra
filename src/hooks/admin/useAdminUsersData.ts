
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AdminUser } from '@/types';

export function useAdminUsersData() {
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      // Buscar perfis com todas as informações relacionadas
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
          is_active,
          preferences,
          credit_balance,
          profile_progress
        `);

      if (profilesError) throw profilesError;

      // Buscar roles dos usuários
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Buscar modalidades esportivas dos usuários
      const { data: userSports, error: sportsError } = await supabase
        .from('user_sports')
        .select(`
          user_id,
          sport_type_id,
          sport_types (
            name
          ),
          skill_level_id,
          skill_levels (
            name
          )
        `);

      if (sportsError) throw sportsError;

      // Buscar conquistas dos usuários
      const { data: userAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          user_id,
          achievement_types (
            name,
            icon
          )
        `);

      if (achievementsError) throw achievementsError;

      // Criar mapa de roles administrativas
      const adminMap = new Map();
      userRoles?.forEach(ur => {
        if (ur.role === 'admin') {
          adminMap.set(ur.user_id, true);
        }
      });

      // Criar mapa de modalidades esportivas por usuário
      const sportsMap = new Map();
      userSports?.forEach(us => {
        if (!sportsMap.has(us.user_id)) {
          sportsMap.set(us.user_id, []);
        }
        sportsMap.get(us.user_id).push({
          name: us.sport_types?.name,
          level: us.skill_levels?.name
        });
      });

      // Criar mapa de conquistas por usuário
      const achievementsMap = new Map();
      userAchievements?.forEach(ua => {
        if (!achievementsMap.has(ua.user_id)) {
          achievementsMap.set(ua.user_id, []);
        }
        if (ua.achievement_types) {
          achievementsMap.get(ua.user_id).push({
            name: ua.achievement_types.name,
            icon: ua.achievement_types.icon
          });
        }
      });

      // Transformar os dados para o formato AdminUser
      return (profiles || []).map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        email: '', // Email será preenchido via RLS
        phone: profile.phone || '',
        city: profile.city || '',
        neighborhood: profile.neighborhood || '',
        level: 'user',
        points: profile.credit_balance || 0,
        sports: sportsMap.get(profile.id) || [],
        status: profile.is_active ? 'active' : 'blocked',
        isAdmin: adminMap.get(profile.id) || false,
        createdAt: profile.created_at,
        lastLogin: null,
        avatarUrl: profile.avatar_url,
        badges: achievementsMap.get(profile.id) || [],
        preferences: profile.preferences || {},
        profileProgress: profile.profile_progress || 0
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
