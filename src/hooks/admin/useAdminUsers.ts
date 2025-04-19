
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  neighborhood: string;
  level: string;
  points: number;
  sports: Array<{ name: string; level: string }>;
  status: 'active' | 'blocked' | 'suspended';
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
  avatarUrl: string | null;
  badges: Array<{ name: string; icon: string }>;
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
  
  const queryClient = useQueryClient();

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
      // Fetch profiles with related user data
      const { data: profiles, error: profilesError, count } = await supabase
        .from('profiles')
        .select(`
          id, 
          first_name, 
          last_name, 
          phone, 
          city, 
          neighborhood,
          avatar_url,
          created_at,
          is_active,
          credit_balance
        `, { count: 'exact' })
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      if (profilesError) throw profilesError;

      // Fetch user roles to determine admins
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Fetch user sports
      const { data: userSports, error: sportsError } = await supabase
        .from('user_sports')
        .select(`
          user_id,
          sport_type_id,
          sport_types (name),
          skill_level_id,
          skill_levels (name)
        `);
      
      if (sportsError) throw sportsError;

      // Criar mapa de papéis de admin
      const adminMap = new Map();
      if (userRoles) {
        userRoles.forEach(ur => {
          if (ur.role === 'admin') {
            adminMap.set(ur.user_id, true);
          }
        });
      }

      // Criar mapa de esportes por usuário
      const sportsMap = new Map();
      if (userSports) {
        userSports.forEach(us => {
          if (!sportsMap.has(us.user_id)) {
            sportsMap.set(us.user_id, []);
          }
          sportsMap.get(us.user_id).push({
            name: us.sport_types?.name || '',
            level: us.skill_levels?.name || ''
          });
        });
      }

      // Transformar perfis no formato AdminUser
      const formattedUsers: AdminUser[] = (profiles || []).map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        email: '', // Email não é incluído na tabela de perfis por segurança
        phone: profile.phone || '',
        city: profile.city || '',
        neighborhood: profile.neighborhood || '',
        level: 'standard', // Nível padrão se não especificado
        points: profile.credit_balance || 0,
        sports: sportsMap.get(profile.id) || [],
        status: profile.is_active ? 'active' : 'blocked',
        isAdmin: adminMap.get(profile.id) || false,
        createdAt: profile.created_at,
        lastLogin: '', // Não disponível neste contexto
        avatarUrl: profile.avatar_url,
        badges: [] // Badges precisariam de consulta adicional
      }));
      
      // Atualizar estado com os dados obtidos
      setUsers(formattedUsers);
      setPagination({
        page,
        pageSize,
        totalCount: count || formattedUsers.length
      });
      setLoading(false);

    } catch (err: any) {
      console.error("Erro ao buscar usuários:", err);
      setError(err.message || 'Falha ao buscar usuários');
      toast.error('Erro ao carregar usuários');
      setLoading(false);
    }
  };

  // Block user
  const blockUser = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .eq('id', userId);
        
        if (error) throw error;
        
        toast.success('Usuário bloqueado com sucesso');
        return true;
      } catch (err: any) {
        toast.error(`Erro ao bloquear usuário: ${err.message || 'Falha na operação'}`);
        return false;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });

  // Unblock user
  const unblockUser = useMutation({
    mutationFn: async (userId: string) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: true })
          .eq('id', userId);
        
        if (error) throw error;
        
        toast.success('Usuário desbloqueado com sucesso');
        return true;
      } catch (err: any) {
        toast.error(`Erro ao desbloquear usuário: ${err.message || 'Falha na operação'}`);
        return false;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });

  // Set user as admin
  const setAsAdmin = useMutation({
    mutationFn: async (userId: string) => {
      try {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });
        
        if (error) throw error;
        
        toast.success('Usuário promovido a administrador com sucesso');
        return true;
      } catch (err: any) {
        toast.error(`Erro ao promover usuário: ${err.message || 'Falha na operação'}`);
        return false;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });

  // Remove admin role
  const removeAdminRole = useMutation({
    mutationFn: async (userId: string) => {
      try {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        
        if (error) throw error;
        
        toast.success('Privilégios de administrador removidos com sucesso');
        return true;
      } catch (err: any) {
        toast.error(`Erro ao atualizar privilégios: ${err.message || 'Falha na operação'}`);
        return false;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });

  // Update user
  const updateUser = async (userId: string, userData: Partial<AdminUser>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: userData.name?.split(' ')[0],
          last_name: userData.name?.split(' ').slice(1).join(' '),
          phone: userData.phone,
          city: userData.city,
          neighborhood: userData.neighborhood,
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
  const exportUsers = async (filters?: any) => {
    try {
      // Para implementar exportação de dados reais
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, city, neighborhood, credit_balance, created_at, is_active');
      
      if (profilesError) throw profilesError;
      
      // Transformar dados em CSV
      if (!profiles || profiles.length === 0) {
        return "No data to export";
      }
      
      // Cria o cabeçalho do CSV
      const headers = ['ID', 'Nome', 'Telefone', 'Cidade', 'Bairro', 'Pontos', 'Status', 'Data de Cadastro'].join(',');
      
      // Transforma cada linha em CSV
      const rows = profiles.map(p => [
        p.id,
        `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        p.phone || '',
        p.city || '',
        p.neighborhood || '',
        p.credit_balance || 0,
        p.is_active ? 'Ativo' : 'Bloqueado',
        new Date(p.created_at).toLocaleDateString('pt-BR')
      ].join(','));
      
      return [headers, ...rows].join('\n');
    } catch (err: any) {
      toast.error(`Erro ao exportar usuários: ${err.message || 'Falha na operação'}`);
      return null;
    }
  };

  // Inicializar buscando usuários
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    blockUser,
    unblockUser,
    setAsAdmin,
    removeAdminRole,
    updateUser,
    exportUsers
  };
};
