
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, differenceInHours, eachWeekOfInterval, startOfDay, endOfDay } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Booking } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BookingForm } from './BookingForm';
import { bookingSchema, BookingFormValues } from './booking-schema';
import { checkBookingConflict, fetchApplicableSchedules, calculateTotalAmount } from './booking-utils';

interface BookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  booking,
  isOpen,
  onClose
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingSchedule, setIsValidatingSchedule] = useState(false);
  const [scheduleConflict, setScheduleConflict] = useState(false);
  const [courtRate, setCourtRate] = useState(0);
  const [weeks, setWeeks] = useState(0);
  const [selectedSchedules, setSelectedSchedules] = useState<any[]>([]);
  const [bookingHours, setBookingHours] = useState(0);
  
  const { data: users } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: courts } = useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

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
          const schedules = await fetchApplicableSchedules(watchCourtId, watchBookingDate, dayOfWeek);
          
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

  useEffect(() => {
    if (booking) {
      const bookingDate = booking.booking_date instanceof Date ? 
        booking.booking_date : 
        new Date(booking.booking_date);
      
      const formValues: Partial<BookingFormValues> = {
        user_id: booking.user_id,
        court_id: booking.court_id,
        booking_date: bookingDate,
        start_time: booking.start_time,
        end_time: booking.end_time,
        amount: Number(booking.amount),
        status: booking.status,
        payment_status: booking.payment_status,
        notes: booking.notes || '',
        is_monthly: booking.is_monthly || false,
        subscription_end_date: booking.subscription_end_date ? 
          (booking.subscription_end_date instanceof Date ? 
            booking.subscription_end_date : 
            new Date(booking.subscription_end_date)) : 
          undefined
      };
      
      form.reset(formValues);
    } else {
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

  const onSubmit = async (values: BookingFormValues) => {
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
      const bookingData = {
        user_id: values.user_id,
        court_id: values.court_id,
        booking_date: format(values.booking_date, 'yyyy-MM-dd'),
        start_time: values.start_time,
        end_time: values.end_time,
        amount: values.amount,
        status: values.status,
        payment_status: values.payment_status,
        notes: values.notes,
        is_monthly: values.is_monthly,
        subscription_end_date: values.is_monthly && values.subscription_end_date ? 
          format(values.subscription_end_date, 'yyyy-MM-dd') : 
          null,
        updated_at: new Date().toISOString()
      };
      
      if (booking) {
        const { error } = await supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', booking.id);
        
        if (error) throw error;
        
        toast({
          title: 'Reserva atualizada',
          description: 'A reserva foi atualizada com sucesso',
        });
      } else {
        const { error } = await supabase
          .from('bookings')
          .insert({
            ...bookingData,
            created_by: null
          });
        
        if (error) throw error;
        
        toast({
          title: 'Reserva criada',
          description: 'A reserva foi criada com sucesso',
        });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {booking ? 'Detalhes da Reserva' : 'Nova Reserva'}
          </DialogTitle>
          <DialogDescription>
            {booking
              ? 'Visualize ou edite os detalhes da reserva'
              : 'Crie uma nova reserva no sistema'}
          </DialogDescription>
        </DialogHeader>

        <BookingForm 
          form={form}
          users={users}
          courts={courts}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          courtRate={courtRate}
          bookingHours={bookingHours}
          selectedSchedules={selectedSchedules}
          weeks={weeks}
          scheduleConflict={scheduleConflict}
          isValidatingSchedule={isValidatingSchedule}
          watchIsMonthly={watchIsMonthly}
          onCancel={onClose}
          isUpdating={!!booking}
        />
      </DialogContent>
    </Dialog>
  );
};
