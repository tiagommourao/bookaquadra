
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInHours, differenceInMinutes, isBefore, addWeeks, eachWeekOfInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Booking, BookingStatus, Court, PaymentStatus, Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const bookingSchema = z.object({
  user_id: z.string().uuid({ message: 'Selecione um usuário' }),
  court_id: z.string().uuid({ message: 'Selecione uma quadra' }),
  booking_date: z.date({ required_error: 'Selecione uma data' }),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)"
  }),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)"
  }),
  amount: z.coerce.number().positive({ message: "Valor deve ser positivo" }),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  payment_status: z.enum(['pending', 'paid', 'refunded', 'failed']),
  notes: z.string().optional(),
  is_monthly: z.boolean().default(false),
  subscription_end_date: z.date().optional()
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  booking,
  isOpen,
  onClose
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingSchedule, setIsValidatingSchedule] = useState(false);
  const [scheduleConflict, setScheduleConflict] = useState(false);
  const [courtRate, setCourtRate] = useState(0);
  const [weeks, setWeeks] = useState(0);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  
  // Fetch users (profiles)
  const { data: users } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');
      
      if (error) throw error;
      return data as unknown as Profile[];
    }
  });

  // Fetch courts
  const { data: courts } = useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as unknown as Court[];
    }
  });

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      user_id: '',
      court_id: '',
      booking_date: new Date(),
      start_time: '08:00',
      end_time: '09:00',
      amount: 0,
      status: 'pending' as BookingStatus,
      payment_status: 'pending' as PaymentStatus,
      notes: '',
      is_monthly: false,
      subscription_end_date: undefined
    }
  });

  const watchCourtId = form.watch('court_id');
  const watchStartTime = form.watch('start_time');
  const watchEndTime = form.watch('end_time');
  const watchBookingDate = form.watch('booking_date');
  const watchIsMonthly = form.watch('is_monthly');
  const watchSubscriptionEndDate = form.watch('subscription_end_date');

  // Calculate total amount based on court rate and time difference
  useEffect(() => {
    if (watchCourtId && watchStartTime && watchEndTime) {
      const fetchCourtRate = async () => {
        // Convert booking date to day of week (0-6, Sunday-Saturday)
        const bookingDay = watchBookingDate ? watchBookingDate.getDay() : new Date().getDay();
        // Adjust to match the database format (where 0 is Monday, 6 is Sunday)
        const dayOfWeek = bookingDay === 0 ? 6 : bookingDay - 1;
        
        try {
          // First check for matching schedule with exactly the same times
          const { data: exactSchedules, error: exactError } = await supabase
            .from('schedules')
            .select('*')
            .eq('court_id', watchCourtId)
            .eq('day_of_week', dayOfWeek)
            .eq('start_time', watchStartTime)
            .eq('end_time', watchEndTime);
          
          if (exactError) {
            console.error('Error fetching exact court rate:', exactError);
            return;
          }
          
          let scheduleData;
          
          if (exactSchedules && exactSchedules.length > 0) {
            // Found an exact match
            scheduleData = exactSchedules[0];
            setSelectedSchedule(scheduleData);
          } else {
            // Find by overlapping time ranges
            const { data: schedules, error } = await supabase
              .from('schedules')
              .select('*')
              .eq('court_id', watchCourtId)
              .eq('day_of_week', dayOfWeek);
              
            if (error) {
              console.error('Error fetching court rate:', error);
              return;
            }
            
            if (!schedules || schedules.length === 0) {
              console.error('No schedules found for this court and day');
              return;
            }
            
            // Find the schedule that encompasses our booking time
            scheduleData = schedules.find(schedule => {
              const bookingStart = watchStartTime;
              const bookingEnd = watchEndTime;
              const scheduleStart = schedule.start_time;
              const scheduleEnd = schedule.end_time;
              
              // Check if booking time falls within this schedule
              return bookingStart >= scheduleStart && bookingEnd <= scheduleEnd;
            });
            
            if (!scheduleData) {
              console.error('No matching schedule for this time range');
              setSelectedSchedule(null);
              return;
            }
            
            setSelectedSchedule(scheduleData);
          }

          if (scheduleData) {
            const isWeekend = [5, 6].includes(dayOfWeek); // Friday and Saturday in our adjusted system
            const hourlyRate = isWeekend && scheduleData.price_weekend ? 
              scheduleData.price_weekend : scheduleData.price;
            
            setCourtRate(hourlyRate);
            
            // Calculate time difference in hours
            const [startHour, startMin] = watchStartTime.split(':').map(Number);
            const [endHour, endMin] = watchEndTime.split(':').map(Number);
            
            const startDate = new Date();
            startDate.setHours(startHour, startMin, 0, 0);
            
            const endDate = new Date();
            endDate.setHours(endHour, endMin, 0, 0);
            
            // If end time is before start time, assume it's the next day
            if (endDate < startDate) {
              endDate.setDate(endDate.getDate() + 1);
            }
            
            const diffHours = differenceInMinutes(endDate, startDate) / 60;
            
            // Calculate total amount
            // For monthly subscriptions, calculate weeks between start and end dates
            if (watchIsMonthly && watchSubscriptionEndDate) {
              const weeksList = eachWeekOfInterval({
                start: startOfDay(watchBookingDate),
                end: endOfDay(watchSubscriptionEndDate)
              });
              
              const weekCount = weeksList.length;
              setWeeks(weekCount);
              
              // Apply monthly discount if available
              let discountedRate = hourlyRate;
              if (scheduleData.is_monthly && scheduleData.monthly_discount) {
                discountedRate = hourlyRate * (1 - scheduleData.monthly_discount / 100);
              }
              
              form.setValue('amount', Number((discountedRate * diffHours * weekCount).toFixed(2)));
            } else {
              form.setValue('amount', Number((hourlyRate * diffHours).toFixed(2)));
            }
          }
        } catch (error) {
          console.error('Error calculating court rate:', error);
        }
      };
      
      fetchCourtRate();
    }
  }, [watchCourtId, watchStartTime, watchEndTime, watchBookingDate, watchIsMonthly, watchSubscriptionEndDate, form]);

  // Check for booking conflicts
  useEffect(() => {
    if (watchCourtId && watchStartTime && watchEndTime && watchBookingDate) {
      const checkBookingConflict = async () => {
        setIsValidatingSchedule(true);
        setScheduleConflict(false);
        
        try {
          const bookingDateStr = format(watchBookingDate, 'yyyy-MM-dd');
          
          // Get existing bookings for this court and date
          const { data: existingBookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('court_id', watchCourtId)
            .eq('booking_date', bookingDateStr)
            .neq('status', 'cancelled');
            
          if (error) {
            console.error('Error checking booking conflicts:', error);
            return;
          }
          
          // Check if our time slot overlaps with any existing booking
          // Exclude the current booking if we're editing
          const conflictingBooking = existingBookings?.find(existingBooking => {
            if (booking && existingBooking.id === booking.id) return false;
            
            const [startHour, startMin] = watchStartTime.split(':').map(Number);
            const [endHour, endMin] = watchEndTime.split(':').map(Number);
            
            const [existingStartHour, existingStartMin] = existingBooking.start_time.split(':').map(Number);
            const [existingEndHour, existingEndMin] = existingBooking.end_time.split(':').map(Number);
            
            const newStart = new Date(bookingDateStr);
            newStart.setHours(startHour, startMin, 0, 0);
            
            const newEnd = new Date(bookingDateStr);
            newEnd.setHours(endHour, endMin, 0, 0);
            
            const existingStart = new Date(existingBooking.booking_date);
            existingStart.setHours(existingStartHour, existingStartMin, 0, 0);
            
            const existingEnd = new Date(existingBooking.booking_date);
            existingEnd.setHours(existingEndHour, existingEndMin, 0, 0);
            
            // Check if the new booking overlaps with existing
            return (newStart < existingEnd && newEnd > existingStart);
          });
          
          if (conflictingBooking) {
            setScheduleConflict(true);
          }
        } finally {
          setIsValidatingSchedule(false);
        }
      };
      
      checkBookingConflict();
    }
  }, [watchCourtId, watchStartTime, watchEndTime, watchBookingDate, booking]);

  useEffect(() => {
    if (booking) {
      const bookingDate = booking.booking_date instanceof Date ? 
        booking.booking_date : 
        new Date(booking.booking_date);
      
      const formValues: Partial<BookingFormValues> = {
        user_id: booking.user_id,
        court_id: booking.court_id,
        booking_date: bookingDate,
        start_time: booking.start_time,
        end_time: booking.end_time,
        amount: Number(booking.amount),
        status: booking.status,
        payment_status: booking.payment_status,
        notes: booking.notes || '',
        is_monthly: booking.is_monthly || false,
        subscription_end_date: booking.subscription_end_date ? 
          (booking.subscription_end_date instanceof Date ? 
            booking.subscription_end_date : 
            new Date(booking.subscription_end_date)) : 
          undefined
      };
      
      form.reset(formValues);
    } else {
      form.reset({
        user_id: '',
        court_id: '',
        booking_date: new Date(),
        start_time: '08:00',
        end_time: '09:00',
        amount: 0,
        status: 'pending' as BookingStatus,
        payment_status: 'pending' as PaymentStatus,
        notes: '',
        is_monthly: false,
        subscription_end_date: undefined
      });
    }
  }, [booking, form]);

  const onSubmit = async (values: BookingFormValues) => {
    // Check if we have a valid schedule
    if (!selectedSchedule) {
      toast({
        title: 'Horário inválido',
        description: 'Não foi possível encontrar um horário disponível para esta quadra no dia e horário selecionados.',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate time difference is at least the minimum booking time
    const [startHour, startMin] = values.start_time.split(':').map(Number);
    const [endHour, endMin] = values.end_time.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startHour, startMin, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(endHour, endMin, 0, 0);
    
    // If end time is before start time, assume it's the next day
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const diffMinutes = differenceInMinutes(endDate, startDate);
    
    if (diffMinutes < selectedSchedule.min_booking_time) {
      toast({
        title: 'Tempo insuficiente',
        description: `A reserva deve ter no mínimo ${selectedSchedule.min_booking_time} minutos de duração.`,
        variant: 'destructive'
      });
      return;
    }
    
    // Check for schedule conflicts
    if (scheduleConflict) {
      toast({
        title: 'Conflito de horários',
        description: 'Já existe uma reserva para este horário.',
        variant: 'destructive'
      });
      return;
    }
    
    // Check if the time range is within the schedule's range
    const scheduleStart = selectedSchedule.start_time.split(':').map(Number);
    const scheduleEnd = selectedSchedule.end_time.split(':').map(Number);
    
    const scheduleStartDate = new Date();
    scheduleStartDate.setHours(scheduleStart[0], scheduleStart[1], 0, 0);
    
    const scheduleEndDate = new Date();
    scheduleEndDate.setHours(scheduleEnd[0], scheduleEnd[1], 0, 0);
    
    if (startDate < scheduleStartDate || endDate > scheduleEndDate) {
      toast({
        title: 'Horário fora do período disponível',
        description: `Este horário não está disponível. Horários disponíveis: ${selectedSchedule.start_time} - ${selectedSchedule.end_time}`,
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const bookingData = {
        user_id: values.user_id,
        court_id: values.court_id,
        booking_date: format(values.booking_date, 'yyyy-MM-dd'),
        start_time: values.start_time,
        end_time: values.end_time,
        amount: values.amount,
        status: values.status,
        payment_status: values.payment_status,
        notes: values.notes,
        is_monthly: values.is_monthly,
        subscription_end_date: values.is_monthly && values.subscription_end_date ? 
          format(values.subscription_end_date, 'yyyy-MM-dd') : 
          null,
        updated_at: new Date().toISOString()
      };
      
      if (booking) {
        // Update booking
        const { error } = await supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', booking.id);
        
        if (error) throw error;
        
        toast({
          title: 'Reserva atualizada',
          description: 'A reserva foi atualizada com sucesso',
        });
      } else {
        // Create booking
        const { error } = await supabase
          .from('bookings')
          .insert({
            ...bookingData,
            created_by: null // TODO: get from auth context
          });
        
        if (error) throw error;
        
        toast({
          title: 'Reserva criada',
          description: 'A reserva foi criada com sucesso',
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar reserva:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a reserva',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatUserName = (user: Profile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else {
      return `Usuário ${user.id.slice(0, 8)}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {booking ? 'Detalhes da Reserva' : 'Nova Reserva'}
          </DialogTitle>
          <DialogDescription>
            {booking
              ? 'Visualize ou edite os detalhes da reserva'
              : 'Crie uma nova reserva no sistema'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {formatUserName(user)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="court_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quadra</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma quadra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courts?.map((court) => (
                          <SelectItem key={court.id} value={court.id}>
                            {court.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="booking_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Reserva</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => isBefore(date, startOfDay(new Date()))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
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
                      <FormLabel>Hora Início</FormLabel>
                      <FormControl>
                        <Input placeholder="HH:MM" {...field} />
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
                      <FormLabel>Hora Fim</FormLabel>
                      <FormControl>
                        <Input placeholder="HH:MM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_monthly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Mensalista</FormLabel>
                      <FormDescription>
                        Cliente pagará mensalmente por este horário
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

              {form.watch('is_monthly') && (
                <FormField
                  control={form.control}
                  name="subscription_end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data Final da Mensalidade</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => isBefore(date, watchBookingDate)}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        {weeks > 0 && `${weeks} semana${weeks > 1 ? 's' : ''} de mensalidade`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      {courtRate > 0 && `Taxa horária: R$ ${courtRate.toFixed(2)}`}
                      {selectedSchedule?.is_monthly && selectedSchedule?.monthly_discount > 0 && (
                        <span className="block mt-1 text-green-600">
                          Desconto mensalista: {selectedSchedule.monthly_discount}%
                        </span>
                      )}
                      {scheduleConflict && (
                        <span className="text-red-500 block mt-1">
                          ⚠️ Conflito de horário detectado
                        </span>
                      )}
                      {isValidatingSchedule && (
                        <span className="text-blue-500 flex items-center gap-1 mt-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Verificando disponibilidade...
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                          <SelectItem value="completed">Concluída</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pagamento</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="failed">Falhou</SelectItem>
                          <SelectItem value="refunded">Reembolsado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais sobre esta reserva" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
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
              <Button 
                type="submit" 
                disabled={isSubmitting || scheduleConflict || isValidatingSchedule}
              >
                {isSubmitting ? 'Salvando...' : booking ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
