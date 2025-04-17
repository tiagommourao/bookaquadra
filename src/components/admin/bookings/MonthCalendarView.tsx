
import React from 'react';
import { format, getDay, isToday, isWeekend, parseISO } from 'date-fns';
import { Booking } from '@/types';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface MonthCalendarViewProps {
  calendarDays: Date[];
  dateRange: { start: Date; end: Date };
  getBookingsForDay: (day: Date, includeAllStatuses?: boolean) => (Booking & any)[];
  getCellColor: (bookings: (Booking & any)[]) => string;
  handleDayClick: (day: Date) => void;
  weekDays: string[];
}

export const MonthCalendarView = ({
  calendarDays,
  dateRange,
  getBookingsForDay,
  getCellColor,
  handleDayClick,
  weekDays
}: MonthCalendarViewProps) => {
  return (
    <div className="grid grid-cols-7 gap-1 mb-6">
      {weekDays.map((day) => (
        <div key={day} className="p-2 text-center font-semibold">
          {day}
        </div>
      ))}
      
      {Array.from({ length: getDay(dateRange.start) === 0 ? 6 : getDay(dateRange.start) - 1 }).map((_, index) => (
        <div key={`empty-start-${index}`} className="h-24 p-1 bg-gray-50 border border-gray-100"></div>
      ))}
      
      {calendarDays.map((day) => {
        // Não inclui reservas canceladas na visualização do calendário
        const dayBookings = getBookingsForDay(day, false);
        const revenue = dayBookings.reduce((sum, b) => sum + Number(b.amount), 0);
        
        return (
          <div
            key={day.toISOString()}
            className={`h-24 p-1 border cursor-pointer transition-all ${
              isToday(day) ? 'border-primary' : 'border-gray-100'
            } ${getCellColor(dayBookings)}`}
            onClick={() => handleDayClick(day)}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${isWeekend(day) ? 'text-red-500' : ''}`}>
                {format(day, 'd')}
              </span>
              {dayBookings.length > 0 && (
                <span className="text-xs font-medium bg-primary/10 text-primary px-1 rounded">
                  {dayBookings.length}
                </span>
              )}
            </div>
            
            {dayBookings.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mt-2 text-xs">
                      <div className="font-semibold text-green-700">
                        R$ {revenue.toFixed(2)}
                      </div>
                      <div className="truncate mt-1">
                        {dayBookings.length > 2 
                          ? `${dayBookings.length} reservas`
                          : dayBookings.slice(0, 2).map((b, i) => (
                              <div key={i} className="truncate">
                                {b.start_time.slice(0, 5)} - {b.court?.name}
                              </div>
                            ))
                        }
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <div className="space-y-1">
                      <p className="font-semibold">Reservas do dia {format(day, 'dd/MM')}</p>
                      {dayBookings.slice(0, 5).map((booking, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-medium">{booking.start_time.slice(0, 5)}</span> - {booking.court?.name}{' '}
                          <span className="text-muted-foreground">
                            {booking.profiles?.first_name || 'Cliente'}
                          </span>
                        </div>
                      ))}
                      {dayBookings.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          + {dayBookings.length - 5} mais reservas
                        </p>
                      )}
                      <p className="font-semibold text-green-600">
                        Total: R$ {revenue.toFixed(2)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      })}
    </div>
  );
};
