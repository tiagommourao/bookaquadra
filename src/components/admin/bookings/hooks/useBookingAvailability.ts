
import { useState, useEffect } from 'react';
import { checkBookingConflict } from '../booking-utils';

export function useBookingAvailability({
  watchCourtId,
  watchStartTime,
  watchEndTime,
  watchBookingDate,
  bookingId
}: {
  watchCourtId: string;
  watchStartTime: string;
  watchEndTime: string;
  watchBookingDate: Date;
  bookingId?: string;
}) {
  const [isValidatingSchedule, setIsValidatingSchedule] = useState(false);
  const [scheduleConflict, setScheduleConflict] = useState(false);
  
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
            bookingId
          );
          
          setScheduleConflict(hasConflict);
        } finally {
          setIsValidatingSchedule(false);
        }
      };
      
      validateBookingAvailability();
    }
  }, [watchCourtId, watchStartTime, watchEndTime, watchBookingDate, bookingId]);

  return {
    scheduleConflict,
    isValidatingSchedule
  };
}
