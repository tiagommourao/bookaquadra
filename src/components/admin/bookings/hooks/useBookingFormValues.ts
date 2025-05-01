
import { useEffect } from 'react';
import { Control } from 'react-hook-form';
import { Booking } from '@/types';
import { BookingFormValues } from '../booking-schema';
import { parseISO } from 'date-fns';

export const useBookingFormValues = ({ 
  booking, 
  form 
}: { 
  booking: Booking | null; 
  form: Control<BookingFormValues>;
}) => {
  const setValue = (form as any)._formState.setValue;
  
  // Preencher o formulário com valores iniciais do booking (se existir)
  useEffect(() => {
    if (booking) {
      // Garantir que temos uma função setValue válida
      if (typeof setValue === 'function') {
        // Definir valores iniciais baseados no booking existente
        setValue('user_id', booking.user_id);
        setValue('court_id', booking.court_id);
        setValue('booking_date', parseISO(booking.booking_date.toString()));
        setValue('start_time', booking.start_time);
        setValue('end_time', booking.end_time);
        setValue('amount', booking.amount);
        setValue('status', booking.status || 'pending');
        setValue('payment_status', booking.payment_status || 'pending');
        setValue('notes', booking.notes || '');
        setValue('is_monthly', booking.is_monthly || false);
        
        // Definir data final da assinatura se for mensal
        if (booking.subscription_end_date) {
          setValue('subscription_end_date', parseISO(booking.subscription_end_date.toString()));
        }
      }
    }
  }, [booking, setValue]);

  return {};
};
