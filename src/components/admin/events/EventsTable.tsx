
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, Trash } from 'lucide-react';
import { Event } from '@/types/event';

interface EventsTableProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}

export function EventsTable({ events, onEdit, onDelete }: EventsTableProps) {
  const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      tournament: 'Torneio',
      special_class: 'Aula Especial',
      day_use: 'Day Use',
      private_event: 'Evento Privado'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      finished: "destructive"
    };
    
    return (
      <Badge variant={variants[status]}>
        {status === 'active' ? 'Ativo' : 
         status === 'inactive' ? 'Inativo' : 'Finalizado'}
      </Badge>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Data/Hora</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id}>
            <TableCell>{event.name}</TableCell>
            <TableCell>{getEventTypeLabel(event.event_type)}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(event.start_datetime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(event.status)}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(event)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(event)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
