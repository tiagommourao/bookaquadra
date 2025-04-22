
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { activity, dollarSign, calendar, info } from 'lucide-react';

interface Court {
  courts?: { id: string, name: string } | null;
  court_id: string;
}

interface EventDetailsModalProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClickReserve?: () => void;
}

export function EventDetailsModal({ event, open, onOpenChange, onClickReserve }: EventDetailsModalProps) {
  if (!event) return null;

  const courtList = Array.isArray(event.events_courts)
    ? event.events_courts.filter(c => c.courts && c.courts.name).map((c: Court) => c.courts?.name)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {event.image_url ? (
              <img src={event.image_url} alt={event.name} className="h-10 w-10 rounded object-cover border" />
            ) : (
              <span className="inline-flex items-center justify-center bg-blue-600 rounded h-10 w-10">
                {React.createElement(activity, { className: "text-white h-7 w-7" })}
              </span>
            )}
            {event.name}
          </DialogTitle>
          <DialogDescription>
            {event.description || 'Sem descrição informada.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          <div className="flex gap-2 items-center text-sm">
            {React.createElement(calendar, { className: "h-4 w-4 text-primary" })}
            <span>
              Início: {new Date(event.start_datetime).toLocaleString('pt-BR', { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} &nbsp;|&nbsp;
              Fim: {new Date(event.end_datetime).toLocaleString('pt-BR', { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex gap-2 items-center text-sm">
            {React.createElement(dollarSign, { className: "h-4 w-4 text-green-700" })}
            <span>
              {event.registration_fee ? `R$ ${Number(event.registration_fee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Gratuito'}
            </span>
          </div>
          <div className="flex gap-2 items-center text-sm">
            {React.createElement(info, { className: "h-4 w-4 text-primary" })}
            <span>
              Quadras:
              {courtList.length > 0 ? (
                <span> {courtList.join(', ')}</span>
              ) : (
                <span> Não relacionado</span>
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" onClick={onClickReserve}>
            Reservar
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
