
import React, { useState } from 'react';
import { Payment, PaymentStatus, PaymentStatusLog } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useUpdatePaymentStatus } from '@/hooks/admin/usePaymentsData';
import { Loader2 } from 'lucide-react';

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
  onStatusUpdate,
}) => {
  const [newStatus, setNewStatus] = useState<PaymentStatus>(payment.status);
  const [updateReason, setUpdateReason] = useState('');
  const [statusLogs, setStatusLogs] = useState<PaymentStatusLog[]>([]);
  const [activeTab, setActiveTab] = useState('details');
  
  const {
    updateStatus,
    isLoading,
    isSuccess,
    fetchStatusLogs
  } = useUpdatePaymentStatus(payment.id);

  React.useEffect(() => {
    if (isOpen && payment) {
      fetchStatusLogs().then(logs => {
        setStatusLogs(logs);
      });
    }
  }, [isOpen, payment, fetchStatusLogs]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
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
        return 'Transferência';
      case 'cash':
        return 'Dinheiro';
      case 'other':
        return 'Outro';
      default:
        return 'Não informado';
    }
  };

  const handleStatusUpdate = async () => {
    if (!updateReason.trim() && newStatus !== payment.status) {
      toast.error('É necessário informar um motivo para a alteração de status.');
      return;
    }

    if (newStatus === payment.status) {
      toast.info('Status não foi alterado.');
      return;
    }

    try {
      await updateStatus(newStatus, updateReason);
      toast.success('Status do pagamento atualizado com sucesso!');
      onStatusUpdate();
    } catch (error) {
      toast.error('Erro ao atualizar o status do pagamento.');
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleExportDetails = () => {
    // Implementação futura para exportação dos detalhes do pagamento
    toast.info('Exportação de detalhes será implementada em breve!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Pagamento</DialogTitle>
          <DialogDescription>
            ID: {payment.id}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Dados Básicos</TabsTrigger>
            <TabsTrigger value="history">Histórico de Status</TabsTrigger>
            <TabsTrigger value="technical">Dados Técnicos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <div className="mt-1">{getStatusBadge(payment.status)}</div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Valor</h4>
                <p className="text-lg font-semibold">{formatCurrency(payment.amount)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Data de Criação</h4>
                <p>{formatDate(payment.created_at)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Data de Vencimento</h4>
                <p>
                  {payment.expiration_date ? 
                    formatDate(payment.expiration_date) : 
                    <span className="text-gray-400">Não definida</span>}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Método de Pagamento</h4>
                <p>{getPaymentMethodText(payment.payment_method)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Última Atualização</h4>
                <p>{formatDate(payment.updated_at)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Usuário</h4>
                <p>
                  {payment.user_id ? (
                    <span className="text-blue-600 hover:underline cursor-pointer">
                      {payment.user_id}
                    </span>
                  ) : (
                    <span className="text-gray-400">Não associado</span>
                  )}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Reserva</h4>
                <p>
                  {payment.booking_id ? (
                    <span className="text-blue-600 hover:underline cursor-pointer">
                      {payment.booking_id}
                    </span>
                  ) : (
                    <span className="text-gray-400">Não associada</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">Atualizar Status</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm mb-2">Novo Status:</p>
                  <Select value={newStatus} onValueChange={(value) => setNewStatus(value as PaymentStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o novo status" />
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
                <div>
                  <p className="text-sm mb-2">Motivo da Alteração:</p>
                  <Textarea 
                    placeholder="Informe o motivo da alteração de status"
                    value={updateReason}
                    onChange={(e) => setUpdateReason(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <div className="space-y-6">
              <h3 className="font-medium">Histórico de Alterações de Status</h3>
              
              {statusLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhum histórico de alteração de status encontrado.
                </p>
              ) : (
                <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
                  {statusLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[25px] h-6 w-6 rounded-full border-4 bg-white border-primary"></div>
                      <div className="mb-1 text-sm text-gray-500">
                        {formatDate(log.created_at)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>De:</span> {getStatusBadge(log.previous_status)} 
                        <span className="mx-2">→</span>
                        <span>Para:</span> {getStatusBadge(log.new_status)}
                      </div>
                      {log.reason && (
                        <div className="mt-1 text-sm bg-gray-50 p-2 rounded border">
                          <span className="font-medium">Motivo:</span> {log.reason}
                        </div>
                      )}
                      {log.created_by && (
                        <div className="mt-1 text-sm text-gray-500">
                          Alterado por: {log.created_by}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="technical" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">ID MercadoPago</h4>
                <p className="bg-gray-50 p-2 rounded border">
                  {payment.mercadopago_payment_id || 'Não associado ao MercadoPago'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Dados Brutos da Resposta (JSON)</h4>
                <div className="bg-gray-50 p-2 rounded border overflow-auto max-h-60">
                  <pre className="text-xs">
                    {payment.raw_response ? 
                      JSON.stringify(payment.raw_response, null, 2) : 
                      'Não há dados brutos disponíveis'}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Estes dados são úteis para suporte técnico e depuração.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">IDs do Sistema</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">ID do Pagamento:</p>
                    <p className="font-mono text-xs">{payment.id}</p>
                  </div>
                  {payment.booking_id && (
                    <div>
                      <p className="text-sm text-gray-500">ID da Reserva:</p>
                      <p className="font-mono text-xs">{payment.booking_id}</p>
                    </div>
                  )}
                  {payment.user_id && (
                    <div>
                      <p className="text-sm text-gray-500">ID do Usuário:</p>
                      <p className="font-mono text-xs">{payment.user_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleExportDetails}
            disabled={isLoading}
          >
            Exportar Detalhes
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Fechar
          </Button>
          {(activeTab === 'details' && newStatus !== payment.status) && (
            <Button 
              onClick={handleStatusUpdate}
              disabled={isLoading || !updateReason.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando
                </>
              ) : (
                'Atualizar Status'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
