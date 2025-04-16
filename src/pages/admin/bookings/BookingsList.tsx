
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, Filter, Eye, Edit, Ban } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Booking, BookingStatus, Court, PaymentStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { BookingModal } from '@/components/admin/bookings/BookingModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isToday, isFuture, isPast, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BookingsList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>('all');

  // Fetch courts
  const { data: courts } = useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Court[];
    }
  });

  // Fetch bookings
  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ['bookings', selectedDate, selectedCourt, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (first_name, last_name, phone),
          court:court_id (name)
        `)
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'));
      
      if (selectedCourt !== 'all') {
        query = query.eq('court_id', selectedCourt);
      }
      
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      
      query = query.order('start_time');
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as (Booking & {
        profiles: { first_name: string | null; last_name: string | null; phone: string | null };
        court: { name: string };
      })[];
    }
  });

  const handleCreateBooking = () => {
    setSelectedBooking(null);
    setIsModalOpen(true);
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleTabChange = (value: string) => {
    const now = new Date();
    if (value === 'today') {
      setSelectedDate(now);
    } else if (value === 'future') {
      // This doesn't change the date, but will filter in the UI
    } else if (value === 'past') {
      // This doesn't change the date, but will filter in the UI
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast({
        title: "Status atualizado",
        description: `Reserva marcada como ${newStatus}`,
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status da reserva",
        variant: "destructive"
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    refetch();
  };

  const getStatusBadgeVariant = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return 'default'; // green
      case 'pending':
        return 'secondary'; // yellow
      case 'cancelled':
        return 'destructive'; // red
      case 'completed':
        return 'outline'; // gray
      default:
        return 'default';
    }
  };

  const getPaymentStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'default'; // green
      case 'pending':
        return 'secondary'; // yellow
      case 'failed':
        return 'destructive'; // red
      case 'refunded':
        return 'outline'; // gray
      default:
        return 'default';
    }
  };

  const translateStatus = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Concluída';
      default:
        return status;
    }
  };

  const translatePaymentStatus = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Carregando reservas...</h1>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Erro ao carregar reservas</h1>
          </div>
          <p className="text-red-500">Erro: {(error as Error).message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Reservas</h1>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleCreateBooking}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reserva
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reservas Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings?.filter(b => 
                  isToday(new Date(b.booking_date)) && 
                  b.status !== 'cancelled'
                ).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reservas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings?.filter(b => b.status === 'pending').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings?.filter(b => b.payment_status === 'pending').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Faturamento do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {bookings?.filter(b => 
                  isToday(new Date(b.booking_date)) && 
                  b.status !== 'cancelled' && 
                  b.payment_status === 'paid'
                ).reduce((acc, curr) => acc + curr.amount, 0).toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Reservas</CardTitle>
            <CardDescription>
              Visualize, edite e gerencie as reservas de quadras
            </CardDescription>
          </CardHeader>

          <div className="px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Select
                value={selectedCourt}
                onValueChange={setSelectedCourt}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por quadra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as quadras</SelectItem>
                  {courts?.map((court) => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as BookingStatus | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="today" onValueChange={handleTabChange}>
            <div className="px-6">
              <TabsList className="mb-4">
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="future">Futuras</TabsTrigger>
                <TabsTrigger value="past">Passadas</TabsTrigger>
              </TabsList>
            </div>

            <CardContent>
              <TabsContent value="today" className="m-0">
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
                    {bookings && bookings.length > 0 ? (
                      bookings.filter(b => isToday(new Date(b.booking_date))).map((booking) => (
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
                              onClick={() => handleViewBooking(booking)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBooking(booking)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {booking.status !== 'cancelled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Nenhuma reserva encontrada para hoje
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="future" className="m-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Quadra</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings && bookings.length > 0 ? (
                      bookings
                        .filter(b => {
                          const bookingDate = new Date(b.booking_date);
                          return isFuture(bookingDate) || isToday(bookingDate);
                        })
                        .map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              {format(new Date(booking.booking_date), 'dd/MM/yyyy')}
                            </TableCell>
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
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewBooking(booking)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Nenhuma reserva futura encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="past" className="m-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Quadra</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings && bookings.length > 0 ? (
                      bookings
                        .filter(b => {
                          const bookingDate = new Date(b.booking_date);
                          return isPast(bookingDate) && !isToday(bookingDate);
                        })
                        .map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              {format(new Date(booking.booking_date), 'dd/MM/yyyy')}
                            </TableCell>
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
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewBooking(booking)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Nenhuma reserva passada encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </CardContent>
          </Tabs>
          <CardFooter className="flex justify-between border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Total: {bookings?.length || 0} reservas encontradas
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {isModalOpen && (
        <BookingModal
          booking={selectedBooking}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </AdminLayout>
  );
};

export default BookingsList;
