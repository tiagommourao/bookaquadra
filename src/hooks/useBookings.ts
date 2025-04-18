
export function useCancelBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingId: string): Promise<Booking> => {
      // Atualizar o status da reserva e do pagamento para cancelado
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          payment_status: 'cancelled', // Adiciona atualização do status de pagamento
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
        description: "Sua reserva foi cancelada e o pagamento foi marcado como cancelado."
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
