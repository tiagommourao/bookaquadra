
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BookingRequest, BookingResponse } from '@/types/booking';
import { toast } from '@/hooks/use-toast';

export function useUserBookings() {
  return useQuery({
    queryKey: ['userBookings'],
    queryFn: async (): Promise<Booking[]> => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          court:courts(id, name, type_id, image_url)
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data as Booking[] || [];
    }
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingData: BookingRequest): Promise<BookingResponse> => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Inserir a reserva no banco de dados
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          user_id: user.id,
          status: 'pending',
          payment_status: 'pending'
        })
        .select(`
          *,
          court:courts(id, name, type_id, image_url)
        `)
        .single();
      
      if (error) throw error;
      
      // Aqui seria o local para integrar com o MercadoPago
      // Por enquanto, retornamos só a reserva
      return {
        booking: data as Booking,
        payment_url: null // Futuramente, aqui retornará a URL de pagamento do MercadoPago
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      toast({
        title: "Reserva criada com sucesso!",
        description: "Acompanhe o status na página 'Minhas Reservas'."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar reserva",
        description: error.message || "Ocorreu um erro ao processar sua reserva.",
        variant: "destructive"
      });
    }
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingId: string): Promise<Booking> => {
      // Atualizar o status da reserva para cancelada
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      toast({
        title: "Reserva cancelada",
        description: "Sua reserva foi cancelada com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cancelar reserva",
        description: error.message || "Não foi possível cancelar a reserva.",
        variant: "destructive"
      });
    }
  });
}
