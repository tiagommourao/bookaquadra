
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  format, 
  isToday, 
  isFuture, 
  isPast, 
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWeekend,
  startOfWeek,
  endOfWeek,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Booking, BookingStatus, Court } from '@/types';

export function useBookingsData() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDayDetails, setSelectedDayDetails] = useState<Date | null>(null);
  
  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      return {
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate)
      };
    } else {
      return {
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      };
    }
  }, [selectedDate, viewMode]);

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end
    });
  }, [dateRange]);

  const { data: courts } = useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Court[];
    }
  });

  const { data: allBookings, isLoading, error, refetch } = useQuery({
    queryKey: ['bookings', dateRange.start, dateRange.end, selectedCourt, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (first_name, last_name, phone),
          court:court_id (name)
        `)
        .gte('booking_date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('booking_date', format(dateRange.end, 'yyyy-MM-dd'));
      
      if (selectedCourt !== 'all') {
        query = query.eq('court_id', selectedCourt);
      }
      
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      
      query = query.order('booking_date');
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as (Booking & {
        profiles: { first_name: string | null; last_name: string | null; phone: string | null };
        court: { name: string };
      })[];
    }
  });

  const getBookingDate = (booking: Booking): Date => {
    if (typeof booking.booking_date === 'string') {
      return parseISO(booking.booking_date);
    }
    return booking.booking_date;
  };

  // Modificada para filtrar reservas canceladas no calendário, mas mostrá-las na lista de detalhes do dia
  const getBookingsForDay = (day: Date, includeAllStatuses = false) => {
    if (!allBookings) return [];
    
    const startOfTargetDay = startOfDay(day);
    
    return allBookings.filter(booking => {
      const bookingDate = getBookingDate(booking);
      const bookingDayStart = startOfDay(bookingDate);
      
      // Se includeAllStatuses for verdadeiro (para exibição detalhada), retorna todas
      // Caso contrário, filtra as canceladas (para o calendário)
      return bookingDayStart.getTime() === startOfTargetDay.getTime() && 
             (includeAllStatuses || booking.status !== 'cancelled');
    });
  };

  const periodStats = useMemo(() => {
    if (!allBookings) {
      return {
        totalBookings: 0,
        pendingBookings: 0,
        paidBookings: 0,
        totalRevenue: 0
      };
    }

    const periodBookings = allBookings.filter(booking => {
      const bookingDate = getBookingDate(booking);
      const bookingDayStart = startOfDay(bookingDate);
      const rangeStart = startOfDay(dateRange.start);
      const rangeEnd = startOfDay(dateRange.end);
      
      // Inclui apenas reservas não canceladas para estatísticas
      return (
        bookingDayStart.getTime() >= rangeStart.getTime() && 
        bookingDayStart.getTime() <= rangeEnd.getTime() &&
        booking.status !== 'cancelled'
      );
    });

    return {
      totalBookings: periodBookings.length,
      pendingBookings: periodBookings.filter(b => b.status === 'pending').length,
      paidBookings: periodBookings.filter(b => b.payment_status === 'paid').length,
      totalRevenue: periodBookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, booking) => sum + Number(booking.amount), 0)
    };
  }, [allBookings, dateRange]);

  const getCellColor = (bookings: (Booking & {
    profiles: { first_name: string | null; last_name: string | null; phone: string | null };
    court: { name: string };
  })[]) => {
    if (bookings.length === 0) return 'bg-white';
    
    const maxBookingsBeforeRed = 10;
    const ratio = Math.min(bookings.length / maxBookingsBeforeRed, 1);
    
    if (ratio < 0.3) return 'bg-green-50 hover:bg-green-100';
    if (ratio < 0.7) return 'bg-yellow-50 hover:bg-yellow-100';
    return 'bg-red-50 hover:bg-red-100';
  };

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // Mostra todas as reservas na tabela de detalhes, incluindo canceladas
  const selectedDayBookings = selectedDayDetails 
    ? getBookingsForDay(selectedDayDetails, true) 
    : [];

  return {
    selectedDate,
    setSelectedDate,
    selectedCourt,
    setSelectedCourt,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    selectedDayDetails,
    setSelectedDayDetails,
    dateRange,
    calendarDays,
    courts,
    allBookings,
    isLoading,
    error,
    refetch,
    getBookingsForDay,
    periodStats,
    getCellColor,
    weekDays,
    selectedDayBookings
  };
}

