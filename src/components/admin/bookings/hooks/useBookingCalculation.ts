
import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { differenceInHours, eachWeekOfInterval, startOfDay, endOfDay } from 'date-fns';
import { fetchApplicableSchedules, calculateTotalAmount } from '../booking-utils';
import { toast } from '@/hooks/use-toast';
import { BookingFormValues } from '../booking-schema';

export function useBookingCalculation({
  watchCourtId,
  watchStartTime,
  watchEndTime,
  watchBookingDate,
  watchIsMonthly,
  watchSubscriptionEndDate,
  form
}: {
  watchCourtId: string;
  watchStartTime: string;
  watchEndTime: string;
  watchBookingDate: Date;
  watchIsMonthly: boolean;
  watchSubscriptionEndDate?: Date;
  form: UseFormReturn<BookingFormValues>;
}) {
  const [courtRate, setCourtRate] = useState(0);
  const [weeks, setWeeks] = useState(0);
  const [selectedSchedules, setSelectedSchedules] = useState<any[]>([]);
  const [bookingHours, setBookingHours] = useState(0);

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

  return {
    courtRate,
    bookingHours,
    selectedSchedules,
    weeks
  };
}
