
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
import { Calendar, Edit, Trash, Copy, FileDown } from 'lucide-react';
import { Event } from '@/types/event';
import { Tooltip } from '@/components/ui/tooltip';

interface EventsTableProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onDuplicate: (event: Event) => void;
  onExportParticipants: (event: Event) => void;
}

export function EventsTable({ events, onEdit, onDelete, onDuplicate, onExportParticipants }: EventsTableProps) {
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
    
    const labels: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      finished: 'Finalizado'
    };
    
    return (
      <Badge variant={variants[status]}>
        {labels[status] || status}
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
          <TableHead>Quadras</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Inscrições</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id} className="group">
            <TableCell>
              <div>
                <span className="font-medium">{event.name}</span>
                {event.registration_fee && (
                  <Badge variant="outline" className="ml-2">
                    R$ {event.registration_fee.toFixed(2)}
                  </Badge>
                )}
              </div>
              {event.description && (
                <p className="text-xs text-muted-foreground truncate max-w-xs">
                  {event.description}
                </p>
              )}
            </TableCell>
            <TableCell>{getEventTypeLabel(event.event_type)}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <div className="space-y-1">
                  <span className="block text-xs">
                    {format(new Date(event.start_datetime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    até {format(new Date(event.end_datetime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {event.events_courts && Array.isArray(event.events_courts) ? (
                <div className="space-y-1">
                  {event.events_courts.map((ec: any, index: number) => (
                    <Badge key={index} variant="outline">
                      {ec.courts?.name || 'N/A'}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span>-</span>
              )}
              {event.block_courts && (
                <Badge variant="secondary" className="mt-1">
                  Quadras bloqueadas
                </Badge>
              )}
            </TableCell>
            <TableCell>{getStatusBadge(event.status)}</TableCell>
            <TableCell>
              {event.event_registrations ? (
                <Badge>
                  {event.event_registrations.length}
                  {event.max_capacity ? ` / ${event.max_capacity}` : ''}
                </Badge>
              ) : (
                <Badge>0</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="hidden group-hover:flex items-center space-x-1">
                <Tooltip content="Editar">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(event)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="Duplicar">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDuplicate(event)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="Exportar participantes">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onExportParticipants(event)}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="Excluir">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(event)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
