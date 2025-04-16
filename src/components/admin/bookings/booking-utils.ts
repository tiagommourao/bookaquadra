
import { format, differenceInHours, isBefore } from 'date-fns';
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

export const calculateTotalAmount = (
  startTime: string,
  endTime: string,
  bookingDate: Date,
  overlappingSchedules: any[],
  isMonthly: boolean,
  weekCount: number
) => {
  if (!startTime || !endTime || !bookingDate || overlappingSchedules.length === 0) {
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
  if (endDate < startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }
  
  // Calculate hours difference
  const diffHours = differenceInHours(endDate, startDate);
  
  if (diffHours <= 0) {
    return 0;
  }

  // Check if the date is weekend
  const bookingDay = bookingDate.getDay();
  const isWeekend = [0, 6].includes(bookingDay); // 0 = Sunday, 6 = Saturday
  
  // Calculate total booking cost
  let totalAmount = 0;
  
  // Calculate cost for each hour based on applicable schedule blocks
  for (let hour = 0; hour < diffHours; hour++) {
    const hourStartDate = new Date(startDate);
    hourStartDate.setHours(startDate.getHours() + hour);
    
    const hourEndDate = new Date(hourStartDate);
    hourEndDate.setHours(hourStartDate.getHours() + 1);
    
    // Find which schedule block this hour falls into
    const applicableSchedule = overlappingSchedules.find(schedule => {
      const [schStartHour, schStartMin] = schedule.start_time.split(':').map(Number);
      const [schEndHour, schEndMin] = schedule.end_time.split(':').map(Number);
      
      const scheduleStart = new Date(bookingDate);
      scheduleStart.setHours(schStartHour, schStartMin, 0, 0);
      
      const scheduleEnd = new Date(bookingDate);
      scheduleEnd.setHours(schEndHour, schEndMin, 0, 0);
      
      if (scheduleEnd < scheduleStart) {
        scheduleEnd.setDate(scheduleEnd.getDate() + 1);
      }
      
      return hourStartDate >= scheduleStart && hourStartDate < scheduleEnd;
    });
    
    if (applicableSchedule) {
      // Determine the rate based on weekend/weekday
      let hourlyRate = applicableSchedule.price;
      
      if (isWeekend && applicableSchedule.price_weekend) {
        hourlyRate = applicableSchedule.price_weekend;
      }
      
      totalAmount += hourlyRate;
    }
  }
  
  // Apply monthly discount if applicable
  if (isMonthly) {
    const monthlyDiscountPercent = overlappingSchedules[0]?.monthly_discount || 0;
    if (monthlyDiscountPercent > 0) {
      totalAmount = totalAmount * (1 - monthlyDiscountPercent / 100);
    }
  }
  
  // Multiply by weeks for monthly bookings
  totalAmount = totalAmount * weekCount;
  
  return Number(totalAmount.toFixed(2));
};
