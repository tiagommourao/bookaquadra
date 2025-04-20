
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event, EventType, EventStatus, EventCourt } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Interface for event filters
export interface EventFilters {
  status?: string;
  eventType?: string;
  courtId?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  searchTerm?: string;
}

// Pagination interface
export interface PaginationParams {
  page: number;
  limit: number;
}

// Helper to format dates for Supabase
const formatDateForDB = (date: Date): string => {
  return date.toISOString();
};

// Fetch events with filters and pagination
export const useEvents = (filters: EventFilters = {}, pagination: PaginationParams = { page: 1, limit: 10 }) => {
  const { page, limit } = pagination;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery({
    queryKey: ['events', filters, pagination],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          *,
          events_courts(court_id, courts:court_id(name))
        `)
        .order('start_datetime', { ascending: false })
        .range(from, to);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.startDate) {
        const startDateStr = format(filters.startDate, 'yyyy-MM-dd');
        query = query.gte('start_datetime', startDateStr);
      }

      if (filters.endDate) {
        const endDateStr = format(filters.endDate, 'yyyy-MM-dd');
        query = query.lte('end_datetime', endDateStr);
      }

      if (filters.searchTerm) {
        query = query.ilike('name', `%${filters.searchTerm}%`);
      }

      if (filters.courtId) {
        // Buscar eventos que estão vinculados à quadra especificada
        const { data: eventIds, error: eventIdsError } = await supabase
          .from('events_courts')
          .select('event_id')
          .eq('court_id', filters.courtId);

        if (eventIdsError) {
          throw eventIdsError;
        }

        if (eventIds && eventIds.length > 0) {
          query = query.in('id', eventIds.map(e => e.event_id));
        } else {
          // Se não houver eventos para esta quadra, retornar conjunto vazio
          return { data: [], count: 0 };
        }
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data || [], count };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get event by ID
export const useEvent = (eventId: string | null) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          events_courts(court_id)
        `)
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      return data as Event & { events_courts: Array<{court_id: string}> };
    },
    enabled: !!eventId,
  });
};

// Get courts for an event
export const useEventCourts = (eventId: string | null) => {
  return useQuery({
    queryKey: ['event-courts', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('events_courts')
        .select(`
          court_id,
          courts:court_id(id, name)
        `)
        .eq('event_id', eventId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
};

// Create event
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      event, 
      courtIds 
    }: { 
      event: Omit<Event, 'id' | 'created_at' | 'updated_at'>; 
      courtIds: string[];
    }) => {
      const eventData = {
        ...event,
        start_datetime: formatDateForDB(new Date(event.start_datetime)),
        end_datetime: formatDateForDB(new Date(event.end_datetime))
      };

      const { data: eventResult, error: eventError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();
      
      if (eventError) throw eventError;
      
      if (courtIds.length > 0) {
        const courtLinks = courtIds.map(courtId => ({
          event_id: eventResult.id,
          court_id: courtId
        }));
        
        const { error: courtsError } = await supabase
          .from('events_courts')
          .insert(courtLinks);
        
        if (courtsError) throw courtsError;
      }
      
      return eventResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Evento criado",
        description: "O evento foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating event:', error);
      toast({
        title: "Erro ao criar evento",
        description: "Ocorreu um erro ao criar o evento. Tente novamente.",
        variant: "destructive",
      });
    }
  });
};

// Update event
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      eventId, 
      event, 
      courtIds 
    }: { 
      eventId: string;
      event: Partial<Event>;
      courtIds: string[];
    }) => {
      const eventData = {
        ...event,
        start_datetime: event.start_datetime ? formatDateForDB(new Date(event.start_datetime)) : undefined,
        end_datetime: event.end_datetime ? formatDateForDB(new Date(event.end_datetime)) : undefined
      };
      
      const { data: eventResult, error: eventError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId)
        .select()
        .single();
      
      if (eventError) throw eventError;
      
      const { error: deleteError } = await supabase
        .from('events_courts')
        .delete()
        .eq('event_id', eventId);
      
      if (deleteError) throw deleteError;
      
      if (courtIds.length > 0) {
        const courtLinks = courtIds.map(courtId => ({
          event_id: eventId,
          court_id: courtId
        }));
        
        const { error: courtsError } = await supabase
          .from('events_courts')
          .insert(courtLinks);
        
        if (courtsError) throw courtsError;
      }
      
      return eventResult;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-courts', variables.eventId] });
      toast({
        title: "Evento atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      toast({
        title: "Erro ao atualizar evento",
        description: "Ocorreu um erro ao atualizar o evento. Tente novamente.",
        variant: "destructive",
      });
    }
  });
};

// Delete event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      // 1. Delete court links first (due to foreign key constraint)
      const { error: courtsError } = await supabase
        .from('events_courts')
        .delete()
        .eq('event_id', eventId);
      
      if (courtsError) throw courtsError;
      
      // 2. Delete event registrations if any
      const { error: regsError } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId);
      
      if (regsError) throw regsError;
      
      // 3. Delete event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (eventError) throw eventError;
      
      return eventId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Evento excluído",
        description: "O evento foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
      toast({
        title: "Erro ao excluir evento",
        description: "Ocorreu um erro ao excluir o evento. Tente novamente.",
        variant: "destructive",
      });
    }
  });
};

// Duplicate event
export const useDuplicateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      // 1. Get event data
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (eventError) throw eventError;
      
      // 2. Get court links
      const { data: courtLinks, error: courtLinksError } = await supabase
        .from('events_courts')
        .select('court_id')
        .eq('event_id', eventId);
      
      if (courtLinksError) throw courtLinksError;
      
      // 3. Create new event (copy)
      const newEvent = {
        ...eventData,
        name: `${eventData.name} (Cópia)`,
        id: undefined,
        created_at: undefined,
        updated_at: undefined
      };
      
      const { data: newEventData, error: newEventError } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();
      
      if (newEventError) throw newEventError;
      
      // 4. Create court links for new event
      if (courtLinks && courtLinks.length > 0) {
        const newCourtLinks = courtLinks.map(link => ({
          event_id: newEventData.id,
          court_id: link.court_id
        }));
        
        const { error: newLinksError } = await supabase
          .from('events_courts')
          .insert(newCourtLinks);
        
        if (newLinksError) throw newLinksError;
      }
      
      return newEventData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Evento duplicado",
        description: "O evento foi duplicado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error duplicating event:', error);
      toast({
        title: "Erro ao duplicar evento",
        description: "Ocorreu um erro ao duplicar o evento. Tente novamente.",
        variant: "destructive",
      });
    }
  });
};

// Count events by status
export const useEventsStatistics = () => {
  return useQuery({
    queryKey: ['events-statistics'],
    queryFn: async () => {
      // Get total events count
      const { count: totalCount, error: totalError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;
      
      // Get active events count
      const { count: activeCount, error: activeError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (activeError) throw activeError;
      
      // Get upcoming events (active events with start_datetime in the future)
      const today = new Date();
      const { count: upcomingCount, error: upcomingError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gt('start_datetime', today.toISOString());
      
      if (upcomingError) throw upcomingError;
      
      // Get completed events count
      const { count: completedCount, error: completedError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      if (completedError) throw completedError;
      
      return {
        total: totalCount || 0,
        active: activeCount || 0,
        upcoming: upcomingCount || 0,
        completed: completedCount || 0,
      };
    }
  });
};
