import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, differenceInHours, eachWeekOfInterval, startOfDay, endOfDay, addWeeks, addDays, isSameDay, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types';
import { bookingFormSchema, BookingFormValues } from '../booking-schema';
import { toast } from '@/hooks/use-toast';
import { useBookingFormValues } from './useBookingFormValues';
import { useBookingAvailability } from './useBookingAvailability';
import { useBookingCalculation } from './useBookingCalculation';
import { useBookingSubmission } from './useBookingSubmission';

export function useBookingForm({ booking, onClose }: { 
  booking: Booking | null; 
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with default values
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
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

  // Watch key form values
  const watchCourtId = form.watch('court_id');
  const watchStartTime = form.watch('start_time');
  const watchEndTime = form.watch('end_time');
  const watchBookingDate = form.watch('booking_date');
  const watchIsMonthly = form.watch('is_monthly');
  const watchSubscriptionEndDate = form.watch('subscription_end_date');
  
  // Use specialized hooks for different aspects of booking form functionality
  const formValues = useBookingFormValues({ booking, form: form.control });
  
  const { scheduleConflict, isValidatingSchedule } = useBookingAvailability({
    watchCourtId,
    watchStartTime,
    watchEndTime,
    watchBookingDate,
    bookingId: booking?.id
  });
  
  const { courtRate, bookingHours, selectedSchedules, weeks } = useBookingCalculation({
    watchCourtId,
    watchStartTime,
    watchEndTime, 
    watchBookingDate,
    watchIsMonthly,
    watchSubscriptionEndDate,
    form
  });
  
  const { handleSubmit } = useBookingSubmission({
    booking,
    onClose,
    selectedSchedules,
    scheduleConflict,
    setIsSubmitting,
    form
  });

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
