
import { UseFormReturn } from 'react-hook-form';
import { format, differenceInHours, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types';
import { BookingFormValues } from '../booking-schema';
import { toast } from '@/hooks/use-toast';
import { formatDateForDB } from '../booking-utils';

export function useBookingSubmission({
  booking,
  onClose,
  selectedSchedules,
  scheduleConflict,
  setIsSubmitting,
  form
}: {
  booking: Booking | null;
  onClose: () => void;
  selectedSchedules: any[];
  scheduleConflict: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  form: UseFormReturn<BookingFormValues>;
}) {
  // Generate recurring dates for monthly bookings
  const generateRecurringDates = (startDate: Date, endDate: Date): Date[] => {
    if (!startDate || !endDate) return [];
    
    // Pegamos o dia da semana da data inicial
    const dayOfWeek = startDate.getDay();
    let currentDate = new Date(startDate);
    const dates = [new Date(startDate)]; // Inclui a data inicial

    // Avança a data em 7 dias até chegar à data final ou ultrapassá-la
    while (true) {
      // Adiciona 7 dias para criar a próxima data (mesma semana a cada vez)
      currentDate = addDays(currentDate, 7);
      
      // Verifica se passou da data final
      if (currentDate > endDate) break;
      
      // Adiciona a nova data ao array
      dates.push(new Date(currentDate));
    }
    
    return dates;
  };

  // Create recurring bookings for monthly subscriptions
  const createRecurringBookings = async (values: BookingFormValues, mainBookingId: string) => {
    if (!values.is_monthly || !values.subscription_end_date || !values.booking_date) {
      return;
    }
    
    try {
      // Gera todas as datas recorrentes entre as datas de início e fim
      // EXCLUINDO a primeira data (que já foi criada como a reserva principal)
      const recurringDates = generateRecurringDates(values.booking_date, values.subscription_end_date).slice(1);
      
      if (recurringDates.length === 0) {
        console.log('Não há datas recorrentes para criar');
        return;
      }
      
      // Cria reservas para cada data recorrente
      for (const recurringDate of recurringDates) {
        const bookingData = {
          user_id: values.user_id,
          court_id: values.court_id,
          booking_date: formatDateForDB(recurringDate),
          start_time: values.start_time,
          end_time: values.end_time,
          amount: values.amount / (recurringDates.length + 1), // Divide o valor entre todas as reservas
          status: values.status,
          payment_status: values.payment_status,
          notes: `${values.notes || ''} (Parte de reserva mensal: ${mainBookingId})`,
          is_monthly: false, // As reservas individuais não são mensais
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null
        };
        
        const { error } = await supabase
          .from('bookings')
          .insert(bookingData);
          
        if (error) {
          console.error(`Erro ao criar reserva recorrente para ${formatDateForDB(recurringDate)}:`, error);
        }
      }
      
      toast({
        title: 'Reservas recorrentes criadas',
        description: `Foram criadas ${recurringDates.length} reservas semanais até ${format(values.subscription_end_date, 'dd/MM/yyyy')}`
      });
      
    } catch (error) {
      console.error('Erro ao criar reservas recorrentes:', error);
      toast({
        title: 'Erro ao criar reservas recorrentes',
        description: 'Algumas reservas recorrentes podem não ter sido criadas',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (values: BookingFormValues) => {
    if (selectedSchedules.length === 0) {
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
      // Usa a função auxiliar para formatar a data
      const bookingDateForDB = formatDateForDB(values.booking_date);
      
      const bookingData = {
        user_id: values.user_id,
        court_id: values.court_id,
        booking_date: bookingDateForDB,
        start_time: values.start_time,
        end_time: values.end_time,
        amount: values.amount,
        status: values.status,
        payment_status: values.payment_status,
        notes: values.notes,
        is_monthly: values.is_monthly,
        subscription_end_date: values.is_monthly && values.subscription_end_date ? 
          formatDateForDB(values.subscription_end_date) : 
          null,
        updated_at: new Date().toISOString()
      };
      
      if (booking) {
        const { error, data } = await supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', booking.id)
          .select();
        
        if (error) throw error;
        
        toast({
          title: 'Reserva atualizada',
          description: 'A reserva foi atualizada com sucesso',
        });
        
        // Handle recurring bookings if it's a monthly booking
        if (values.is_monthly && values.subscription_end_date && !booking.is_monthly) {
          await createRecurringBookings(values, booking.id);
        }
      } else {
        const { error, data } = await supabase
          .from('bookings')
          .insert({
            ...bookingData,
            created_by: null
          })
          .select();
        
        if (error) throw error;
        
        toast({
          title: 'Reserva criada',
          description: 'A reserva foi criada com sucesso',
        });
        
        // Create recurring weekly bookings if it's a monthly booking
        if (data && data[0] && values.is_monthly && values.subscription_end_date) {
          await createRecurringBookings(values, data[0].id);
        }
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

  return { handleSubmit };
}
