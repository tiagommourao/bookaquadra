
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
import { Event } from '@/types/event';

const eventFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  start_datetime: z.string(),
  end_datetime: z.string(),
  event_type: z.string(),
  registration_fee: z.number().optional(),
  max_capacity: z.number().optional(),
  banner_url: z.string().optional(),
  block_courts: z.boolean(),
  notify_clients: z.boolean(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  onSuccess?: () => void;
  initialData?: Event;
}

export function EventForm({ onSuccess, initialData }: EventFormProps) {
  const { toast } = useToast();
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialData || {
      block_courts: false,
      notify_clients: false,
    }
  });

  const onSubmit = async (values: EventFormValues) => {
    try {
      if (initialData?.id) {
        const { error } = await supabase
          .from('events')
          .update(values)
          .eq('id', initialData.id);
        
        if (error) throw error;
        
        toast({
          title: "Evento atualizado com sucesso!",
          description: "As informações do evento foram atualizadas."
        });
      } else {
        const { error } = await supabase
          .from('events')
          .insert([values]);
        
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
                    <Textarea {...field} />
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registration_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Inscrição</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
