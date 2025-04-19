
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
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
      const { data: profiles, error: profilesError } = await supabase
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
        `)
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

      // Create map of admin roles
      const adminMap = new Map();
      if (userRoles) {
        userRoles.forEach(ur => {
          if (ur.role === 'admin') {
            adminMap.set(ur.user_id, true);
          }
        });
      }

      // Create map of sports by user
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

      // Transform profiles into AdminUser format
      const formattedUsers: AdminUser[] = (profiles || []).map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        email: '', // Email is not included in profiles table for security
        phone: profile.phone || '',
        city: profile.city || '',
        neighborhood: profile.neighborhood || '',
        level: 'standard', // Default level if not specified
        points: profile.credit_balance || 0,
        sports: sportsMap.get(profile.id) || [],
        status: profile.is_active ? 'active' : 'blocked',
        isAdmin: adminMap.get(profile.id) || false,
        createdAt: profile.created_at,
        lastLogin: '', // Not available in this context
        avatarUrl: profile.avatar_url,
        badges: [] // Badges would need additional query
      }));
      
      // Update state with fetched data
      setUsers(formattedUsers);
      setPagination({
        page,
        pageSize,
        totalCount: formattedUsers.length // This would ideally come from a count query
      });
      setLoading(false);

    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || 'Failed to fetch users');
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
      // This would be implemented to export real data
      const mockCSV = "id,name,email,level,points,status\n1,John Doe,john@example.com,gold,1200,active";
      return mockCSV;
    } catch (err: any) {
      toast.error(`Erro ao exportar usuários: ${err.message || 'Falha na operação'}`);
      return null;
    }
  };

  // Initialize by fetching users
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
