
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const scheduleSchema = z.object({
  court_id: z.string().min(1, 'Selecione uma quadra'),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().min(1, 'Obrigatório'),
  end_time: z.string().min(1, 'Obrigatório'),
  price: z.number().min(0, 'O preço deve ser maior ou igual a zero'),
  is_blocked: z.boolean().default(false),
}).refine(data => data.start_time < data.end_time, {
  message: 'A hora de início deve ser anterior à hora de término',
  path: ['end_time'],
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface Court {
  id: string;
  name: string;
  type: string;
}

interface Schedule {
  id: string;
  court_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  price: number;
  is_blocked: boolean;
}

interface ScheduleFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  schedule: Schedule | null;
  onSubmitSuccess: () => void;
}

export const ScheduleFormDrawer = ({
  isOpen,
  onClose,
  courts,
  schedule,
  onSubmitSuccess,
}: ScheduleFormDrawerProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      court_id: '',
      day_of_week: 0,
      start_time: '08:00',
      end_time: '09:00',
      price: 50,
      is_blocked: false,
    },
  });

  // Reset form when schedule changes or drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        const startTime = schedule.start_time.substring(0, 5);
        const endTime = schedule.end_time.substring(0, 5);
        
        form.reset({
          court_id: schedule.court_id,
          day_of_week: schedule.day_of_week,
          start_time: startTime,
          end_time: endTime,
          price: schedule.price,
          is_blocked: schedule.is_blocked,
        });
      } else {
        form.reset({
          court_id: courts.length > 0 ? courts[0].id : '',
          day_of_week: 0,
          start_time: '08:00',
          end_time: '09:00',
          price: 50,
          is_blocked: false,
        });
      }
    }
  }, [schedule, isOpen, courts, form]);

  const onSubmit = async (data: ScheduleFormValues) => {
    setIsSubmitting(true);
    try {
      if (schedule) {
        // Update existing schedule
        const { error } = await supabase
          .from('schedules')
          .update({
            court_id: data.court_id,
            day_of_week: data.day_of_week,
            start_time: data.start_time,
            end_time: data.end_time,
            price: data.price,
            is_blocked: data.is_blocked,
          })
          .eq('id', schedule.id);

        if (error) throw error;

        toast({
          title: 'Horário atualizado',
          description: 'O horário foi atualizado com sucesso.',
        });
      } else {
        // Create new schedule
        const { error } = await supabase
          .from('schedules')
          .insert({
            court_id: data.court_id,
            day_of_week: data.day_of_week,
            start_time: data.start_time,
            end_time: data.end_time,
            price: data.price,
            is_blocked: data.is_blocked,
          });

        if (error) throw error;

        toast({
          title: 'Horário criado',
          description: 'O novo horário foi cadastrado com sucesso.',
        });
      }

      onSubmitSuccess();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      
      // Check for the unique constraint violation
      if (error.code === '23505') {
        toast({
          title: 'Horário já existe',
          description: 'Já existe um horário cadastrado para esta quadra no mesmo dia e hora de início.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao salvar',
          description: 'Ocorreu um erro ao salvar o horário.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDayOfWeekName = (day: number) => {
    const days = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    return days[day];
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[85vh] md:max-w-xl mx-auto">
        <DrawerHeader>
          <DrawerTitle>{schedule ? 'Editar Horário' : 'Novo Horário'}</DrawerTitle>
          <DrawerDescription>
            {schedule
              ? 'Atualize as informações do horário existente.'
              : 'Preencha os dados para cadastrar um novo horário.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto flex-1">
          <Form {...form}>
            <form
              id="schedule-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pb-10"
            >
              <FormField
                control={form.control}
                name="court_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quadra</FormLabel>
                    <FormControl>
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        {courts.map(court => (
                          <option key={court.id} value={court.id}>
                            {court.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      Selecione a quadra para este horário
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="day_of_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia da Semana</FormLabel>
                    <FormControl>
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        value={field.value}
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map(day => (
                          <option key={day} value={day}>
                            {getDayOfWeekName(day)}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      Selecione o dia da semana para este horário
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Início</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Fim</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor cobrado pela hora
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_blocked"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Bloquear Horário</FormLabel>
                      <FormDescription>
                        Horários bloqueados não estarão disponíveis para reserva
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DrawerFooter>
          <Button
            type="submit"
            form="schedule-form"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Salvando...'
              : schedule
              ? 'Atualizar Horário'
              : 'Cadastrar Horário'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
