
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Payment, PaymentStatusLog, PaymentStatus } from '@/types/payment';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useUpdatePaymentStatus } from '@/hooks/admin/usePaymentsData';
import { toast } from 'sonner';
import { Loader2, Copy, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PaymentModalProps {
  payment: Payment;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  payment, 
  isOpen, 
  onClose,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>(payment.status);
  const [reason, setReason] = useState('');
  const [statusLogs, setStatusLogs] = useState<PaymentStatusLog[]>([]);
  const [relatedPayments, setRelatedPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const { 
    updateStatus, 
    isLoading: isUpdating, 
    fetchStatusLogs, 
    fetchRelatedPayments, 
    fetchPaymentDetails 
  } = useUpdatePaymentStatus(payment.id);

  // Carregar o pagamento selecionado inicialmente
  useEffect(() => {
    if (isOpen && payment) {
      setSelectedStatus(payment.status);
      setSelectedPayment(payment);
      loadStatusLogs();
      loadRelatedPayments();
    }
  }, [isOpen, payment]);

  // Carregar histórico de status do pagamento atual
  const loadStatusLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await fetchStatusLogs();
      setStatusLogs(logs);
    } catch (error) {
      console.error('Error loading payment status logs:', error);
      toast.error('Erro ao carregar histórico de status');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Carregar todos os pagamentos relacionados à mesma reserva
  const loadRelatedPayments = async () => {
    if (!payment.booking_id) return;
    
    setIsLoadingPayments(true);
    try {
      const payments = await fetchRelatedPayments(payment.booking_id);
      setRelatedPayments(payments);
    } catch (error) {
      console.error('Error loading related payments:', error);
      toast.error('Erro ao carregar tentativas de pagamento');
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // Selecionar um pagamento específico
  const handleSelectPayment = async (paymentId: string) => {
    // Se o pagamento já está selecionado, não faz nada
    if (selectedPayment?.id === paymentId) return;
    
    setIsLoadingPayments(true);
    try {
      const paymentDetails = await fetchPaymentDetails(paymentId);
      if (paymentDetails) {
        setSelectedPayment(paymentDetails);
        // Se estamos na aba de histórico, mudar para raw data para mostrar os detalhes
        if (activeTab === 'history') {
          setActiveTab('raw');
        }
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Erro ao carregar detalhes do pagamento');
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!reason.trim()) {
      toast.error('Por favor, forneça um motivo para a alteração de status');
      return;
    }

    try {
      await updateStatus(selectedStatus, reason);
      toast.success('Status do pagamento atualizado com sucesso');
      loadStatusLogs(); // Reload logs after status update
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Erro ao atualizar status do pagamento');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const formatDateWithoutTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatRelativeDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Recusado</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500">Expirado</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-500">Reembolsado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-400">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-400">{status}</Badge>;
    }
  };

  const getPaymentMethodText = (method: string | null | undefined) => {
    switch (method) {
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'debit_card':
        return 'Cartão de Débito';
      case 'boleto':
        return 'Boleto';
      case 'pix':
        return 'PIX';
      case 'bank_transfer':
        return 'Transferência Bancária';
      case 'cash':
        return 'Dinheiro';
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'MasterCard';
      case 'amex':
        return 'American Express';
      case 'bolbradesco':
        return 'Boleto Bradesco';
      case 'other':
        return 'Outro';
      default:
        return 'Não informado';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Detalhes do Pagamento 
            <span className="ml-2 text-sm opacity-70">#{selectedPayment?.id.slice(0, 8) || payment.id.slice(0, 8)}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="history">
              Histórico 
              {relatedPayments.length > 0 && <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 rounded-full">{relatedPayments.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            {/* Informações básicas do pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">{getStatusBadge(payment.status)}</div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Valor</h3>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(payment.amount)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Método de Pagamento</h3>
                <p className="mt-1">{getPaymentMethodText(payment.payment_method)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Data de Criação</h3>
                <p className="mt-1">{formatDate(payment.created_at)}</p>
                <p className="text-xs text-gray-500">({formatRelativeDate(payment.created_at)})</p>
              </div>

              {payment.expiration_date && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data de Vencimento</h3>
                  <p className="mt-1">{formatDate(payment.expiration_date)}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500">Usuário</h3>
                <div className="mt-1">
                  {payment.first_name && payment.last_name ? (
                    <p className="text-blue-600">
                      {payment.first_name} {payment.last_name}
                    </p>
                  ) : (
                    <p className="text-gray-500">Usuário não encontrado</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {payment.user_id}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-1"
                      onClick={() => copyToClipboard(payment.user_id || '')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Reserva</h3>
                <div className="mt-1">
                  {payment.court_name && payment.booking_date ? (
                    <>
                      <p className="text-blue-600">
                        {payment.court_name} - {formatDateWithoutTime(payment.booking_date)}
                        {payment.start_time && ` ${payment.start_time}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {payment.booking_id}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 ml-1"
                          onClick={() => copyToClipboard(payment.booking_id || '')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">Reserva não encontrada</p>
                  )}
                </div>
              </div>

              {payment.mercadopago_payment_id && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">ID MercadoPago</h3>
                  <div className="mt-1 flex items-center">
                    <span className="text-blue-600">{payment.mercadopago_payment_id}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-1"
                      onClick={() => copyToClipboard(payment.mercadopago_payment_id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Formulário de atualização de status */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-3">Atualizar Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Novo Status</label>
                  <Select 
                    value={selectedStatus} 
                    onValueChange={(value) => setSelectedStatus(value as PaymentStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="rejected">Recusado</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                      <SelectItem value="refunded">Reembolsado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Motivo da Atualização</label>
                  <Textarea 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Informe o motivo para esta alteração de status..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="mr-2"
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={isUpdating || selectedStatus === payment.status}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar Status'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 pt-4">
            {isLoadingPayments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : relatedPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma tentativa de pagamento encontrada para esta reserva.
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-medium">Histórico de Tentativas de Pagamento</h3>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedPayments.map((payment) => (
                      <TableRow 
                        key={payment.id} 
                        className={selectedPayment?.id === payment.id ? "bg-muted" : undefined}
                      >
                        <TableCell className="font-mono text-xs">{payment.id.slice(0, 8)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{getPaymentMethodText(payment.payment_method)}</TableCell>
                        <TableCell className="text-sm">{formatRelativeDate(payment.created_at)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleSelectPayment(payment.id)}
                          >
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Status logs section */}
                {selectedPayment && activeTab === 'history' && (
                  <div className="mt-8">
                    <h4 className="font-medium mb-3">Histórico de Status</h4>
                    
                    {isLoadingLogs ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : statusLogs.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Sem histórico de status para este pagamento</p>
                    ) : (
                      <div className="space-y-4">
                        {statusLogs.map((log) => (
                          <div key={log.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                <span className="font-medium">
                                  {getStatusBadge(log.previous_status)} → {getStatusBadge(log.new_status)}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatRelativeDate(log.created_at)}
                              </span>
                            </div>
                            {log.reason && (
                              <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                {log.reason}
                              </p>
                            )}
                            {log.created_by && (
                              <p className="mt-2 text-xs text-gray-500">
                                Alterado por: {log.created_by}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="raw" className="pt-4">
            <div className="space-y-4">
              <h3 className="font-medium">Dados do Pagamento</h3>
              <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(selectedPayment || payment, null, 2)}
                </pre>
              </div>

              {(selectedPayment?.raw_response || payment.raw_response) && (
                <div className="space-y-2">
                  <h3 className="font-medium">Resposta do MercadoPago</h3>
                  <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify((selectedPayment?.raw_response || payment.raw_response), null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
