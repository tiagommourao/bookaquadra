
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event, EventType, EventStatus } from '@/types/event';

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  courtId?: string;
  status?: EventStatus;
  eventType?: EventType;
}

export function useEventsData(filters?: EventFilters, page: number = 0, pageSize: number = 10) {
  return useQuery<{data: Event[], count: number}>({
    queryKey: ['events', filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          *,
          events_courts(
            id,
            court_id,
            courts(id, name)
          ),
          event_registrations(
            id,
            user_id,
            registration_date,
            payment_status,
            attended
          )
        `, { count: 'exact' });
      
      // Aplicar filtros se fornecidos
      if (filters) {
        if (filters.startDate) {
          query = query.gte('start_datetime', filters.startDate);
        }
        
        if (filters.endDate) {
          query = query.lte('end_datetime', filters.endDate);
        }
        
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.eventType) {
          query = query.eq('event_type', filters.eventType);
        }
        
        if (filters.courtId) {
          query = query.eq('events_courts.court_id', filters.courtId);
        }
      }
      
      // Aplicar paginação
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .order('start_datetime', { ascending: true })
        .range(from, to);
      
      if (error) throw error;
      
      // Garantir que os dados retornados correspondam ao tipo Event[]
      const formattedData = (data || []).map(event => ({
        ...event,
        event_type: event.event_type as EventType,
        status: event.status as EventStatus,
        description: event.description || null,
        banner_url: event.banner_url || null,
        registration_fee: event.registration_fee || null,
        max_capacity: event.max_capacity || null,
        created_by: event.created_by || null
      })) as Event[];
      
      return { data: formattedData, count: count || 0 };
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
            id,
            court_id,
            courts(id, name)
          ),
          event_registrations(
            id,
            user_id,
            registration_date,
            payment_status,
            attended,
            profiles(first_name, last_name, email)
          )
        `)
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Processar dados de registros de eventos para incluir informações do usuário
        if (data.event_registrations) {
          data.event_registrations = data.event_registrations.map((reg: any) => ({
            ...reg,
            user: reg.profiles
          }));
        }
        
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

// Hook para buscar quadras disponíveis para seleção
export function useAvailableCourts() {
  return useQuery({
    queryKey: ['availableCourts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
}

// Hook para gerenciar registros de eventos (inscrições)
export function useEventRegistrations(eventId: string | null) {
  return useQuery({
    queryKey: ['eventRegistrations', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          profiles(first_name, last_name, email)
        `)
        .eq('event_id', eventId);
      
      if (error) throw error;
      
      return (data || []).map((reg: any) => ({
        ...reg,
        user: reg.profiles
      }));
    },
    enabled: !!eventId
  });
}

// Hook para exportar participantes de um evento
export function useExportEventParticipants(eventId: string | null) {
  return useQuery({
    queryKey: ['exportEventParticipants', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id,
          registration_date,
          payment_status,
          attended,
          notes,
          profiles(id, first_name, last_name, email, phone)
        `)
        .eq('event_id', eventId);
      
      if (error) throw error;
      
      return (data || []).map((reg: any) => ({
        id: reg.id,
        registration_date: reg.registration_date,
        payment_status: reg.payment_status,
        attended: reg.attended || false,
        notes: reg.notes || '',
        user_id: reg.profiles?.id || '',
        first_name: reg.profiles?.first_name || '',
        last_name: reg.profiles?.last_name || '',
        email: reg.profiles?.email || '',
        phone: reg.profiles?.phone || ''
      }));
    },
    enabled: !!eventId
  });
}
