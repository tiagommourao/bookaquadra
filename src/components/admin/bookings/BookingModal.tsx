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

const isFullHourTime = (value: string) => {
  const regex = /^([0-1]?[0-9]|2[0-3]):00$/;
  return regex.test(value);
};

const bookingSchema = z.object({
  user_id: z.string().uuid({ message: 'Selecione um usuário' }),
  court_id: z.string().uuid({ message: 'Selecione uma quadra' }),
  booking_date: z.date({ required_error: 'Selecione uma data' }),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)"
  }).refine(isFullHourTime, {
    message: "O horário de início deve ser uma hora fechada (ex: 08:00, 09:00)"
  }),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)"
  }).refine(isFullHourTime, {
    message: "O horário de término deve ser uma hora fechada (ex: 09:00, 10:00)"
  }),
  amount: z.coerce.number().positive({ message: "Valor deve ser positivo" }),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  payment_status: z.enum(['pending', 'paid', 'refunded', 'failed']),
  notes: z.string().optional(),
  is_monthly: z.boolean().default(false),
  subscription_end_date: z.date().optional()
}).refine((data) => {
  if (data.is_monthly && !data.subscription_end_date) {
    return false;
  }
  return true;
}, {
  message: "Data final da mensalidade é obrigatória quando mensalista está selecionado",
  path: ["subscription_end_date"]
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
  const [overlappingSchedules, setOverlappingSchedules] = useState<any[]>([]);
  
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

  const fetchApplicableSchedules = async () => {
    if (!watchCourtId || !watchBookingDate || !watchStartTime || !watchEndTime) {
      return [];
    }
    
    const bookingDay = watchBookingDate ? watchBookingDate.getDay() : new Date().getDay();
    const dayOfWeek = bookingDay === 0 ? 6 : bookingDay - 1;
    
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('court_id', watchCourtId)
      .eq('day_of_week', dayOfWeek);
      
    if (error) {
      console.error('Error fetching schedules:', error);
      return [];
    }
    
    return schedules || [];
  };

  useEffect(() => {
    if (watchCourtId && watchStartTime && watchEndTime && watchBookingDate) {
      const calculateTotalAmount = async () => {
        try {
          const [startHour, startMin] = watchStartTime.split(':').map(Number);
          const [endHour, endMin] = watchEndTime.split(':').map(Number);
          
          const startDate = new Date();
          startDate.setHours(startHour, startMin, 0, 0);
          
          const endDate = new Date();
          endDate.setHours(endHour, endMin, 0, 0);
          
          if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
          }
          
          const diffHours = differenceInHours(endDate, startDate);
          
          if (diffHours <= 0) {
            setCourtRate(0);
            form.setValue('amount', 0);
            return;
          }

          const schedules = await fetchApplicableSchedules();
          setOverlappingSchedules(schedules);
          
          if (!schedules || schedules.length === 0) {
            console.error('No schedules found for this court and day');
            setSelectedSchedule(null);
            form.setValue('amount', 0);
            return;
          }

          const overlappingRates: { schedule: any; hours: number }[] = [];
          
          for (const schedule of schedules) {
            const scheduleStart = schedule.start_time.split(':').map(Number);
            const scheduleEnd = schedule.end_time.split(':').map(Number);
            
            const scheduleStartDate = new Date();
            scheduleStartDate.setHours(scheduleStart[0], scheduleStart[1], 0, 0);
            
            const scheduleEndDate = new Date();
            scheduleEndDate.setHours(scheduleEnd[0], scheduleEnd[1], 0, 0);
            
            const overlapStart = startDate > scheduleStartDate ? startDate : scheduleStartDate;
            const overlapEnd = endDate < scheduleEndDate ? endDate : scheduleEndDate;
            
            if (overlapEnd > overlapStart) {
              const hoursInSchedule = differenceInHours(overlapEnd, overlapStart);
              if (hoursInSchedule > 0) {
                overlappingRates.push({ 
                  schedule, 
                  hours: hoursInSchedule 
                });
              }
            }
          }
          
          if (overlappingRates.length === 0) {
            toast({
              title: 'Horário inválido',
              description: 'O horário selecionado não está disponível para esta quadra',
              variant: 'destructive'
            });
            setSelectedSchedule(null);
            form.setValue('amount', 0);
            return;
          }
          
          let totalAmount = 0;
          let weekCount = 1;
          
          if (watchIsMonthly && watchSubscriptionEndDate) {
            const weeksList = eachWeekOfInterval({
              start: startOfDay(watchBookingDate),
              end: endOfDay(watchSubscriptionEndDate)
            });
            
            weekCount = weeksList.length;
            setWeeks(weekCount);
          }
          
          const bookingDay = watchBookingDate ? watchBookingDate.getDay() : new Date().getDay();
          const dayOfWeek = bookingDay === 0 ? 6 : bookingDay - 1;
          
          for (const { schedule, hours } of overlappingRates) {
            const isWeekend = [5, 6].includes(dayOfWeek);
            let hourlyRate = schedule.price;
            if (isWeekend && schedule.price_weekend) {
              hourlyRate = schedule.price_weekend;
            }
            
            if (watchIsMonthly && schedule.is_monthly && schedule.monthly_discount) {
              hourlyRate = hourlyRate * (1 - schedule.monthly_discount / 100);
            }
            
            totalAmount += hourlyRate * hours * weekCount;
          }
          
          form.setValue('amount', Number(totalAmount.toFixed(2)));
          
          if (overlappingRates.length > 0) {
            setSelectedSchedule(overlappingRates[0].schedule);
            setCourtRate(overlappingRates[0].schedule.price);
          }
        } catch (error) {
          console.error('Error calculating court rate:', error);
          form.setValue('amount', 0);
        }
      };
      
      calculateTotalAmount();
    }
  }, [watchCourtId, watchStartTime, watchEndTime, watchBookingDate, watchIsMonthly, watchSubscriptionEndDate, form]);

  useEffect(() => {
    if (watchCourtId && watchStartTime && watchEndTime && watchBookingDate) {
      const checkBookingConflict = async () => {
        setIsValidatingSchedule(true);
        setScheduleConflict(false);
        
        try {
          const bookingDateStr = format(watchBookingDate, 'yyyy-MM-dd');
          
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
            
            if (newStart < existingEnd && newEnd > existingStart) {
              return true;
            }
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
    if (!isFullHourTime(values.start_time) || !isFullHourTime(values.end_time)) {
      toast({
        title: 'Horários inválidos',
        description: 'Os horários de início e término devem ser horas fechadas (ex: 08:00, 09:00)',
        variant: 'destructive'
      });
      return;
    }
    
    if (overlappingSchedules.length === 0) {
      toast({
        title: 'Horário inválido',
        description: 'Não foi possível encontrar um horário disponível para esta quadra no dia e horário selecionados.',
        variant: 'destructive'
      });
      return;
    }

    const [startHour, startMin] = values.start_time.split(':').map(Number);
    const [endHour, endMin] = values.end_time.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startHour, startMin, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(endHour, endMin, 0, 0);
    
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const diffHours = differenceInHours(endDate, startDate);
    if (diffHours < 1) {
      toast({
        title: 'Tempo insuficiente',
        description: `A reserva deve ter no mínimo 1 hora de duração.`,
        variant: 'destructive'
      });
      return;
    }
    
    if (scheduleConflict) {
      toast({
        title: 'Conflito de horários',
        description: 'Já existe uma reserva para este horário.',
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
        const { error } = await supabase
          .from('bookings')
          .insert({
            ...bookingData,
            created_by: null
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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
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
                      <FormLabel>Hora Fim</FormLabel>
                      <FormControl>
                        <Input placeholder="HH:MM" {...field} />
                      </FormControl>
                      <FormDescription>Formato: 09:00</FormDescription>
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
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        readOnly={true} 
                        className="bg-muted"
                        {...field} 
                      />
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

            <DialogFooter className="pt-6 sticky bottom-0 bg-background pb-2">
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
