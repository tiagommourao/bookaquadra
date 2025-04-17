
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AvailableTimeSlot, Schedule, ScheduleBlock, Holiday } from '@/types/court';
import { format, addMinutes, isWeekend, parse, isAfter, isBefore } from 'date-fns';

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

export function useAvailableTimeSlots(courtId: string | null, selectedDate: Date | null) {
  const { data: schedules, isLoading: isLoadingSchedules } = useSchedules(courtId);
  const { data: blocks, isLoading: isLoadingBlocks } = useScheduleBlocks(courtId, selectedDate);
  const { data: bookings, isLoading: isLoadingBookings } = useBookingsForCourt(courtId, selectedDate);
  const { data: holidays, isLoading: isLoadingHolidays } = useHolidays();
  
  return useQuery({
    queryKey: ['availableTimeSlots', courtId, selectedDate, schedules, blocks, bookings, holidays],
    queryFn: (): AvailableTimeSlot[] => {
      if (!courtId || !selectedDate || !schedules || !blocks || !bookings || !holidays) {
        return [];
      }
      
      // Determine day of week (0-6, where 0 is Sunday)
      const dayOfWeek = selectedDate.getDay();
      
      // Find applicable schedule for this day
      const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek);
      if (!daySchedule) return []; // No schedule for this day
      
      // Check if it's a holiday
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const isHoliday = holidays.some(h => h.date === dateStr);
      
      // Determine price based on day type
      let basePrice = daySchedule.price;
      if (isHoliday && daySchedule.price_holiday) {
        basePrice = daySchedule.price_holiday;
      } else if (isWeekend(selectedDate) && daySchedule.price_weekend) {
        basePrice = daySchedule.price_weekend;
      }
      
      // Generate time slots
      const slots: AvailableTimeSlot[] = [];
      const slotDuration = daySchedule.min_booking_time; // in minutes
      
      const startTime = parse(daySchedule.start_time, 'HH:mm:ss', new Date());
      const endTime = parse(daySchedule.end_time, 'HH:mm:ss', new Date());
      
      let current = startTime;
      while (isBefore(current, endTime)) {
        const slotStart = format(current, 'HH:mm');
        const slotEnd = format(addMinutes(current, slotDuration), 'HH:mm');
        
        // Check if this slot is available
        let available = true;
        let blockReason = null;
        
        // Check if blocked by admin
        for (const block of blocks) {
          const blockStart = new Date(block.start_datetime);
          const blockEnd = new Date(block.end_datetime);
          
          const slotStartDate = parse(`${dateStr} ${slotStart}`, 'yyyy-MM-dd HH:mm', new Date());
          const slotEndDate = parse(`${dateStr} ${slotEnd}`, 'yyyy-MM-dd HH:mm', new Date());
          
          if (
            (isAfter(slotStartDate, blockStart) && isBefore(slotStartDate, blockEnd)) ||
            (isAfter(slotEndDate, blockStart) && isBefore(slotEndDate, blockEnd)) ||
            (isBefore(slotStartDate, blockStart) && isAfter(slotEndDate, blockEnd))
          ) {
            available = false;
            blockReason = block.reason;
            break;
          }
        }
        
        // Check if already booked
        if (available) {
          for (const booking of bookings) {
            if (booking.start_time <= slotStart && booking.end_time > slotStart) {
              available = false;
              blockReason = 'Horário já reservado';
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
      
      return slots;
    },
    enabled: !!courtId && !!selectedDate && !isLoadingSchedules && !isLoadingBlocks && !isLoadingBookings && !isLoadingHolidays
  });
}
