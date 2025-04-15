
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookingFormDrawer } from './BookingFormDrawer';
import { format, parse, isValid, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Court {
  id: string;
  name: string;
  type: string;
}

interface Schedule {
  id: string;
  court_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  price: number;
  is_blocked: boolean;
}

interface User {
  id: string;
  email: string;
}

interface Booking {
  id: string;
  court_id: string;
  schedule_id: string;
  user_id: string;
  booking_date: string;
  status: string;
  amount: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  courts: Court;
  schedules: Schedule;
  users: User;
}

const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const { toast } = useToast();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // For a real implementation with users, you'd need to join with a profiles table
      // For now, we'll get bookings and add simulated user data
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          courts:court_id (*),
          schedules:schedule_id (*)
        `)
        .order('booking_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Add simulated user data
      const bookingsWithUsers = data?.map(booking => ({
        ...booking,
        users: {
          id: booking.user_id,
          email: `user-${booking.user_id.substring(0, 5)}@exemplo.com`
        }
      })) || [];

      setBookings(bookingsWithUsers);
      setFilteredBookings(bookingsWithUsers);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Erro ao carregar reservas',
        description: 'Não foi possível carregar as reservas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [selectedStatus, searchQuery, dateFilter, bookings]);

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === selectedStatus);
    }

    // Filter by search query (court name, user email)
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.courts?.name?.toLowerCase().includes(lowerCaseQuery) || 
        booking.users?.email?.toLowerCase().includes(lowerCaseQuery)
      );
    }

    // Filter by date
    if (dateFilter) {
      try {
        const targetDate = parse(dateFilter, 'yyyy-MM-dd', new Date());
        if (isValid(targetDate)) {
          filtered = filtered.filter(booking => {
            const bookingDate = parse(booking.booking_date, 'yyyy-MM-dd', new Date());
            return (
              bookingDate.getDate() === targetDate.getDate() &&
              bookingDate.getMonth() === targetDate.getMonth() &&
              bookingDate.getFullYear() === targetDate.getFullYear()
            );
          });
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }

    setFilteredBookings(filtered);
  };

  const handleCreateBooking = () => {
    setSelectedBooking(null);
    setIsDrawerOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDrawerOpen(true);
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setBookings(bookings.map(booking => 
        booking.id === id ? { ...booking, status } : booking
      ));

      toast({
        title: 'Status atualizado',
        description: `A reserva foi ${status === 'confirmed' ? 'confirmada' : status === 'cancelled' ? 'cancelada' : 'marcada como concluída'}.`,
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status da reserva.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePaymentStatus = async (id: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: paymentStatus })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setBookings(bookings.map(booking => 
        booking.id === id ? { ...booking, payment_status: paymentStatus } : booking
      ));

      toast({
        title: 'Pagamento atualizado',
        description: `O pagamento foi marcado como ${paymentStatus === 'paid' ? 'pago' : paymentStatus === 'refunded' ? 'reembolsado' : 'pendente'}.`,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Erro ao atualizar pagamento',
        description: 'Não foi possível atualizar o status do pagamento.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parse(dateString, 'yyyy-MM-dd', new Date());
      if (!isValid(date)) return dateString;
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      if (!isValid(date)) return dateTimeString;
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateTimeString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelado</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Concluído</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Falhou</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-500">Reembolsado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDayOfWeekName = (day: number) => {
    const days = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    return days[day];
  };

  const isPastBooking = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const bookingDate = parse(dateString, 'yyyy-MM-dd', new Date());
    
    return isBefore(bookingDate, today);
  };

  const handleFormSubmit = () => {
    setIsDrawerOpen(false);
    fetchBookings();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reservas</h1>
            <p className="text-muted-foreground">
              Gerencie as reservas de quadras
            </p>
          </div>
          <Button onClick={handleCreateBooking}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Reserva
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Buscar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Filtrar por Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Filtrar por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  className="w-full h-10 rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <div className="bg-white rounded-md shadow">
              {loading ? (
                <div className="text-center py-10">Carregando reservas...</div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground mb-4">Nenhuma reserva encontrada</p>
                  <Button onClick={handleCreateBooking}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Nova Reserva
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Quadra</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Horário</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Valor</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Pagamento</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(booking => (
                        <tr key={booking.id} className="border-b">
                          <td className="px-4 py-3 text-sm">
                            {formatDate(booking.booking_date)}
                          </td>
                          <td className="px-4 py-3 text-sm">{booking.courts?.name}</td>
                          <td className="px-4 py-3 text-sm">
                            {formatTime(booking.schedules?.start_time)} - {formatTime(booking.schedules?.end_time)}
                          </td>
                          <td className="px-4 py-3 text-sm">{booking.users?.email}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(booking.amount)}</td>
                          <td className="px-4 py-3 text-sm">{getStatusBadge(booking.status)}</td>
                          <td className="px-4 py-3 text-sm">{getPaymentStatusBadge(booking.payment_status)}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditBooking(booking)}
                              >
                                Editar
                              </Button>
                              <div className="relative group">
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  Status
                                </Button>
                                <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white z-10 ring-1 ring-black ring-opacity-5 hidden group-hover:block">
                                  <div className="py-1" role="menu">
                                    {booking.status !== 'confirmed' && (
                                      <button
                                        className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                                        onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                      >
                                        Confirmar
                                      </button>
                                    )}
                                    {booking.status !== 'cancelled' && (
                                      <button
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                      >
                                        Cancelar
                                      </button>
                                    )}
                                    {booking.status !== 'completed' && !isPastBooking(booking.booking_date) && (
                                      <button
                                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                                        onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                                      >
                                        Concluir
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="relative group">
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  Pagamento
                                </Button>
                                <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white z-10 ring-1 ring-black ring-opacity-5 hidden group-hover:block">
                                  <div className="py-1" role="menu">
                                    {booking.payment_status !== 'paid' && (
                                      <button
                                        className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                                        onClick={() => handleUpdatePaymentStatus(booking.id, 'paid')}
                                      >
                                        Marcar como Pago
                                      </button>
                                    )}
                                    {booking.payment_status !== 'pending' && (
                                      <button
                                        className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100"
                                        onClick={() => handleUpdatePaymentStatus(booking.id, 'pending')}
                                      >
                                        Marcar como Pendente
                                      </button>
                                    )}
                                    {booking.payment_status !== 'refunded' && (
                                      <button
                                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                                        onClick={() => handleUpdatePaymentStatus(booking.id, 'refunded')}
                                      >
                                        Marcar como Reembolsado
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="calendar">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-10 text-muted-foreground">
                  Visualização de calendário será implementada em breve
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BookingFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        booking={selectedBooking}
        onSubmitSuccess={handleFormSubmit}
      />
    </AdminLayout>
  );
};

export default BookingsPage;
