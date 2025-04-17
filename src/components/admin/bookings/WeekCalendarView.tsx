
import React from 'react';
import { eachDayOfInterval, format, isToday, isSameDay, isWeekend, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Booking } from '@/types';
import { Edit } from 'lucide-react';

interface WeekCalendarViewProps {
  dateRange: { start: Date; end: Date };
  allBookings?: (Booking & any)[];
  handleDayClick: (day: Date) => void;
  handleEditBooking: (booking: Booking) => void;
}

export const WeekCalendarView = ({
  dateRange,
  allBookings,
  handleDayClick,
  handleEditBooking
}: WeekCalendarViewProps) => {
  // Helper function to safely convert booking_date to Date
  const getBookingDate = (booking: Booking): Date => {
    if (typeof booking.booking_date === 'string') {
      return parseISO(booking.booking_date);
    }
    return booking.booking_date;
  };
  
  // Add debug handler for editing bookings
  const onEditBooking = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Editing booking with times:', {
      start_time: booking.start_time,
      end_time: booking.end_time,
      booking_date: booking.booking_date
    });
    handleEditBooking(booking);
  };

  return (
    <div className="mb-6 overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 bg-gray-50 w-24">Horário</th>
            {eachDayOfInterval({
              start: dateRange.start,
              end: dateRange.end
            }).map((day) => (
              <th key={day.toString()} className={`border p-2 ${isToday(day) ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="text-center">
                  <div className="font-semibold">{format(day, 'EEEE', { locale: ptBR })}</div>
                  <div className={`text-sm ${isWeekend(day) ? 'text-red-500' : ''}`}>
                    {format(day, 'dd/MM')}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 18 }).map((_, index) => {
            const hour = index + 6;
            const hourFormatted = `${hour.toString().padStart(2, '0')}:00`;
            
            return (
              <tr key={hourFormatted} className="hover:bg-gray-50">
                <td className="border p-2 text-center font-medium">
                  {hourFormatted}
                </td>
                
                {eachDayOfInterval({
                  start: dateRange.start,
                  end: dateRange.end
                }).map((day) => {
                  const bookingsAtHour = allBookings?.filter(b => {
                    const bookingDate = getBookingDate(b);
                    return isSameDay(bookingDate, day) && 
                      b.start_time.startsWith(hourFormatted.slice(0, 2));
                  }) || [];
                  
                  return (
                    <td 
                      key={`${day.toString()}-${hourFormatted}`} 
                      className={`border p-1 relative min-h-[80px] ${
                        isToday(day) ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => handleDayClick(day)}
                    >
                      {bookingsAtHour.map((booking) => (
                        <div 
                          key={booking.id}
                          className={`text-xs mb-1 p-1 rounded cursor-pointer ${
                            booking.status === 'confirmed' ? 'bg-green-100' :
                            booking.status === 'pending' ? 'bg-yellow-100' :
                            booking.status === 'cancelled' ? 'bg-red-100' : 'bg-gray-100'
                          }`}
                          onClick={(e) => onEditBooking(booking, e)}
                        >
                          <div className="font-medium truncate">
                            {booking.start_time.slice(0, 5)}-{booking.end_time.slice(0, 5)}
                          </div>
                          <div className="truncate">{booking.court?.name}</div>
                          <div className="truncate">
                            {booking.profiles?.first_name || 'Cliente'}
                          </div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
