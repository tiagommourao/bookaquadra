
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event, EventType, EventStatus } from '@/types/event';

export function useEventsData() {
  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          events_courts(
            court_id,
            courts(name)
          )
        `)
        .order('start_datetime', { ascending: true });
      
      if (error) throw error;
      
      // Garantir que os dados retornados correspondam ao tipo Event[]
      return (data || []).map(event => ({
        ...event,
        event_type: event.event_type as EventType,
        status: event.status as EventStatus,
        description: event.description || null,
        banner_url: event.banner_url || null,
        registration_fee: event.registration_fee || null,
        max_capacity: event.max_capacity || null,
        created_by: event.created_by || null
      })) as Event[];
    }
  });
}

export function useEventDetails(eventId: string | null) {
  return useQuery<Event | null>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          events_courts(
            court_id,
            courts(name)
          ),
          event_registrations(
            id,
            user_id,
            registration_date,
            payment_status,
            attended
          )
        `)
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          event_type: data.event_type as EventType,
          status: data.status as EventStatus,
          description: data.description || null,
          banner_url: data.banner_url || null,
          registration_fee: data.registration_fee || null,
          max_capacity: data.max_capacity || null,
          created_by: data.created_by || null
        } as Event;
      }
      
      return null;
    },
    enabled: !!eventId
  });
}
