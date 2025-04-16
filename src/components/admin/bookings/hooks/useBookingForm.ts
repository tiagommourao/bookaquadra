
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, differenceInHours, eachWeekOfInterval, startOfDay, endOfDay, addWeeks, isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types';
import { bookingSchema, BookingFormValues } from '../booking-schema';
import { toast } from '@/hooks/use-toast';
import { checkBookingConflict, calculateTotalAmount, fetchApplicableSchedules } from '../booking-utils';

export function useBookingForm({ booking, onClose }: { 
  booking: Booking | null; 
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingSchedule, setIsValidatingSchedule] = useState(false);
  const [scheduleConflict, setScheduleConflict] = useState(false);
  const [courtRate, setCourtRate] = useState(0);
  const [weeks, setWeeks] = useState(0);
  const [selectedSchedules, setSelectedSchedules] = useState<any[]>([]);
  const [bookingHours, setBookingHours] = useState(0);
  
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      user_id: '',
      court_id: '',
      booking_date: new Date(),
      start_time: '08:00',
      end_time: '09:00',
      amount: 0,
      status: 'pending',
      payment_status: 'pending',
      notes: '',
      is_monthly: false,
      subscription_end_date: undefined
    }
  });

  const watchCourtId = form.watch('court_id');
  const watchStartTime = form.watch('start_time');
  const watchEndTime = form.watch('end_time');
  const watchBookingDate = form.watch('booking_date');
  const watchIsMonthly = form.watch('is_monthly');
  const watchSubscriptionEndDate = form.watch('subscription_end_date');

  // Set form values when editing a booking
  useEffect(() => {
    if (booking && form) {
      // Preserve the date exactly as it was selected, without timezone adjustments
      const dateStr = booking.booking_date;
      let bookingDate: Date;
      
      if (typeof dateStr === 'string') {
        // If it's a string, parse it as YYYY-MM-DD
        const [year, month, day] = dateStr.split('-').map(Number);
        // Note: months are 0-indexed in JavaScript Date
        bookingDate = new Date(year, month - 1, day, 12, 0, 0);
      } else if (dateStr instanceof Date) {
        // If it's already a Date object, use it directly
        bookingDate = dateStr;
      } else {
        // Fallback to current date if booking_date is invalid
        bookingDate = new Date();
      }
      
      const formValues: Partial<BookingFormValues> = {
        user_id: booking.user_id,
        court_id: booking.court_id,
        booking_date: bookingDate,
        // Make sure to preserve start and end times exactly as they were
        start_time: booking.start_time,
        end_time: booking.end_time,
        amount: Number(booking.amount),
        status: booking.status,
        payment_status: booking.payment_status,
        notes: booking.notes || '',
        is_monthly: booking.is_monthly || false,
      };
      
      // Handle subscription end date if it exists
      if (booking.subscription_end_date) {
        const subDateStr = booking.subscription_end_date;
        let subscriptionEndDate: Date;
        
        if (typeof subDateStr === 'string') {
          // If it's a string, parse it as YYYY-MM-DD
          const [year, month, day] = subDateStr.split('-').map(Number);
          subscriptionEndDate = new Date(year, month - 1, day, 12, 0, 0);
        } else if (subDateStr instanceof Date) {
          // If it's already a Date object, use it directly
          subscriptionEndDate = subDateStr;
        } else {
          // Fallback to a month from now if invalid
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          subscriptionEndDate = nextMonth;
        }
        
        formValues.subscription_end_date = subscriptionEndDate;
      }
      
      form.reset(formValues);
    } else if (!booking) {
      form.reset({
        user_id: '',
        court_id: '',
        booking_date: new Date(),
        start_time: '08:00',
        end_time: '09:00',
        amount: 0,
        status: 'pending',
        payment_status: 'pending',
        notes: '',
        is_monthly: false,
        subscription_end_date: undefined
      });
    }
  }, [booking, form]);

  // Calculate amount based on selected court, time, and date
  useEffect(() => {
    if (watchCourtId && watchStartTime && watchEndTime && watchBookingDate) {
      const calculateAmount = async () => {
        try {
          const [startHour, startMin] = watchStartTime.split(':').map(Number);
          const [endHour, endMin] = watchEndTime.split(':').map(Number);
          
          // Create Date objects for start and end times
          const startDate = new Date(watchBookingDate);
          startDate.setHours(startHour, startMin, 0, 0);
          
          const endDate = new Date(watchBookingDate);
          endDate.setHours(endHour, endMin, 0, 0);
          
          // If end time is before start time, assume it's the next day
          if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
          }
          
          // Calculate hours difference
          const diffHours = differenceInHours(endDate, startDate);
          
          if (diffHours <= 0) {
            setCourtRate(0);
            setBookingHours(0);
            form.setValue('amount', 0);
            return;
          }
          
          setBookingHours(diffHours);
          
          // Get day of week (0 = Sunday, 6 = Saturday)
          const bookingDay = watchBookingDate.getDay();
          // Convert to schedule format (0 = Monday, 6 = Sunday)
          const dayOfWeek = bookingDay === 0 ? 6 : bookingDay - 1;

          // Get applicable schedules
          const schedules = await fetchApplicableSchedules(watchCourtId, watchBookingDate, bookingDay);
          
          if (!schedules || schedules.length === 0) {
            console.error('No schedules found for this court and day');
            setSelectedSchedules([]);
            form.setValue('amount', 0);
            setCourtRate(0);
            return;
          }

          // Check if the date is weekend
          const isWeekend = [0, 6].includes(bookingDay); // 0 = Sunday, 6 = Saturday
          
          // Find all schedule blocks that overlap with the booking time
          const overlappingSchedules = schedules.filter(schedule => {
            const [schStartHour, schStartMin] = schedule.start_time.split(':').map(Number);
            const [schEndHour, schEndMin] = schedule.end_time.split(':').map(Number);
            
            const scheduleStart = new Date(watchBookingDate);
            scheduleStart.setHours(schStartHour, schStartMin, 0, 0);
            
            const scheduleEnd = new Date(watchBookingDate);
            scheduleEnd.setHours(schEndHour, schEndMin, 0, 0);
            
            // If schedule end is before schedule start, assume it spans to the next day
            if (scheduleEnd < scheduleStart) {
              scheduleEnd.setDate(scheduleEnd.getDate() + 1);
            }
            
            // Check if there is an overlap between booking time and schedule block
            return (startDate < scheduleEnd && endDate > scheduleStart);
          });
          
          setSelectedSchedules(overlappingSchedules);
          
          if (overlappingSchedules.length === 0) {
            toast({
              title: 'Horário inválido',
              description: 'O horário selecionado não está disponível para esta quadra',
              variant: 'destructive'
            });
            form.setValue('amount', 0);
            setCourtRate(0);
            return;
          }

          // Calculate weekly count for monthly bookings
          let weekCount = 1;
          
          // Calculate total weeks if it's a monthly booking
          if (watchIsMonthly && watchSubscriptionEndDate) {
            const weeksList = eachWeekOfInterval({
              start: startOfDay(watchBookingDate),
              end: endOfDay(watchSubscriptionEndDate)
            });
            
            weekCount = weeksList.length;
            setWeeks(weekCount);
          }
          
          // Calculate total amount
          const totalAmount = calculateTotalAmount(
            watchStartTime,
            watchEndTime,
            watchBookingDate,
            overlappingSchedules,
            watchIsMonthly,
            weekCount
          );
          
          // Update form with calculated amount
          form.setValue('amount', totalAmount);
          
          // Set court rate display value - use the weekend price if it's a weekend
          if (overlappingSchedules.length > 0) {
            const primarySchedule = overlappingSchedules[0];
            const baseRate = isWeekend && primarySchedule.price_weekend 
              ? primarySchedule.price_weekend 
              : primarySchedule.price;
            setCourtRate(baseRate);
          }
        } catch (error) {
          console.error('Error calculating court rate:', error);
          form.setValue('amount', 0);
        }
      };
      
      calculateAmount();
    }
  }, [watchCourtId, watchStartTime, watchEndTime, watchBookingDate, watchIsMonthly, watchSubscriptionEndDate, form]);

  // Validate booking availability
  useEffect(() => {
    if (watchCourtId && watchStartTime && watchEndTime && watchBookingDate) {
      const validateBookingAvailability = async () => {
        setIsValidatingSchedule(true);
        setScheduleConflict(false);
        
        try {
          const hasConflict = await checkBookingConflict(
            watchCourtId,
            watchBookingDate,
            watchStartTime,
            watchEndTime,
            booking?.id
          );
          
          setScheduleConflict(hasConflict);
        } finally {
          setIsValidatingSchedule(false);
        }
      };
      
      validateBookingAvailability();
    }
  }, [watchCourtId, watchStartTime, watchEndTime, watchBookingDate, booking]);

  const createRecurringBookings = async (values: BookingFormValues, mainBookingId: string) => {
    if (!values.is_monthly || !values.subscription_end_date || !values.booking_date) {
      return;
    }
    
    try {
      // Create a series of weekly bookings from start date to end date
      const startDate = values.booking_date;
      const endDate = values.subscription_end_date;
      
      let currentDate = addWeeks(startDate, 1); // Start from next week
      const weeklyBookings = [];
      
      // Generate all weekly booking dates between start and end
      while (currentDate <= endDate) {
        weeklyBookings.push(currentDate);
        currentDate = addWeeks(currentDate, 1);
      }
      
      // Format the date as YYYY-MM-DD
      const formatDateForDB = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Create booking entries for each week
      for (const weeklyDate of weeklyBookings) {
        const bookingData = {
          user_id: values.user_id,
          court_id: values.court_id,
          booking_date: formatDateForDB(weeklyDate),
          start_time: values.start_time,
          end_time: values.end_time,
          amount: values.amount / weeklyBookings.length + 1, // Divide amount among all bookings
          status: values.status,
          payment_status: values.payment_status,
          notes: `${values.notes || ''} (Parte de reserva mensal: ${mainBookingId})`,
          is_monthly: false, // Individual bookings aren't monthly themselves
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null
        };
        
        const { error } = await supabase
          .from('bookings')
          .insert(bookingData);
          
        if (error) {
          console.error(`Error creating recurring booking for ${formatDateForDB(weeklyDate)}:`, error);
        }
      }
      
      toast({
        title: 'Reservas recorrentes criadas',
        description: `Foram criadas ${weeklyBookings.length} reservas semanais até ${format(endDate, 'dd/MM/yyyy')}`
      });
      
    } catch (error) {
      console.error('Error creating recurring bookings:', error);
      toast({
        title: 'Erro ao criar reservas recorrentes',
        description: 'Algumas reservas recorrentes podem não ter sido criadas',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (values: BookingFormValues) => {
    if (selectedSchedules.length === 0) {
      toast({
        title: 'Horário inválido',
        description: 'Não foi possível encontrar um horário disponível para esta quadra no dia e horário selecionados.',
        variant: 'destructive'
      });
      return;
    }

    const [startHour, startMin] = values.start_time.split(':').map(Number);
    const [endHour, endMin] = values.end_time.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startHour, startMin, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(endHour, endMin, 0, 0);
    
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const diffHours = differenceInHours(endDate, startDate);
    if (diffHours < 1) {
      toast({
        title: 'Tempo insuficiente',
        description: `A reserva deve ter no mínimo 1 hora de duração.`,
        variant: 'destructive'
      });
      return;
    }
    
    if (scheduleConflict) {
      toast({
        title: 'Conflito de horários',
        description: 'Já existe uma reserva para este horário.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format the date as YYYY-MM-DD without any timezone adjustments
      const formatDateForDB = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const bookingData = {
        user_id: values.user_id,
        court_id: values.court_id,
        booking_date: formatDateForDB(values.booking_date),
        start_time: values.start_time,
        end_time: values.end_time,
        amount: values.amount,
        status: values.status,
        payment_status: values.payment_status,
        notes: values.notes,
        is_monthly: values.is_monthly,
        subscription_end_date: values.is_monthly && values.subscription_end_date ? 
          formatDateForDB(values.subscription_end_date) : 
          null,
        updated_at: new Date().toISOString()
      };
      
      if (booking) {
        const { error, data } = await supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', booking.id)
          .select();
        
        if (error) throw error;
        
        toast({
          title: 'Reserva atualizada',
          description: 'A reserva foi atualizada com sucesso',
        });
        
        // Handle recurring bookings if it's a monthly booking
        if (values.is_monthly && values.subscription_end_date && !booking.is_monthly) {
          await createRecurringBookings(values, booking.id);
        }
      } else {
        const { error, data } = await supabase
          .from('bookings')
          .insert({
            ...bookingData,
            created_by: null
          })
          .select();
        
        if (error) throw error;
        
        toast({
          title: 'Reserva criada',
          description: 'A reserva foi criada com sucesso',
        });
        
        // Create recurring weekly bookings if it's a monthly booking
        if (data && data[0] && values.is_monthly && values.subscription_end_date) {
          await createRecurringBookings(values, data[0].id);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar reserva:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a reserva',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    courtRate,
    bookingHours,
    selectedSchedules,
    weeks,
    scheduleConflict,
    isValidatingSchedule,
    watchIsMonthly,
    handleSubmit
  };
}
