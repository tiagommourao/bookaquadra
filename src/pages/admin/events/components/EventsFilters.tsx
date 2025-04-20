
import React, { useState } from 'react';
import { Search, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Court } from '@/types';
import { EventFilters } from '@/hooks/admin/useEventsData';

interface EventsFiltersProps {
  courts: Court[];
  onFilterChange: (filters: EventFilters) => void;
  isLoading: boolean;
}

export const EventsFilters: React.FC<EventsFiltersProps> = ({
  courts,
  onFilterChange,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  const [eventType, setEventType] = useState('');
  const [courtId, setCourtId] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleFilterApply = () => {
    onFilterChange({
      searchTerm,
      status: status || undefined,
      eventType: eventType || undefined,
      courtId: courtId || undefined,
      startDate,
      endDate,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatus('');
    setEventType('');
    setCourtId('');
    setStartDate(null);
    setEndDate(null);
    onFilterChange({});
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="completed">Finalizado</SelectItem>
          </SelectContent>
        </Select>

        {/* Event Type Filter */}
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de Evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os tipos</SelectItem>
            <SelectItem value="tournament">Torneio</SelectItem>
            <SelectItem value="class">Aula Especial</SelectItem>
            <SelectItem value="day_use">Day Use</SelectItem>
            <SelectItem value="private">Evento Privado</SelectItem>
          </SelectContent>
        </Select>

        {/* Court Filter */}
        <Select value={courtId} onValueChange={setCourtId} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Quadra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as quadras</SelectItem>
            {courts.map((court) => (
              <SelectItem key={court.id} value={court.id}>
                {court.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Filter - Start Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                format(startDate, "dd/MM/yyyy", { locale: ptBR })
              ) : (
                <span>Data Início</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate || undefined}
              onSelect={setStartDate}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        {/* Date Range Filter - End Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? (
                format(endDate, "dd/MM/yyyy", { locale: ptBR })
              ) : (
                <span>Data Fim</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate || undefined}
              onSelect={setEndDate}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={handleClearFilters}>
          Limpar Filtros
        </Button>
        <Button onClick={handleFilterApply}>
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
};
