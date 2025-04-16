
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { parseISO } from 'date-fns';
import { Booking } from '@/types';
import { BookingFormValues } from '../booking-schema';

export function useBookingFormValues({ 
  booking, 
  form 
}: { 
  booking: Booking | null; 
  form: UseFormReturn<BookingFormValues>;
}) {
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
}
