
import React from 'react';
import { useForm } from 'react-hook-form';
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
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  onSuccess?: () => void;
  initialData?: Event;
}

export function EventForm({ onSuccess, initialData }: EventFormProps) {
  const { toast } = useToast();
  
  // Prepare default values for the form
  const defaultValues: Partial<EventFormValues> = initialData 
    ? {
        ...initialData,
        // Convert any nullable values to empty string if undefined
        description: initialData.description || '',
        banner_url: initialData.banner_url || '',
        registration_fee: initialData.registration_fee || undefined,
        max_capacity: initialData.max_capacity || undefined,
      }
    : {
        block_courts: false,
        notify_clients: false,
        status: 'active',
      };
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: EventFormValues) => {
    try {
      // Ensure all required fields are present
      const eventData = {
        name: values.name,
        description: values.description,
        start_datetime: values.start_datetime,
        end_datetime: values.end_datetime,
        event_type: values.event_type,
        registration_fee: values.registration_fee,
        max_capacity: values.max_capacity,
        banner_url: values.banner_url,
        block_courts: values.block_courts,
        notify_clients: values.notify_clients,
        status: values.status,
      };
      
      if (initialData?.id) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', initialData.id);
        
        if (error) throw error;
        
        toast({
          title: "Evento atualizado com sucesso!",
          description: "As informações do evento foram atualizadas."
        });
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);
        
        if (error) throw error;
        
        toast({
          title: "Evento criado com sucesso!",
          description: "O novo evento foi cadastrado."
        });
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
                    <Input {...field} />
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
                    <Textarea {...field} value={field.value || ''} />
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
                    <Input {...field} value={field.value || ''} />
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
                  <FormLabel>Bloquear Quadras</FormLabel>
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
                  <FormLabel>Notificar Clientes</FormLabel>
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
