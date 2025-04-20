
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event, EventType, EventStatus } from '@/types/event';

export function useEventsData() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<Event[]> => {
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
      
      // Map string event_type and status to enum types
      const typedData = data?.map(event => ({
        ...event,
        event_type: event.event_type as EventType,
        status: event.status as EventStatus
      })) || [];
      
      return typedData as Event[];
    }
  });
}

export function useEventDetails(eventId: string | null) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async (): Promise<Event | null> => {
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
        // Map string event_type and status to enum types
        const typedData = {
          ...data,
          event_type: data.event_type as EventType,
          status: data.status as EventStatus
        };
        
        return typedData as Event;
      }
      
      return null;
    },
    enabled: !!eventId
  });
}
