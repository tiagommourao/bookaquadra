
import React, { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEventsData } from '@/hooks/admin/useEventsData';
import { EventsTable } from '@/components/admin/events/EventsTable';
import { EventForm } from '@/components/admin/events/EventForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Event } from '@/types/event';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function EventsList() {
  const { data: events, refetch } = useEventsData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const handleCreateNew = () => {
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleDelete = async (event: Event) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', event.id);

        if (error) throw error;

        toast({
          title: "Evento excluído com sucesso!",
          description: "O evento foi removido permanentemente."
        });

        refetch();
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
        toast({
          title: "Erro ao excluir evento",
          description: "Ocorreu um erro ao tentar excluir o evento.",
          variant: "destructive"
        });
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Eventos</h2>
            <p className="text-muted-foreground">
              Gerencie os eventos e torneios do clube
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" /> Novo Evento
          </Button>
        </div>

        {events && (
          <EventsTable
            events={events}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedEvent ? 'Editar Evento' : 'Novo Evento'}
              </DialogTitle>
            </DialogHeader>
            <EventForm
              initialData={selectedEvent || undefined}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
