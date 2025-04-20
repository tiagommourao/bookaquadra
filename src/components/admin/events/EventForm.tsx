
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Event, EventType, EventStatus } from '@/types/event';
import { useAvailableCourts } from '@/hooks/admin/useEventsData';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';

const eventFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  start_datetime: z.string(),
  end_datetime: z.string(),
  event_type: z.enum(['tournament', 'special_class', 'day_use', 'private_event']),
  registration_fee: z.number().optional(),
  max_capacity: z.number().optional(),
  banner_url: z.string().optional(),
  block_courts: z.boolean(),
  notify_clients: z.boolean(),
  status: z.enum(['active', 'inactive', 'finished']).default('active'),
  court_ids: z.array(z.string()).min(1, 'Selecione pelo menos uma quadra')
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  onSuccess?: () => void;
  initialData?: Event;
}

export function EventForm({ onSuccess, initialData }: EventFormProps) {
  const { toast } = useToast();
  const { data: courts, isLoading: isLoadingCourts } = useAvailableCourts();
  
  // Preparar valores iniciais das quadras selecionadas
  const initialCourtIds = initialData?.events_courts 
    ? initialData.events_courts.map(ec => 
        typeof ec === 'object' && 'court_id' in ec ? ec.court_id : ''
      ).filter(id => id !== '')
    : [];
  
  const defaultValues: Partial<EventFormValues> = initialData 
    ? {
        ...initialData,
        description: initialData.description || '',
        banner_url: initialData.banner_url || '',
        registration_fee: initialData.registration_fee || undefined,
        max_capacity: initialData.max_capacity || undefined,
        court_ids: initialCourtIds
      }
    : {
        block_courts: false,
        notify_clients: false,
        status: 'active',
        court_ids: []
      };
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: EventFormValues) => {
    try {
      const eventData = {
        name: values.name,
        description: values.description || null,
        start_datetime: values.start_datetime,
        end_datetime: values.end_datetime,
        event_type: values.event_type as EventType,
        registration_fee: values.registration_fee || null,
        max_capacity: values.max_capacity || null,
        banner_url: values.banner_url || null,
        block_courts: values.block_courts,
        notify_clients: values.notify_clients,
        status: values.status as EventStatus,
      };
      
      let eventId = initialData?.id;
      
      if (initialData?.id) {
        // Atualizar evento existente
        const { error } = await supabase
          .from('events')
          .update({
            ...eventData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData.id);
        
        if (error) throw error;
        
        // Excluir relações de quadras existentes para atualizar
        const { error: deleteError } = await supabase
          .from('events_courts')
          .delete()
          .eq('event_id', initialData.id);
        
        if (deleteError) throw deleteError;
        
        toast({
          title: "Evento atualizado com sucesso!",
          description: "As informações do evento foram atualizadas."
        });
      } else {
        // Criar novo evento
        const { data, error } = await supabase
          .from('events')
          .insert({
            ...eventData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        
        if (error) throw error;
        eventId = data.id;
        
        toast({
          title: "Evento criado com sucesso!",
          description: "O novo evento foi cadastrado."
        });
      }
      
      // Inserir relações de quadras
      if (eventId) {
        const courtRelations = values.court_ids.map(courtId => ({
          event_id: eventId,
          court_id: courtId,
          created_at: new Date().toISOString()
        }));
        
        const { error: courtError } = await supabase
          .from('events_courts')
          .insert(courtRelations);
        
        if (courtError) throw courtError;
      }
      
      // Se a opção de bloquear quadras estiver ativada, criar bloqueios no schedule_blocks
      if (values.block_courts && eventId) {
        // Primeiro removemos bloqueios existentes caso seja uma edição
        if (initialData?.id) {
          await supabase
            .from('schedule_blocks')
            .delete()
            .eq('reason', `Evento: ${values.name} (ID: ${eventId})`);
        }
        
        // Criar bloqueios de agenda para cada quadra selecionada
        for (const courtId of values.court_ids) {
          await supabase
            .from('schedule_blocks')
            .insert({
              court_id: courtId,
              start_datetime: values.start_datetime,
              end_datetime: values.end_datetime,
              reason: `Evento: ${values.name} (ID: ${eventId})`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: "Erro ao salvar evento",
        description: "Ocorreu um erro ao tentar salvar o evento.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Editar Evento' : 'Novo Evento'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Evento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Torneio de Tênis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os detalhes do evento" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_datetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data/Hora Início</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_datetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data/Hora Fim</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Evento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tournament">Torneio</SelectItem>
                      <SelectItem value="special_class">Aula Especial</SelectItem>
                      <SelectItem value="day_use">Day Use</SelectItem>
                      <SelectItem value="private_event">Evento Privado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="court_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Quadras utilizadas</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {isLoadingCourts ? (
                      <div>Carregando quadras...</div>
                    ) : (
                      courts?.map(court => (
                        <FormField
                          key={court.id}
                          control={form.control}
                          name="court_ids"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(court.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = [...(field.value || [])];
                                    if (checked) {
                                      if (!currentValue.includes(court.id)) {
                                        field.onChange([...currentValue, court.id]);
                                      }
                                    } else {
                                      field.onChange(
                                        currentValue.filter(value => value !== court.id)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {court.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="finished">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registration_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Inscrição</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        value={field.value || ''} 
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="max_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade Máxima</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Número máximo de participantes"
                        {...field} 
                        value={field.value || ''} 
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="banner_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Banner</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="URL da imagem do evento" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="block_courts"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Bloquear Quadras</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Impede reservas comuns durante o período do evento
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notify_clients"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Notificar Clientes</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Envia notificações sobre o evento para os clientes
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="submit">
                {initialData ? 'Atualizar' : 'Criar'} Evento
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
