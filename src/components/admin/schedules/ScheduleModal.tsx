
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Schedule } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)"
  }),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)"
  }),
  price: z.coerce.number().min(1, "Preço é obrigatório"),
  price_weekend: z.coerce.number().optional(),
  price_holiday: z.coerce.number().optional(),
  min_booking_time: z.coerce.number().min(1, "Tempo mínimo é obrigatório"),
  max_booking_time: z.coerce.number().optional(),
  advance_booking_days: z.coerce.number().optional(),
  is_blocked: z.boolean().default(false),
  apply_to_all_days: z.boolean().default(false)
}).refine(data => {
  const start = data.start_time.split(':').map(Number);
  const end = data.end_time.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes > startMinutes;
}, {
  message: "Horário de término deve ser após o horário de início",
  path: ["end_time"]
});

type ScheduleFormValues = z.infer<typeof formSchema>;

interface ScheduleModalProps {
  schedule: Schedule | null;
  courtId: string;
  dayOfWeek: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  schedule,
  courtId,
  dayOfWeek,
  isOpen,
  onClose
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_time: '08:00',
      end_time: '09:00',
      price: 60,
      price_weekend: undefined,
      price_holiday: undefined,
      min_booking_time: 60,
      max_booking_time: undefined,
      advance_booking_days: 30,
      is_blocked: false,
      apply_to_all_days: false
    }
  });

  useEffect(() => {
    if (schedule) {
      form.reset({
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        price: Number(schedule.price),
        price_weekend: schedule.price_weekend ? Number(schedule.price_weekend) : undefined,
        price_holiday: schedule.price_holiday ? Number(schedule.price_holiday) : undefined,
        min_booking_time: Number(schedule.min_booking_time),
        max_booking_time: schedule.max_booking_time ? Number(schedule.max_booking_time) : undefined,
        advance_booking_days: schedule.advance_booking_days ? Number(schedule.advance_booking_days) : undefined,
        is_blocked: schedule.is_blocked,
        apply_to_all_days: false
      });
    } else {
      form.reset({
        start_time: '08:00',
        end_time: '09:00',
        price: 60,
        price_weekend: undefined,
        price_holiday: undefined,
        min_booking_time: 60,
        max_booking_time: undefined,
        advance_booking_days: 30,
        is_blocked: false,
        apply_to_all_days: false
      });
    }
  }, [schedule, form]);

  const onSubmit = async (values: ScheduleFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Extract the apply_to_all_days value and remove it from the data to be sent to the database
      const { apply_to_all_days, ...scheduleData } = values;
      
      if (schedule) {
        // Update schedule
        const { error } = await supabase
          .from('schedules')
          .update({
            start_time: scheduleData.start_time,
            end_time: scheduleData.end_time,
            price: scheduleData.price,
            price_weekend: scheduleData.price_weekend,
            price_holiday: scheduleData.price_holiday,
            min_booking_time: scheduleData.min_booking_time,
            max_booking_time: scheduleData.max_booking_time,
            advance_booking_days: scheduleData.advance_booking_days,
            is_blocked: scheduleData.is_blocked
          })
          .eq('id', schedule.id);
        
        if (error) throw error;
        
        // If apply_to_all_days is checked, copy this schedule to all other days of the week
        if (apply_to_all_days) {
          const allDays = [0, 1, 2, 3, 4, 5, 6];
          const otherDays = allDays.filter(day => day !== dayOfWeek);
          
          // First, check if there are existing schedules with the same time for other days
          const { data: existingSchedules, error: fetchError } = await supabase
            .from('schedules')
            .select('id, day_of_week')
            .eq('court_id', courtId)
            .eq('start_time', scheduleData.start_time)
            .eq('end_time', scheduleData.end_time);
          
          if (fetchError) throw fetchError;
          
          // Create a map of existing schedules by day
          const existingSchedulesByDay = existingSchedules?.reduce((acc, s) => {
            acc[s.day_of_week] = s.id;
            return acc;
          }, {} as Record<number, string>) || {};
          
          // For each day of the week, update or insert the schedule
          const promises = otherDays.map(async (day) => {
            if (existingSchedulesByDay[day]) {
              // Update existing schedule for this day
              return supabase
                .from('schedules')
                .update({
                  start_time: scheduleData.start_time,
                  end_time: scheduleData.end_time,
                  price: scheduleData.price,
                  price_weekend: scheduleData.price_weekend,
                  price_holiday: scheduleData.price_holiday,
                  min_booking_time: scheduleData.min_booking_time,
                  max_booking_time: scheduleData.max_booking_time,
                  advance_booking_days: scheduleData.advance_booking_days,
                  is_blocked: scheduleData.is_blocked
                })
                .eq('id', existingSchedulesByDay[day]);
            } else {
              // Insert new schedule for this day
              return supabase
                .from('schedules')
                .insert({
                  court_id: courtId,
                  day_of_week: day,
                  start_time: scheduleData.start_time,
                  end_time: scheduleData.end_time,
                  price: scheduleData.price,
                  price_weekend: scheduleData.price_weekend,
                  price_holiday: scheduleData.price_holiday,
                  min_booking_time: scheduleData.min_booking_time,
                  max_booking_time: scheduleData.max_booking_time,
                  advance_booking_days: scheduleData.advance_booking_days,
                  is_blocked: scheduleData.is_blocked
                });
            }
          });
          
          await Promise.all(promises);
        }
        
        toast({
          title: 'Horário atualizado',
          description: apply_to_all_days 
            ? 'O horário foi atualizado para todos os dias da semana'
            : 'O horário foi atualizado com sucesso',
        });
      } else {
        // Create schedule
        const { error } = await supabase
          .from('schedules')
          .insert({
            court_id: courtId,
            day_of_week: dayOfWeek,
            start_time: scheduleData.start_time,
            end_time: scheduleData.end_time,
            price: scheduleData.price,
            price_weekend: scheduleData.price_weekend,
            price_holiday: scheduleData.price_holiday,
            min_booking_time: scheduleData.min_booking_time,
            max_booking_time: scheduleData.max_booking_time,
            advance_booking_days: scheduleData.advance_booking_days,
            is_blocked: scheduleData.is_blocked
          });
        
        if (error) throw error;
        
        // If apply_to_all_days is checked, create the same schedule for all other days of the week
        if (apply_to_all_days) {
          const allDays = [0, 1, 2, 3, 4, 5, 6];
          const otherDays = allDays.filter(day => day !== dayOfWeek);
          
          const bulkInsertData = otherDays.map(day => ({
            court_id: courtId,
            day_of_week: day,
            start_time: scheduleData.start_time,
            end_time: scheduleData.end_time,
            price: scheduleData.price,
            price_weekend: scheduleData.price_weekend,
            price_holiday: scheduleData.price_holiday,
            min_booking_time: scheduleData.min_booking_time,
            max_booking_time: scheduleData.max_booking_time,
            advance_booking_days: scheduleData.advance_booking_days,
            is_blocked: scheduleData.is_blocked
          }));
          
          const { error: bulkInsertError } = await supabase
            .from('schedules')
            .insert(bulkInsertData);
          
          if (bulkInsertError) throw bulkInsertError;
        }
        
        toast({
          title: 'Horário criado',
          description: apply_to_all_days 
            ? 'O horário foi criado para todos os dias da semana'
            : 'O horário foi criado com sucesso',
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o horário',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {schedule ? 'Editar Horário' : 'Novo Horário'}
          </DialogTitle>
          <DialogDescription>
            {schedule
              ? 'Edite os detalhes do horário selecionado'
              : 'Adicione um novo horário para esta quadra'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início</FormLabel>
                    <FormControl>
                      <Input placeholder="HH:MM" {...field} />
                    </FormControl>
                    <FormDescription>Formato: 08:00</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Término</FormLabel>
                    <FormControl>
                      <Input placeholder="HH:MM" {...field} />
                    </FormControl>
                    <FormDescription>Formato: 09:00</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_weekend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Fim de Semana (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="Opcional" 
                        value={field.value === undefined ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Deixe em branco para usar o preço padrão</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_holiday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Feriado (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="Opcional" 
                        value={field.value === undefined ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Deixe em branco para usar o preço padrão</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_booking_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo Mínimo de Reserva (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min="15" step="15" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_booking_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo Máximo de Reserva (min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="15" 
                        step="15" 
                        placeholder="Opcional" 
                        value={field.value === undefined ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Deixe em branco se não houver limite</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="advance_booking_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias de Antecedência para Reserva</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="Padrão: 30 dias" 
                        value={field.value === undefined ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_blocked"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Bloqueado</FormLabel>
                      <FormDescription>
                        Se marcado, este horário não estará disponível para reservas
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apply_to_all_days"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 sm:col-span-2 bg-muted/20">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Aplicar a todos os dias da semana</FormLabel>
                      <FormDescription>
                        Se marcado, este horário será adicionado ou atualizado para todos os dias da semana
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : schedule ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
