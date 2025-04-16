
import { format, differenceInHours, isBefore, addHours } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export const isFullHourTime = (value: string) => {
  const regex = /^([0-1]?[0-9]|2[0-3]):00$/;
  return regex.test(value);
};

export const fetchApplicableSchedules = async (courtId: string, bookingDate: Date, dayOfWeek: number) => {
  if (!courtId || !bookingDate) {
    return [];
  }
  
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('court_id', courtId)
    .eq('day_of_week', dayOfWeek);
    
  if (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
  
  return schedules || [];
};

export const checkBookingConflict = async (
  courtId: string, 
  bookingDate: Date,
  startTime: string,
  endTime: string,
  currentBookingId?: string
) => {
  if (!courtId || !bookingDate || !startTime || !endTime) {
    return false;
  }
  
  try {
    const bookingDateStr = format(bookingDate, 'yyyy-MM-dd');
    
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('court_id', courtId)
      .eq('booking_date', bookingDateStr)
      .neq('status', 'cancelled');
      
    if (error) {
      console.error('Error checking booking conflicts:', error);
      return false;
    }
    
    const conflict = existingBookings?.find(existingBooking => {
      if (currentBookingId && existingBooking.id === currentBookingId) return false;
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const [existingStartHour, existingStartMin] = existingBooking.start_time.split(':').map(Number);
      const [existingEndHour, existingEndMin] = existingBooking.end_time.split(':').map(Number);
      
      const newStart = new Date(bookingDateStr);
      newStart.setHours(startHour, startMin, 0, 0);
      
      const newEnd = new Date(bookingDateStr);
      newEnd.setHours(endHour, endMin, 0, 0);
      
      const existingStart = new Date(existingBooking.booking_date);
      existingStart.setHours(existingStartHour, existingStartMin, 0, 0);
      
      const existingEnd = new Date(existingBooking.booking_date);
      existingEnd.setHours(existingEndHour, existingEndMin, 0, 0);
      
      if (newStart < existingEnd && newEnd > existingStart) {
        return true;
      }
    });
    
    return !!conflict;
  } catch (error) {
    console.error('Error in checkBookingConflict:', error);
    return false;
  }
};

// Function to determine which schedule applies to a given hour
const findScheduleForHour = (schedules, hour, bookingDate) => {
  const bookingDay = bookingDate.getDay();
  const isWeekend = [0, 6].includes(bookingDay); // 0 = Sunday, 6 = Saturday
  
  for (const schedule of schedules) {
    const [startHour, startMin] = schedule.start_time.split(':').map(Number);
    const [endHour, endMin] = schedule.end_time.split(':').map(Number);
    
    // Create date objects for schedule times
    const scheduleStart = new Date(bookingDate);
    scheduleStart.setHours(startHour, startMin, 0, 0);
    
    const scheduleEnd = new Date(bookingDate);
    scheduleEnd.setHours(endHour, endMin, 0, 0);
    
    // Handle schedules that span to next day
    if (scheduleEnd <= scheduleStart) {
      scheduleEnd.setDate(scheduleEnd.getDate() + 1);
    }
    
    // Check if the hour falls within this schedule's range
    if (hour >= scheduleStart && hour < scheduleEnd) {
      // Return the schedule and the appropriate price based on weekend or weekday
      return {
        schedule,
        price: isWeekend && schedule.price_weekend ? schedule.price_weekend : schedule.price
      };
    }
  }
  
  // No schedule found for this hour
  return null;
};

export const calculateTotalAmount = (
  startTime: string,
  endTime: string,
  bookingDate: Date,
  schedules: any[],
  isMonthly: boolean,
  weekCount: number
) => {
  if (!startTime || !endTime || !bookingDate || schedules.length === 0) {
    return 0;
  }

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  // Create Date objects for start and end times
  const startDate = new Date(bookingDate);
  startDate.setHours(startHour, startMin, 0, 0);
  
  const endDate = new Date(bookingDate);
  endDate.setHours(endHour, endMin, 0, 0);
  
  // If end time is before start time, assume it's the next day
  if (endDate <= startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }
  
  // Calculate total booking cost by summing up hourly rates
  let totalAmount = 0;
  let currentHour = new Date(startDate);
  
  // Process each hour in the booking range
  while (currentHour < endDate) {
    // Find the applicable schedule and rate for this hour
    const scheduleInfo = findScheduleForHour(schedules, currentHour, bookingDate);
    
    if (!scheduleInfo) {
      console.warn(`No schedule found for time slot starting at ${format(currentHour, 'HH:mm')}`);
      // If we can't find a schedule for this hour, we might want to:
      // 1. Return an error
      // 2. Use a default rate
      // 3. Skip this hour
      // For now, we'll skip this hour
    } else {
      totalAmount += scheduleInfo.price;
    }
    
    // Move to next hour
    currentHour = addHours(currentHour, 1);
  }
  
  // Apply monthly discount if applicable
  if (isMonthly && schedules.length > 0) {
    // Find the highest monthly discount percentage among the schedules
    const monthlyDiscountPercent = Math.max(...schedules.map(s => s.monthly_discount || 0));
    
    if (monthlyDiscountPercent > 0) {
      totalAmount = totalAmount * (1 - monthlyDiscountPercent / 100);
    }
  }
  
  // Multiply by weeks for monthly bookings
  totalAmount = totalAmount * weekCount;
  
  return Number(totalAmount.toFixed(2));
};
