import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminUser } from '@/types';

export function useAdminUsersData() {
  const queryClient = useQueryClient();
  console.log("Iniciando useAdminUsersData hook");

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      try {
        console.log("Iniciando busca de usuários admin");
        
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

        if (profilesError) {
          console.error("Erro ao buscar perfis:", profilesError);
          throw profilesError;
        }

        if (!profiles) {
          console.log("Nenhum perfil encontrado");
          return [];
        }

        // Buscar dados de autenticação usando a função RPC
        const { data: authUsersData, error: authError } = await supabase
          .rpc('get_auth_users');
        
        if (authError) {
          console.error("Erro ao buscar dados de autenticação:", authError);
          throw authError;
        }

        const authUsers = authUsersData || [];
        console.log("Dados de auth recebidos:", authUsers?.length || 0);

        // Criar mapas para acesso eficiente
        const emailMap = new Map<string, string>();
        const lastLoginMap = new Map<string, string>();
        
        authUsers.forEach(user => {
          if (user.id && user.email) {
            emailMap.set(user.id, user.email);
            if (user.last_sign_in_at) {
              lastLoginMap.set(user.id, user.last_sign_in_at);
            }
          }
        });

        // Buscar roles dos usuários
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');
        
        if (rolesError) {
          console.error("Erro ao buscar roles:", rolesError);
          throw rolesError;
        }

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

        if (sportsError) {
          console.error("Erro ao buscar esportes:", sportsError);
          throw sportsError;
        }

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

        if (achievementsError) {
          console.error("Erro ao buscar conquistas:", achievementsError);
          throw achievementsError;
        }

        // Criar mapa de roles administrativas
        const adminMap = new Map<string, boolean>();
        if (userRoles && userRoles.length > 0) {
          userRoles.forEach(ur => {
            if (ur.role === 'admin') {
              adminMap.set(ur.user_id, true);
            }
          });
        }

        // Criar mapa de modalidades esportivas por usuário
        const sportsMap = new Map<string, Array<{ name: string; level: string }>>();
        if (userSports && userSports.length > 0) {
          userSports.forEach(us => {
            if (!sportsMap.has(us.user_id)) {
              sportsMap.set(us.user_id, []);
            }
            const sportsList = sportsMap.get(us.user_id);
            if (sportsList) {
              sportsList.push({
                name: us.sport_types?.name || '',
                level: us.skill_levels?.name || '',
              });
            }
          });
        }

        // Criar mapa de conquistas por usuário
        const achievementsMap = new Map<string, Array<{ name: string; icon: string }>>();
        if (userAchievements && userAchievements.length > 0) {
          userAchievements.forEach(ua => {
            if (!achievementsMap.has(ua.user_id)) {
              achievementsMap.set(ua.user_id, []);
            }
            const achievementsList = achievementsMap.get(ua.user_id);
            if (achievementsList && ua.achievement_types) {
              achievementsList.push({
                name: ua.achievement_types.name,
                icon: ua.achievement_types.icon
              });
            }
          });
        }

        // Transformar os dados para o formato AdminUser
        const adminUsers = profiles.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuário',
          email: emailMap.get(profile.id) || '',
          phone: profile.phone || '',
          city: profile.city || '',
          neighborhood: profile.neighborhood || '',
          level: 'user',
          points: profile.credit_balance || 0,
          sports: sportsMap.get(profile.id) || [],
          status: profile.is_active ? 'active' : 'blocked',
          isAdmin: adminMap.get(profile.id) || false,
          createdAt: profile.created_at,
          lastLogin: lastLoginMap.get(profile.id) || '',
          avatarUrl: profile.avatar_url,
          badges: achievementsMap.get(profile.id) || [],
          preferences: profile.preferences || {},
          profileProgress: profile.profile_progress || 0
        }));
        
        console.log(`Processados ${adminUsers.length} usuários com sucesso`);
        return adminUsers;
      } catch (error) {
        console.error("Erro na função queryFn:", error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutos
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
      toast.success("Usuário promovido a administrador com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao promover usuário: ${error.message || 'Falha na operação'}`);
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
      toast.success("Permissões de administrador removidas com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao remover permissões: ${error.message || 'Falha na operação'}`);
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
      toast.success("Usuário bloqueado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao bloquear usuário: ${error.message || 'Falha na operação'}`);
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
      toast.success("Usuário desbloqueado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao desbloquear usuário: ${error.message || 'Falha na operação'}`);
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
