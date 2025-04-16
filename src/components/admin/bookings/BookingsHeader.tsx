
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Grid3X3, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BookingsHeaderProps {
  selectedDate: Date;
  viewMode: 'month' | 'week';
  onChangeMonth: (date: Date) => void;
  onToggleViewMode: () => void;
  onCreateBooking: () => void;
}

export const BookingsHeader = ({
  selectedDate,
  viewMode,
  onChangeMonth,
  onToggleViewMode,
  onCreateBooking
}: BookingsHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold">Reservas</h1>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onToggleViewMode} className="flex items-center gap-1">
          {viewMode === 'month' ? (
            <>
              <CalendarDays className="h-4 w-4" />
              <span className="hidden md:inline">Ver Semana</span>
            </>
          ) : (
            <>
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden md:inline">Ver Mês</span>
            </>
          )}
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onChangeMonth(date)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <Button onClick={onCreateBooking}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Reserva
        </Button>
      </div>
    </div>
  );
};
