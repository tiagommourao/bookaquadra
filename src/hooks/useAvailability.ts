
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AvailableTimeSlot, Schedule, ScheduleBlock, Holiday } from '@/types/court';
import { format, addMinutes, isWeekend, parse, isAfter, isBefore, parseISO, isSameDay } from 'date-fns';

export function useSchedules(courtId: string | null) {
  return useQuery({
    queryKey: ['schedules', courtId],
    queryFn: async (): Promise<Schedule[]> => {
      if (!courtId) return [];
      
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('court_id', courtId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!courtId
  });
}

export function useScheduleBlocks(courtId: string | null, selectedDate: Date | null) {
  return useQuery({
    queryKey: ['scheduleBlocks', courtId, selectedDate],
    queryFn: async (): Promise<ScheduleBlock[]> => {
      if (!courtId || !selectedDate) return [];
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const nextDay = format(addMinutes(new Date(dateStr), 24 * 60), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('court_id', courtId)
        .or(`start_datetime.gte.${dateStr},end_datetime.gte.${dateStr}`)
        .lt('start_datetime', nextDay);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!courtId && !!selectedDate
  });
}

export function useHolidays() {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: async (): Promise<Holiday[]> => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date');
      
      if (error) throw error;
      return data || [];
    }
  });
}

export function useBookingsForCourt(courtId: string | null, selectedDate: Date | null) {
  return useQuery({
    queryKey: ['bookingsForCourt', courtId, selectedDate],
    queryFn: async () => {
      if (!courtId || !selectedDate) return [];
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('court_id', courtId)
        .eq('booking_date', dateStr)
        .not('status', 'eq', 'cancelled');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!courtId && !!selectedDate
  });
}

export function useEventsForCourt(courtId: string | null, selectedDate: Date | null) {
  return useQuery({
    queryKey: ['eventsForCourt', courtId, selectedDate],
    queryFn: async () => {
      if (!courtId || !selectedDate) return [];
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Melhorado para buscar eventos que têm essa quadra associada
      const { data: eventCourtLinks, error: linksError } = await supabase
        .from('events_courts')
        .select('event_id')
        .eq('court_id', courtId);
      
      if (linksError) throw linksError;
      if (!eventCourtLinks || eventCourtLinks.length === 0) return [];
      
      const eventIds = eventCourtLinks.map(link => link.event_id);
      
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .eq('status', 'active')
        .eq('block_courts', true)
        .lte('start_datetime', `${dateStr}T23:59:59`)
        .gte('end_datetime', `${dateStr}T00:00:00`);
      
      if (eventsError) throw eventsError;
      console.log('Eventos encontrados para bloqueio:', events);
      return events || [];
    },
    enabled: !!courtId && !!selectedDate
  });
}

export function useAvailableTimeSlots(courtId: string | null, selectedDate: Date | null) {
  const { data: schedules, isLoading: isLoadingSchedules } = useSchedules(courtId);
  const { data: blocks, isLoading: isLoadingBlocks } = useScheduleBlocks(courtId, selectedDate);
  const { data: bookings, isLoading: isLoadingBookings } = useBookingsForCourt(courtId, selectedDate);
  const { data: holidays, isLoading: isLoadingHolidays } = useHolidays();
  const { data: events, isLoading: isLoadingEvents } = useEventsForCourt(courtId, selectedDate);
  
  return useQuery({
    queryKey: ['availableTimeSlots', courtId, selectedDate, schedules, blocks, bookings, holidays, events],
    queryFn: (): AvailableTimeSlot[] => {
      if (!courtId || !selectedDate || !schedules || !blocks || !bookings || !holidays || !events) {
        return [];
      }
      
      console.log('Calculando slots disponíveis com eventos:', events);
      
      const dayOfWeek = selectedDate.getDay();
      const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek);
      if (!daySchedule) return [];
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const isHoliday = holidays.some(h => h.date === dateStr);
      
      let basePrice = daySchedule.price;
      if (isHoliday && daySchedule.price_holiday) {
        basePrice = daySchedule.price_holiday;
      } else if (isWeekend(selectedDate) && daySchedule.price_weekend) {
        basePrice = daySchedule.price_weekend;
      }
      
      const slots: AvailableTimeSlot[] = [];
      const slotDuration = daySchedule.min_booking_time;
      
      const startTime = parse(daySchedule.start_time, 'HH:mm:ss', new Date());
      const endTime = parse(daySchedule.end_time, 'HH:mm:ss', new Date());
      
      let current = startTime;
      while (isBefore(current, endTime)) {
        const slotStart = format(current, 'HH:mm');
        const slotEnd = format(addMinutes(current, slotDuration), 'HH:mm');
        
        let available = true;
        let blockReason = null;
        
        // Verificar bloqueios de horário configurados
        for (const block of blocks) {
          const blockStart = new Date(block.start_datetime);
          const blockEnd = new Date(block.end_datetime);
          
          const slotStartDate = parse(`${dateStr} ${slotStart}`, 'yyyy-MM-dd HH:mm', new Date());
          const slotEndDate = parse(`${dateStr} ${slotEnd}`, 'yyyy-MM-dd HH:mm', new Date());
          
          if (
            (isAfter(slotStartDate, blockStart) && isBefore(slotStartDate, blockEnd)) ||
            (isAfter(slotEndDate, blockStart) && isBefore(slotEndDate, blockEnd)) ||
            (isBefore(slotStartDate, blockStart) && isAfter(slotEndDate, blockEnd)) ||
            isSameTimeExact(slotStartDate, blockStart) ||
            isSameTimeExact(slotEndDate, blockEnd)
          ) {
            available = false;
            blockReason = block.reason;
            console.log(`Horário ${slotStart}-${slotEnd} bloqueado: ${blockReason}`);
            break;
          }
        }
        
        // Verificar reservas existentes
        if (available) {
          for (const booking of bookings) {
            if (booking.start_time <= slotStart && booking.end_time > slotStart) {
              available = false;
              blockReason = 'Horário já reservado';
              break;
            }
          }
        }
        
        // Verificar eventos - Melhorado para considerar bloqueios de eventos corretamente
        if (available && events.length > 0) {
          for (const event of events) {
            const eventStartDateTime = new Date(event.start_datetime);
            const eventEndDateTime = new Date(event.end_datetime);
            
            // Convertendo o slot para datetime completo para comparação precisa
            const slotStartDate = parse(`${dateStr} ${slotStart}`, 'yyyy-MM-dd HH:mm', new Date());
            const slotEndDate = parse(`${dateStr} ${slotEnd}`, 'yyyy-MM-dd HH:mm', new Date());
            
            // Verificar se o slot está dentro do período do evento
            if (
              // O início do slot está dentro do evento
              (isAfter(slotStartDate, eventStartDateTime) && isBefore(slotStartDate, eventEndDateTime)) ||
              // O fim do slot está dentro do evento
              (isAfter(slotEndDate, eventStartDateTime) && isBefore(slotEndDate, eventEndDateTime)) ||
              // O slot cobre todo o evento
              (isBefore(slotStartDate, eventStartDateTime) && isAfter(slotEndDate, eventEndDateTime)) ||
              // O slot começa exatamente no início do evento
              isSameTimeExact(slotStartDate, eventStartDateTime) ||
              // O slot termina exatamente no fim do evento
              isSameTimeExact(slotEndDate, eventEndDateTime)
            ) {
              available = false;
              blockReason = `Quadra reservada para evento: ${event.name}`;
              console.log(`Horário ${slotStart}-${slotEnd} bloqueado por evento: ${event.name}`);
              break;
            }
          }
        }
        
        slots.push({
          id: `${courtId}-${slotStart}`,
          startTime: slotStart,
          endTime: slotEnd,
          price: basePrice,
          available,
          blockReason
        });
        
        current = addMinutes(current, slotDuration);
      }
      
      console.log(`Slots disponíveis gerados: ${slots.length}, disponíveis: ${slots.filter(s => s.available).length}`);
      return slots;
    },
    enabled: !!courtId && !!selectedDate && !isLoadingSchedules && !isLoadingBlocks && !isLoadingBookings && !isLoadingHolidays && !isLoadingEvents
  });
}

// Função auxiliar para comparar precisamente datas e horas
function isSameTimeExact(date1: Date, date2: Date): boolean {
  return date1.getHours() === date2.getHours() && 
         date1.getMinutes() === date2.getMinutes() &&
         date1.getSeconds() === date2.getSeconds() &&
         date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}
