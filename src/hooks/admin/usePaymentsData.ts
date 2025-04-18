
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Payment, PaymentStatistics, PaymentStatusLog, PaymentStatus } from '@/types/payment';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PaymentFilters {
  status: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  search: string;
}

export const usePaymentsData = (filters: PaymentFilters) => {
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);

  const fetchPayments = useCallback(async () => {
    let query = supabase
      .from('payment_details_view')
      .select('*')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      query = query.eq('payment_method', filters.paymentMethod);
    }

    if (filters.startDate) {
      query = query.gte('created_at', `${filters.startDate}T00:00:00`);
    }

    if (filters.endDate) {
      query = query.lte('created_at', `${filters.endDate}T23:59:59`);
    }

    if (filters.minAmount) {
      query = query.gte('amount', filters.minAmount);
    }

    if (filters.maxAmount) {
      query = query.lte('amount', filters.maxAmount);
    }

    if (filters.search) {
      query = query.or(`id.ilike.%${filters.search}%,mercadopago_payment_id.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      toast.error('Erro ao carregar pagamentos');
      return [];
    }

    // Calcular estatísticas
    if (data) {
      calculateStatistics(data as Payment[]);
    }

    return data as Payment[] || [];
  }, [filters]);

  const calculateStatistics = (payments: Payment[]) => {
    const stats: PaymentStatistics = {
      totalPayments: payments.length,
      paidAmount: payments
        .filter(p => p.status === 'paid')
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
      pendingAmount: payments
        .filter(p => p.status === 'pending')
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
      cancelledAmount: payments
        .filter(p => ['cancelled', 'rejected', 'expired'].includes(p.status as string))
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
    };

    setStatistics(stats);
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments', filters],
    queryFn: fetchPayments
  });

  const exportPayments = (format: 'csv' | 'excel') => {
    const payments = data || [];
    
    if (payments.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    // Preparar dados para exportação
    const exportData = payments.map(payment => ({
      ID: payment.id,
      Status: payment.status,
      Valor: payment.amount,
      'Método de Pagamento': payment.payment_method,
      'Data de Criação': new Date(payment.created_at).toLocaleString('pt-BR'),
      'Data de Vencimento': payment.expiration_date ? 
        new Date(payment.expiration_date).toLocaleString('pt-BR') : 
        'N/A',
      'ID do Usuário': payment.user_id || 'N/A',
      'ID da Reserva': payment.booking_id || 'N/A',
      'ID MercadoPago': payment.mercadopago_payment_id || 'N/A',
      'Cliente': payment.first_name && payment.last_name ? 
        `${payment.first_name} ${payment.last_name}` : 'N/A',
      'Quadra': payment.court_name || 'N/A',
      'Data da Reserva': payment.booking_date ? 
        new Date(payment.booking_date).toLocaleDateString('pt-BR') : 'N/A',
      'Horário': payment.start_time || 'N/A'
    }));

    // Converter para CSV/Excel (implementação básica para CSV)
    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pagamentos_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exportação em ${format === 'csv' ? 'CSV' : 'Excel'} concluída`);
  };

  return {
    payments: data || [],
    isLoading,
    refetch,
    statistics,
    exportPayments
  };
};

export const useUpdatePaymentStatus = (paymentId: string) => {
  const { user } = useAuth();

  // Buscar histórico de status de um pagamento específico
  const fetchStatusLogs = useCallback(async () => {
    // First try to get any status logs recorded in the payment_status_logs table
    const { data: statusLogs, error: logsError } = await supabase
      .from('payment_status_logs')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching payment status logs:', logsError);
      throw logsError;
    }

    // If no status logs were found, we need to fetch the payment details to create an initial log
    if (!statusLogs || statusLogs.length === 0) {
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError) {
        console.error('Error fetching payment details:', paymentError);
        return [];
      }

      if (payment) {
        // Create a synthetic initial log entry based on the payment record
        return [{
          id: 'initial',
          payment_id: payment.id,
          previous_status: 'pending', // Assume initial status was pending
          new_status: payment.status,
          created_at: payment.created_at,
          created_by: payment.admin_modified_by || null,
          reason: 'Status inicial do pagamento'
        }] as PaymentStatusLog[];
      }
    }

    return statusLogs as PaymentStatusLog[] || [];
  }, [paymentId]);

  // Buscar todas as tentativas de pagamento relacionadas a uma reserva
  const fetchRelatedPayments = useCallback(async (bookingId: string | null) => {
    if (!bookingId) return [];
    
    const { data, error } = await supabase
      .from('payment_history_view')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching related payments:', error);
      return [];
    }
    
    return data as Payment[];
  }, []);

  // Buscar detalhes de um pagamento específico
  const fetchPaymentDetails = useCallback(async (id: string) => {
    console.log('Fetching payment details for:', id);
    
    const { data, error } = await supabase
      .from('payment_details_view')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // Usamos maybeSingle() ao invés de single() para evitar erros quando não encontrar
    
    if (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Erro ao carregar detalhes do pagamento');
      return null;
    }
    
    if (!data) {
      console.warn('No payment found with id:', id);
      toast.error('Pagamento não encontrado');
      return null;
    }
    
    return data as Payment;
  }, []);

  const { mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async ({ newStatus, reason }: { newStatus: PaymentStatus; reason: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Get the current payment status first
      const { data: currentPayment, error: fetchError } = await supabase
        .from('payments')
        .select('status')
        .eq('id', paymentId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Only update if the status is actually changing
      if (currentPayment.status !== newStatus) {
        // Atualizar o status do pagamento
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: newStatus,
            admin_modified_by: user.id,
            admin_modification_reason: reason,
          })
          .eq('id', paymentId);

        if (updateError) {
          throw updateError;
        }
      } else {
        // If status isn't changing, just add a log entry manually
        const { error: logError } = await supabase
          .from('payment_status_logs')
          .insert({
            payment_id: paymentId,
            previous_status: currentPayment.status,
            new_status: newStatus,
            created_by: user.id,
            reason: reason
          });

        if (logError) {
          throw logError;
        }
      }

      return { success: true };
    }
  });

  const updateStatus = async (newStatus: PaymentStatus, reason: string) => {
    return mutateAsync({ newStatus, reason });
  };

  return {
    updateStatus,
    isLoading: isPending,
    isSuccess,
    fetchStatusLogs,
    fetchRelatedPayments,
    fetchPaymentDetails
  };
};
