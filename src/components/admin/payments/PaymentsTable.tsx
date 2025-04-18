import React from 'react';
import { Payment } from '@/types/payment';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentsTableProps {
  payments: Payment[];
  onPaymentClick: (payment: Payment) => void;
}

export const PaymentsTable: React.FC<PaymentsTableProps> = ({ 
  payments, 
  onPaymentClick
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
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

  return (
    <div className="bg-white rounded-md shadow-sm border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Reserva</TableHead>
              <TableHead>ID MercadoPago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhum pagamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow 
                  key={payment.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onPaymentClick(payment)}
                >
                  <TableCell>{formatDate(payment.created_at)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{getPaymentMethodText(payment.payment_method)}</TableCell>
                  <TableCell>
                    {payment.first_name && payment.last_name ? (
                      <span className="text-blue-600">
                        {payment.first_name} {payment.last_name}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.court_name && payment.booking_date ? (
                      <span className="text-gray-700">
                        {payment.court_name} - {formatDateShort(payment.booking_date)} {payment.start_time}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.mercadopago_payment_id ? (
                      <span className="text-gray-600">
                        {payment.mercadopago_payment_id.slice(0, 8)}...
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-4 py-2 border-t">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
