
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { UserData } from '@/components/admin/users/AdminUserDetails';

export function useUserDetails(userId: string, initialUserData: UserData) {
  const [userDetails, setUserDetails] = useState<UserData>(initialUserData);
  const [userSportsDetails, setUserSportsDetails] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [recognitions, setRecognitions] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Buscar esportes do usuário
        const { data: userSports, error: sportsError } = await supabase
          .from('user_sports')
          .select(`
            id,
            notes,
            is_verified,
            verified_at,
            sport_type_id(id, name, icon),
            skill_level_id(id, name, description)
          `)
          .eq('user_id', userId);
          
        if (sportsError) throw sportsError;
        
        if (userSports) {
          setUserSportsDetails(userSports.map(sport => ({
            id: sport.id,
            name: sport.sport_type_id?.name || '',
            icon: sport.sport_type_id?.icon || '',
            skillLevel: sport.skill_level_id?.name || 'Iniciante',
            skillDescription: sport.skill_level_id?.description,
            isVerified: sport.is_verified,
            verifiedAt: sport.verified_at,
            notes: sport.notes
          })));
        }
          
        // Buscar preferências do usuário
        const { data: preferences, error: preferencesError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (preferencesError && preferencesError.code !== 'PGRST116') {
          throw preferencesError;
        }
          
        if (preferences) {
          setUserPreferences(preferences);
        }
        
        // Buscar conquistas do usuário
        const { data: userAchievements, error: achievementsError } = await supabase
          .from('user_achievements')
          .select(`
            id,
            earned_at,
            is_featured,
            achievement_type_id(id, name, description, icon, points)
          `)
          .eq('user_id', userId);
          
        if (achievementsError) throw achievementsError;
        
        if (userAchievements) {
          setAchievements(userAchievements.map(achievement => ({
            id: achievement.id,
            name: achievement.achievement_type_id?.name || '',
            description: achievement.achievement_type_id?.description || '',
            date: achievement.earned_at,
            icon: achievement.achievement_type_id?.icon || '🏆'
          })));
        }
        
        // Buscar reservas do usuário
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            start_time,
            end_time,
            status,
            court_id(id, name)
          `)
          .eq('user_id', userId)
          .order('booking_date', { ascending: false })
          .limit(10);
          
        if (bookingsError) throw bookingsError;
        
        if (bookings) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          setRecentBookings(bookings.map(booking => {
            const bookingDate = new Date(booking.booking_date);
            bookingDate.setHours(0, 0, 0, 0);
            
            let bookingStatus: 'completed' | 'upcoming' | 'cancelled' = 'completed';
            
            if (booking.status === 'cancelled') {
              bookingStatus = 'cancelled';
            } else if (bookingDate >= today) {
              bookingStatus = 'upcoming';
            }
            
            return {
              id: booking.id,
              date: formatDate(booking.booking_date),
              time: `${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)}`,
              court: booking.court_id?.name || 'Quadra sem nome',
              status: bookingStatus
            };
          }));
        }
        
        // Buscar avaliações recebidas pelo usuário - FIX: Adicionando aliases para resolver ambiguidade
        const { data: userRecognitions, error: recognitionsError } = await supabase
          .from('user_recognitions')
          .select(`
            id,
            comment,
            created_at,
            from_profiles:profiles!from_user_id(first_name, last_name),
            recognition_type_id(id, name, icon)
          `)
          .eq('to_user_id', userId);
          
        if (recognitionsError) throw recognitionsError;
        
        if (userRecognitions) {
          setRecognitions(userRecognitions.map(recognition => ({
            id: recognition.id,
            fromUser: `${recognition.from_profiles?.first_name || ''} ${recognition.from_profiles?.last_name || ''}`.trim(),
            type: recognition.recognition_type_id?.name || '',
            comment: recognition.comment,
            date: recognition.created_at
          })));
        }
        
      } catch (error: any) {
        console.error('Erro ao carregar dados do usuário:', error);
        setError(error.message || 'Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Funções para atualizar dados do usuário
  const updateUserName = async (name: string) => {
    try {
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const { error } = await supabase
        .from('profiles')
        .update({ 
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUserDetails(prev => ({
        ...prev,
        name
      }));
      
      toast({
        title: "Nome atualizado",
        description: "O nome do usuário foi atualizado com sucesso"
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar nome:', error);
      toast({
        title: "Erro ao atualizar nome",
        description: error.message || "Não foi possível atualizar o nome",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateUserContact = async (data: { phone?: string, city?: string, neighborhood?: string }) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUserDetails(prev => ({
        ...prev,
        ...data
      }));
      
      toast({
        title: "Contato atualizado",
        description: "As informações de contato foram atualizadas com sucesso"
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar contato:', error);
      toast({
        title: "Erro ao atualizar contato",
        description: error.message || "Não foi possível atualizar as informações de contato",
        variant: "destructive"
      });
      return false;
    }
  };

  const blockUser = async (reason: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUserDetails(prev => ({
        ...prev,
        status: 'blocked'
      }));
      
      toast({
        title: "Usuário bloqueado",
        description: "O usuário foi bloqueado com sucesso"
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao bloquear usuário:', error);
      toast({
        title: "Erro ao bloquear usuário",
        description: error.message || "Não foi possível bloquear o usuário",
        variant: "destructive"
      });
      return false;
    }
  };

  const unblockUser = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUserDetails(prev => ({
        ...prev,
        status: 'active'
      }));
      
      toast({
        title: "Usuário desbloqueado",
        description: "O usuário foi desbloqueado com sucesso"
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao desbloquear usuário:', error);
      toast({
        title: "Erro ao desbloquear usuário",
        description: error.message || "Não foi possível desbloquear o usuário",
        variant: "destructive"
      });
      return false;
    }
  };

  const makeAdmin = async () => {
    try {
      // Verifica se o usuário já é admin
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      // Se não for admin, adiciona o papel
      if (!existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin',
            created_at: new Date().toISOString(),
            created_by: (await supabase.auth.getUser()).data.user?.id
          });
        
        if (error) throw error;
      }
      
      setUserDetails(prev => ({
        ...prev,
        role: 'admin',
        isAdmin: true
      }));
      
      toast({
        title: "Usuário promovido",
        description: "O usuário foi promovido a administrador com sucesso"
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao promover usuário:', error);
      toast({
        title: "Erro ao promover usuário",
        description: error.message || "Não foi possível promover o usuário a administrador",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeAdmin = async () => {
    try {
      // Remove o papel de admin
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (error) throw error;
      
      setUserDetails(prev => ({
        ...prev,
        role: 'user',
        isAdmin: false
      }));
      
      toast({
        title: "Permissão removida",
        description: "A permissão de administrador foi removida com sucesso"
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao remover permissão:', error);
      toast({
        title: "Erro ao remover permissão",
        description: error.message || "Não foi possível remover a permissão de administrador",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    userDetails,
    userSportsDetails,
    userPreferences,
    achievements,
    recognitions,
    recentBookings,
    loading,
    error,
    updateUserName,
    updateUserContact,
    blockUser,
    unblockUser,
    makeAdmin,
    removeAdmin
  };
}
