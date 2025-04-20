
import React, { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Plus, FileDown, Filter } from 'lucide-react';
import { useEventsData, EventFilters, useExportEventParticipants } from '@/hooks/admin/useEventsData';
import { EventsTable } from '@/components/admin/events/EventsTable';
import { EventForm } from '@/components/admin/events/EventForm';
import { EventFiltersForm } from '@/components/admin/events/EventFiltersForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Event } from '@/types/event';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Pagination } from '@/components/ui/pagination';

export default function EventsList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const [page, setPage] = useState(0);
  const pageSize = 10;
  
  const { data: eventsData, refetch, isLoading } = useEventsData(filters, page, pageSize);
  const events = eventsData?.data || [];
  const totalCount = eventsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const { toast } = useToast();
  const { data: participants, refetch: refetchParticipants } = useExportEventParticipants(selectedEvent?.id || null);

  const handleCreateNew = () => {
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleDelete = async (event: Event) => {
    if (!event.id) return;
    
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        // Primeiro remover os bloqueios de quadras relacionados
        if (event.block_courts) {
          await supabase
            .from('schedule_blocks')
            .delete()
            .eq('reason', `Evento: ${event.name} (ID: ${event.id})`);
        }
        
        // Remover as associações de quadras
        await supabase
          .from('events_courts')
          .delete()
          .eq('event_id', event.id);
        
        // Remover o evento
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
  
  const handleApplyFilters = (newFilters: EventFilters) => {
    setFilters(newFilters);
    setPage(0); // Resetar para a primeira página ao aplicar filtros
    setIsFiltersOpen(false);
  };
  
  const handleDuplicate = async (event: Event) => {
    if (!event.id) return;
    
    try {
      // Buscar informações completas do evento
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', event.id)
        .single();
      
      if (eventError) throw eventError;
      
      // Buscar quadras associadas
      const { data: courtsData, error: courtsError } = await supabase
        .from('events_courts')
        .select('court_id')
        .eq('event_id', event.id);
      
      if (courtsError) throw courtsError;
      
      // Criar novo evento com base nos dados existentes
      const { data: newEvent, error: insertError } = await supabase
        .from('events')
        .insert({
          ...eventData,
          name: `${eventData.name} (Cópia)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          id: undefined // Não incluir ID para gerar um novo
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      
      // Criar novas associações de quadras
      if (courtsData.length > 0) {
        const newCourtRelations = courtsData.map(court => ({
          event_id: newEvent.id,
          court_id: court.court_id,
          created_at: new Date().toISOString()
        }));
        
        await supabase
          .from('events_courts')
          .insert(newCourtRelations);
      }
      
      toast({
        title: "Evento duplicado com sucesso!",
        description: "Um novo evento foi criado com base no evento selecionado."
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao duplicar evento:', error);
      toast({
        title: "Erro ao duplicar evento",
        description: "Ocorreu um erro ao tentar duplicar o evento.",
        variant: "destructive"
      });
    }
  };
  
  const handleExportParticipants = (event: Event) => {
    setSelectedEvent(event);
    refetchParticipants().then(() => {
      if (participants && participants.length > 0) {
        // Preparar dados para CSV
        let csvContent = "ID,Nome,Sobrenome,Email,Telefone,Data Inscrição,Status Pagamento,Presente\n";
        
        participants.forEach(p => {
          csvContent += `${p.id},${p.first_name},${p.last_name},${p.email},${p.phone},`;
          csvContent += `${format(new Date(p.registration_date), 'dd/MM/yyyy HH:mm')},${p.payment_status},${p.attended ? 'Sim' : 'Não'}\n`;
        });
        
        // Criar e fazer download do arquivo CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `participantes-${event.name}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          title: "Sem participantes",
          description: "Este evento ainda não possui participantes inscritos."
        });
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Eventos e Torneios</h2>
            <p className="text-muted-foreground">
              Gerencie os eventos e torneios do clube
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsFiltersOpen(true)}>
              <Filter className="mr-2 h-4 w-4" /> Filtrar
            </Button>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> Novo Evento
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Eventos {filters && Object.keys(filters).length > 0 && "(Filtrado)"}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <p>Carregando eventos...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground">Nenhum evento encontrado</p>
                {Object.keys(filters).length > 0 && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setFilters({})}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            ) : (
              <>
                <EventsTable
                  events={events}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onExportParticipants={handleExportParticipants}
                />
                
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <Pagination>
                      <Button 
                        variant="outline" 
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 0}
                        className="mr-2"
                      >
                        Anterior
                      </Button>
                      <span className="flex items-center mx-2">
                        Página {page + 1} de {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages - 1}
                        className="ml-2"
                      >
                        Próxima
                      </Button>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

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
        
        <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtrar Eventos</DialogTitle>
            </DialogHeader>
            <EventFiltersForm 
              initialFilters={filters} 
              onApplyFilters={handleApplyFilters} 
              onCancel={() => setIsFiltersOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
