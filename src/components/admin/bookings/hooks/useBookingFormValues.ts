import { useState } from 'react';
import { Booking, BookingStatus } from '@/types';

interface BookingFormData {
  userId: string;
  courtId: string;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  amount: number;
  status: BookingStatus;
  paymentStatus: string;
  isMonthly: boolean;
  subscriptionEndDate?: Date;
  notes: string;
}

export const useBookingFormValues = (booking?: Booking) => {
  const [bookingData, setBookingData] = useState<BookingFormData>({
    userId: booking?.user_id || '',
    courtId: booking?.court_id || '',
    bookingDate: booking?.booking_date ? new Date(booking.booking_date) : new Date(),
    startTime: booking?.start_time || '08:00',
    endTime: booking?.end_time || '09:00',
    amount: booking?.amount || 0,
    status: (booking?.status as BookingStatus) || 'pending',
    paymentStatus: booking?.payment_status || 'pending',
    isMonthly: booking?.is_monthly || false,
    subscriptionEndDate: booking?.subscription_end_date
      ? new Date(booking.subscription_end_date)
      : undefined,
    notes: booking?.notes || '',
  });

  const setFieldValue = <K extends keyof BookingFormData>(
    key: K,
    value: BookingFormData[K]
  ) => {
    setBookingData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return {
    bookingData,
    setFieldValue,
  };
};
