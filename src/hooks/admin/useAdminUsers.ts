import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from 'sonner';

export interface AdminUser extends Omit<User, 'id'> {
  id: string;
  name?: string; // Adicionado name
  phone?: string;
  city?: string;
  neighborhood?: string;
  level: string;
  points: number;
  sports: string[];
  status: 'active' | 'blocked' | 'suspended';
  avatarUrl?: string;
  badges?: string[];
  lastLogin?: Date | string;
  createdAt: string;
  created_at: string; // Adicionado para compatibilidade
  role: 'user' | 'admin';
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0
  });

  const fetchUsers = async (
    page = 1, 
    pageSize = 10, 
    filters?: {
      search?: string;
      status?: string[];
      sports?: string[];
      levels?: string[];
      dateRange?: {from: Date, to: Date}
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      let query = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          city,
          neighborhood,
          avatar_url,
          is_active,
          created_at,
          user_sports:user_sports(
            sport_type_id(name)
          ),
          user_gamification:user_gamification(
            total_points,
            current_level_id(name)
          ),
          user_achievements:user_achievements(
            achievement_type_id(name, icon)
          )
        `, { 
          count: 'exact' 
        })
        .range(start, end);

      const { data: authUsersData } = await supabase
        .from('auth_users_view')
        .select('id, email, last_sign_in_at');

      const authUsersMap = new Map();
      if (authUsersData) {
        authUsersData.forEach(user => {
          authUsersMap.set(user.id, user);
        });
      }

      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');

      const adminIds = new Set();
      if (adminRoles) {
        adminRoles.forEach(role => {
          adminIds.add(role.user_id);
        });
      }

      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }

      if (filters?.status && filters.status.length > 0) {
        if (filters.status.includes('active')) {
          query = query.eq('is_active', true);
        } else if (filters.status.includes('blocked')) {
          query = query.eq('is_active', false);
        }
      }

      const { data, count, error } = await query;

      if (error) throw error;

      const formattedUsers: AdminUser[] = data?.map(profile => {
        const authUser = authUsersMap.get(profile.id);

        return {
          id: profile.id,
          email: authUser?.email || '',
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          phone: profile.phone || '',
          city: profile.city || '',
          neighborhood: profile.neighborhood || '',
          level: profile.user_gamification?.[0]?.current_level_id?.name || 'Iniciante',
          points: profile.user_gamification?.[0]?.total_points || 0,
          sports: profile.user_sports?.map((sport: any) => sport.sport_type_id?.name || '').filter(Boolean) || [],
          status: profile.is_active ? 'active' : 'blocked',
          avatarUrl: profile.avatar_url,
          badges: profile.user_achievements?.map((achievement: any) => achievement.achievement_type_id?.name).filter(Boolean) || [],
          lastLogin: authUser?.last_sign_in_at,
          createdAt: profile.created_at,
          created_at: profile.created_at, // Adicionado para compatibilidade
          role: adminIds.has(profile.id) ? 'admin' : 'user'
        };
      }) || [];

      setUsers(formattedUsers);
      setPagination({
        page,
        pageSize,
        totalCount: count || 0
      });
      
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message || 'Falha ao carregar usuários');
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const blockUser = async (userId: string, reason: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('Usuário bloqueado com sucesso');
      return true;
    } catch (err: any) {
      toast.error(`Erro ao bloquear usuário: ${err.message || 'Falha na operação'}`);
      return false;
    }
  };

  const unblockUser = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('Usuário desbloqueado com sucesso');
      return true;
    } catch (err: any) {
      toast.error(`Erro ao desbloquear usuário: ${err.message || 'Falha na operação'}`);
      return false;
    }
  };

  const updateUser = async (userId: string, userData: Partial<AdminUser>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: userData.name?.split(' ')[0],
          last_name: userData.name?.split(' ').slice(1).join(' '),
          phone: userData.phone,
          city: userData.city,
          neighborhood: userData.neighborhood,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('Dados do usuário atualizados com sucesso');
      return true;
    } catch (err: any) {
      toast.error(`Erro ao atualizar usuário: ${err.message || 'Falha na operação'}`);
      return false;
    }
  };

  const exportUsers = async (): Promise<string | null> => {
    try {
      if (users.length === 0) {
        await fetchUsers(1, 100);
      }
      
      if (users.length === 0) {
        throw new Error('Nenhum dado encontrado para exportar');
      }

      const headers = 'ID,Nome,Email,Telefone,Cidade,Bairro,Nível,Pontos,Modalidades,Status\n';
      const rows = users.map(user => {
        const sports = user.sports.length > 0 ? user.sports.join(';') : '';
        return [
          user.id,
          user.name,
          user.email,
          user.phone || '',
          user.city || '',
          user.neighborhood || '',
          user.level || 'Iniciante',
          user.points || 0,
          sports,
          user.status === 'active' ? 'Ativo' : 'Bloqueado'
        ].join(',');
      });

      return headers.concat(rows.join('\n'));
    } catch (err: any) {
      toast.error(`Erro ao exportar usuários: ${err.message || 'Falha na operação'}`);
      return null;
    }
  };

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    blockUser,
    unblockUser,
    updateUser,
    exportUsers
  };
};
