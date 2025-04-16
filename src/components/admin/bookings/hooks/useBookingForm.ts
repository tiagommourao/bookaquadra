
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, differenceInHours, eachWeekOfInterval, startOfDay, endOfDay, addWeeks, isSameDay, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types';
import { bookingSchema, BookingFormValues } from '../booking-schema';
import { toast } from '@/hooks/use-toast';
import { checkBookingConflict, calculateTotalAmount, fetchApplicableSchedules, formatDateForDB } from '../booking-utils';

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
      // Converte a string da data para objeto Date, preservando o dia exato
      let bookingDate: Date;
      
      if (typeof booking.booking_date === 'string') {
        // Garante que a data seja processada corretamente sem ajuste de timezone
        bookingDate = parseISO(booking.booking_date);
      } else {
        bookingDate = booking.booking_date;
      }
      
      const formValues: Partial<BookingFormValues> = {
        user_id: booking.user_id,
        court_id: booking.court_id,
        booking_date: bookingDate,
        // Mantém os horários de início e fim exatamente como foram salvos
        start_time: booking.start_time,
        end_time: booking.end_time,
        amount: Number(booking.amount),
        status: booking.status,
        payment_status: booking.payment_status,
        notes: booking.notes || '',
        is_monthly: booking.is_monthly || false,
      };
      
      // Trata a data de fim da assinatura se existir
      if (booking.subscription_end_date) {
        let subscriptionEndDate: Date;
        
        if (typeof booking.subscription_end_date === 'string') {
          // Converte a string para Date sem ajustes de timezone
          subscriptionEndDate = parseISO(booking.subscription_end_date);
        } else {
          subscriptionEndDate = booking.subscription_end_date;
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
            }, { weekStartsOn: 1 }); // Definindo segunda-feira como início da semana
            
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

  const generateRecurringDates = (startDate: Date, endDate: Date): Date[] => {
    if (!startDate || !endDate) return [];
    
    // Pegamos o dia da semana da data inicial
    const dayOfWeek = startDate.getDay();
    let currentDate = new Date(startDate);
    const dates = [new Date(startDate)]; // Inclui a data inicial

    // Avança a data em 7 dias até chegar à data final ou ultrapassá-la
    while (true) {
      // Adiciona 7 dias para criar a próxima data (mesma semana a cada vez)
      currentDate = addDays(currentDate, 7);
      
      // Verifica se passou da data final
      if (currentDate > endDate) break;
      
      // Adiciona a nova data ao array
      dates.push(new Date(currentDate));
    }
    
    return dates;
  };

  const createRecurringBookings = async (values: BookingFormValues, mainBookingId: string) => {
    if (!values.is_monthly || !values.subscription_end_date || !values.booking_date) {
      return;
    }
    
    try {
      // Gera todas as datas recorrentes entre as datas de início e fim
      // EXCLUINDO a primeira data (que já foi criada como a reserva principal)
      const recurringDates = generateRecurringDates(values.booking_date, values.subscription_end_date).slice(1);
      
      if (recurringDates.length === 0) {
        console.log('Não há datas recorrentes para criar');
        return;
      }
      
      // Cria reservas para cada data recorrente
      for (const recurringDate of recurringDates) {
        const bookingData = {
          user_id: values.user_id,
          court_id: values.court_id,
          booking_date: formatDateForDB(recurringDate),
          start_time: values.start_time,
          end_time: values.end_time,
          amount: values.amount / (recurringDates.length + 1), // Divide o valor entre todas as reservas
          status: values.status,
          payment_status: values.payment_status,
          notes: `${values.notes || ''} (Parte de reserva mensal: ${mainBookingId})`,
          is_monthly: false, // As reservas individuais não são mensais
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null
        };
        
        const { error } = await supabase
          .from('bookings')
          .insert(bookingData);
          
        if (error) {
          console.error(`Erro ao criar reserva recorrente para ${formatDateForDB(recurringDate)}:`, error);
        }
      }
      
      toast({
        title: 'Reservas recorrentes criadas',
        description: `Foram criadas ${recurringDates.length} reservas semanais até ${format(values.subscription_end_date, 'dd/MM/yyyy')}`
      });
      
    } catch (error) {
      console.error('Erro ao criar reservas recorrentes:', error);
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
      // Usa a função auxiliar para formatar a data
      const bookingDateForDB = formatDateForDB(values.booking_date);
      
      const bookingData = {
        user_id: values.user_id,
        court_id: values.court_id,
        booking_date: bookingDateForDB,
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
