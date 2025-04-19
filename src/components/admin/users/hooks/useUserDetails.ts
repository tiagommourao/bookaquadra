
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';

export function useUserDetails(userId: string) {
  const [userSportsDetails, setUserSportsDetails] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [recognitions, setRecognitions] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
        
        // Buscar avaliações recebidas pelo usuário
        const { data: userRecognitions, error: recognitionsError } = await supabase
          .from('user_recognitions')
          .select(`
            id,
            comment,
            created_at,
            from_user:from_user_id(id, first_name, last_name),
            recognition_type_id(id, name, icon)
          `)
          .eq('to_user_id', userId);
          
        if (recognitionsError) throw recognitionsError;
        
        if (userRecognitions) {
          setRecognitions(userRecognitions.map(recognition => ({
            id: recognition.id,
            fromUser: `${recognition.from_user?.first_name || ''} ${recognition.from_user?.last_name || ''}`.trim(),
            type: recognition.recognition_type_id?.name || '',
            comment: recognition.comment,
            date: recognition.created_at
          })));
        }
        
      } catch (error: any) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  return {
    userSportsDetails,
    userPreferences,
    achievements,
    recognitions,
    recentBookings,
    loading
  };
}
