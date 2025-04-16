
import React from 'react';
import { Court } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BookingsFiltersProps {
  selectedCourt: string;
  setSelectedCourt: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  courts?: Court[];
}

export const BookingsFilters = ({ 
  selectedCourt, 
  setSelectedCourt, 
  selectedStatus, 
  setSelectedStatus, 
  courts 
}: BookingsFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select
        value={selectedCourt}
        onValueChange={setSelectedCourt}
      >
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por quadra" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as quadras</SelectItem>
          {courts?.map((court) => (
            <SelectItem key={court.id} value={court.id}>
              {court.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedStatus}
        onValueChange={setSelectedStatus}
      >
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="confirmed">Confirmada</SelectItem>
          <SelectItem value="cancelled">Cancelada</SelectItem>
          <SelectItem value="completed">Concluída</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
