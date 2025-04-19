
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from 'sonner';

export interface AdminUser extends User {
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

  // Fetch users
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
      
      // Construir a query base
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_sports:user_sports(
            *,
            sport_type:sport_type_id(name),
            skill_level:skill_level_id(name)
          ),
          user_gamification:user_gamification(
            total_points,
            current_level:current_level_id(name)
          ),
          user_achievements:user_achievements(
            *,
            achievement:achievement_type_id(name, icon)
          ),
          auth_user:id(email, last_sign_in_at)
        `, { 
          count: 'exact' 
        })
        .range(start, end);

      // Aplicar filtros se existirem
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      // Transformar os dados para o formato AdminUser
      const formattedUsers: AdminUser[] = data?.map(profile => ({
        id: profile.id,
        email: profile.auth_user?.email || '',
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        phone: profile.phone || '',
        city: profile.city || '',
        neighborhood: profile.neighborhood || '',
        level: profile.user_gamification?.[0]?.current_level?.name || 'Iniciante',
        points: profile.user_gamification?.[0]?.total_points || 0,
        sports: profile.user_sports?.map(sport => sport.sport_type?.name || '') || [],
        status: profile.is_active ? 'active' : 'blocked',
        avatarUrl: profile.avatar_url,
        badges: profile.user_achievements?.map(achievement => achievement.achievement?.name) || [],
        lastLogin: profile.auth_user?.last_sign_in_at,
        role: 'user' // Por padrão todos são usuários normais
      })) || [];

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

  // Block user
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

  // Unblock user
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

  // Update user
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

  // Export users to CSV
  const exportUsers = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_sports!inner(
            sport_type!inner(name),
            skill_level!inner(name)
          ),
          user_gamification!inner(
            total_points,
            current_level:current_level_id(name)
          )
        `);

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Nenhum dado encontrado para exportar');
      }

      // Formatar dados para CSV
      const headers = ['ID,Nome,Email,Telefone,Cidade,Bairro,Nível,Pontos,Modalidades,Status\n'];
      const rows = data.map(user => {
        const sports = user.user_sports?.map(s => s.sport_type?.name).join(';') || '';
        return [
          user.id,
          `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          user.auth_user?.email || '',
          user.phone || '',
          user.city || '',
          user.neighborhood || '',
          user.user_gamification?.[0]?.current_level?.name || 'Iniciante',
          user.user_gamification?.[0]?.total_points || 0,
          sports,
          user.is_active ? 'Ativo' : 'Bloqueado'
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
