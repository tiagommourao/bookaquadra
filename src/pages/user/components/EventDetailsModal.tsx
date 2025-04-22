
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Calendar, DollarSign, Info, Activity } from "lucide-react";

interface EventDetailsModalProps {
  open: boolean;
  onClose: () => void;
  event: any; // Usar um tipo mais restrito se desejar (tipos do banco)
}

export function EventDetailsModal({ open, onClose, event }: EventDetailsModalProps) {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {event.name}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <div className="flex gap-2 items-center mb-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Descrição:</span>
          </div>
          <p className="ml-6 text-sm">{event.description || "Sem descrição."}</p>
          <div className="flex gap-2 items-center mt-4 mb-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Preço:</span>
            <span className="ml-2">{event.registration_fee ? `R$ ${Number(event.registration_fee).toFixed(2)}` : "Grátis"}</span>
          </div>
          <div className="flex gap-2 items-center mt-3 mb-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Data e Horário:</span>
          </div>
          <p className="ml-6 text-sm">
            {event.start_datetime
              ? `${new Date(event.start_datetime).toLocaleDateString("pt-BR")} ${new Date(event.start_datetime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - ${new Date(event.end_datetime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
              : "Não informado"}
          </p>
          <div className="flex gap-2 items-center mt-3 mb-1">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Quadras:</span>
          </div>
          <p className="ml-6 text-sm">
            {(event.events_courts && event.events_courts.length > 0)
              ? event.events_courts.map((court: any) => court.name).join(", ")
              : "Sem quadras vinculadas"}
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <button className="mt-2 btn btn-primary px-4 py-2 bg-primary text-white rounded">Fechar</button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
