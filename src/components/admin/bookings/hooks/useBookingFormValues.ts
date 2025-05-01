import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { parseISO } from 'date-fns';
import { Booking } from '@/types';
import { PaymentStatus } from '@/types/payment';
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
      // Convert date string to Date object, preserving the exact day
      let bookingDate: Date;
      
      if (typeof booking.booking_date === 'string') {
        // Ensure the date is processed correctly without timezone adjustment
        bookingDate = parseISO(booking.booking_date);
      } else {
        bookingDate = booking.booking_date;
      }
      
      const formValues: Partial<BookingFormValues> = {
        user_id: booking.user_id,
        court_id: booking.court_id,
        booking_date: bookingDate,
        // Make sure time values match the HH:MM format required by the form
        start_time: booking.start_time.substring(0, 5), // Ensure format is HH:MM
        end_time: booking.end_time.substring(0, 5),     // Ensure format is HH:MM
        amount: Number(booking.amount),
        status: booking.status as "pending" | "confirmed" | "cancelled" | "completed" | "no_show",
        payment_status: booking.payment_status as PaymentStatus,
        notes: booking.notes || '',
        is_monthly: booking.is_monthly || false,
      };
      
      // Handle subscription end date if it exists
      if (booking.subscription_end_date) {
        let subscriptionEndDate: Date;
        
        if (typeof booking.subscription_end_date === 'string') {
          // Convert string to Date without timezone adjustments
          subscriptionEndDate = parseISO(booking.subscription_end_date);
        } else {
          subscriptionEndDate = booking.subscription_end_date;
        }
        
        formValues.subscription_end_date = subscriptionEndDate;
      }
      
      console.log('Setting form values for booking edit:', formValues);
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
