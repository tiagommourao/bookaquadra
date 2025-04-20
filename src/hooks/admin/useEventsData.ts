
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event, EventType } from '@/types/event';

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
      
      // Map string event_type to enum EventType
      const typedData = data?.map(event => ({
        ...event,
        event_type: event.event_type as EventType
      })) || [];
      
      return typedData;
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
        // Map string event_type to enum EventType
        const typedData = {
          ...data,
          event_type: data.event_type as EventType
        };
        
        return typedData;
      }
      
      return null;
    },
    enabled: !!eventId
  });
}
