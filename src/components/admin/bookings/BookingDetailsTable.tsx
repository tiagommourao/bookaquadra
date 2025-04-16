
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isWeekend } from 'date-fns';
import { Booking, BookingStatus, PaymentStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';

interface BookingDetailsTableProps {
  selectedDayDetails: Date | null;
  selectedDayBookings: (Booking & any)[];
  handleEditBooking: (booking: Booking) => void;
}

export const BookingDetailsTable = ({
  selectedDayDetails,
  selectedDayBookings,
  handleEditBooking
}: BookingDetailsTableProps) => {
  
  const getStatusBadgeVariant = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'completed': return 'outline';
      default: return 'default';
    }
  };

  const getPaymentStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'default';
    }
  };

  const translateStatus = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Concluída';
      default: return status;
    }
  };

  const translatePaymentStatus = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhou';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };
  
  if (!selectedDayDetails) return null;

  return (
    <div className="mt-6 border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Reservas para {format(selectedDayDetails, 'dd/MM/yyyy', { locale: ptBR })}
        </h3>
        <Badge variant={isWeekend(selectedDayDetails) ? 'secondary' : 'outline'}>
          {format(selectedDayDetails, 'EEEE', { locale: ptBR })}
        </Badge>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Horário</TableHead>
            <TableHead>Quadra</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedDayBookings.length > 0 ? (
            selectedDayBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  {`${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)}`}
                </TableCell>
                <TableCell>{booking.court?.name}</TableCell>
                <TableCell>
                  {booking.profiles?.first_name 
                    ? `${booking.profiles.first_name} ${booking.profiles.last_name || ''}`
                    : 'Cliente não identificado'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(booking.status)}>
                    {translateStatus(booking.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPaymentStatusBadgeVariant(booking.payment_status)}>
                    {translatePaymentStatus(booking.payment_status)}
                  </Badge>
                </TableCell>
                <TableCell>R$ {booking.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditBooking(booking)}
                    title="Editar reserva"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                Nenhuma reserva encontrada para este dia
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
