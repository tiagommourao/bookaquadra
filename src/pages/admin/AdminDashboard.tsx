
import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, DollarSign, Users, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Booking } from '@/types';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });
  
  // Get stats for bookings and revenue
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['dashboardBookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: false });
      
      if (error) throw error;
      return data as Booking[];
    }
  });

  // Calculate stats
  useEffect(() => {
    if (bookings) {
      // Calculate weekly revenue
      const weeklyBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate >= startOfCurrentWeek && bookingDate <= endOfCurrentWeek;
      });
      
      const weeklyTotal = weeklyBookings.reduce((sum, booking) => {
        return sum + Number(booking.amount);
      }, 0);
      
      setWeeklyRevenue(weeklyTotal);
    }
  }, [bookings]);

  // Filter today's bookings
  const todayBookings = bookings?.filter(booking => 
    booking.booking_date === format(today, 'yyyy-MM-dd')
  ) || [];
  
  // Filter bookings with pending status
  const pendingBookings = bookings?.filter(booking => 
    booking.status === 'pending'
  ) || [];
  
  // Filter bookings with pending payment
  const pendingPayments = bookings?.filter(booking => 
    booking.payment_status === 'pending'
  ) || [];
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  // Format date range for weekly revenue
  const weekRange = `${format(startOfCurrentWeek, 'dd/MM', { locale: ptBR })} - ${format(endOfCurrentWeek, 'dd/MM', { locale: ptBR })}`;

  // Calculate daily revenue
  const dailyRevenue = todayBookings.reduce((sum, booking) => {
    return sum + Number(booking.amount);
  }, 0);

  // Stats cards data
  const stats = [
    { 
      title: 'Reservas Hoje', 
      value: todayBookings.length.toString(), 
      description: 'Reservas para o dia atual', 
      trend: 'neutral',
      icon: <Calendar className="h-5 w-5 text-blue-500" /> 
    },
    { 
      title: 'Reservas Pendentes', 
      value: pendingBookings.length.toString(), 
      description: 'Aguardando confirmação', 
      trend: 'neutral',
      icon: <Users className="h-5 w-5 text-amber-500" /> 
    },
    { 
      title: `Faturamento Semanal (${weekRange})`, 
      value: formatCurrency(weeklyRevenue), 
      description: 'Total da semana atual', 
      trend: 'neutral',
      icon: <DollarSign className="h-5 w-5 text-green-500" /> 
    },
    { 
      title: 'Pagamentos Pendentes', 
      value: pendingPayments.length.toString(), 
      description: `${formatCurrency(pendingPayments.reduce((sum, b) => sum + Number(b.amount), 0))}`, 
      trend: 'neutral',
      icon: <BarChart className="h-5 w-5 text-purple-500" /> 
    }
  ];

  // Recent bookings (last 5)
  const recentBookings = bookings?.slice(0, 5) || [];
  
  // Format booking status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };
  
  // Format payment status display
  const getPaymentDisplay = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'refunded': return 'Reembolsado';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do sistema de reservas de quadras.
          </p>
        </div>
        
        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Recent bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Reservas Recentes</CardTitle>
                <CardDescription>
                  {bookingsLoading 
                    ? 'Carregando reservas...' 
                    : `Últimas ${recentBookings.length} reservas realizadas.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 font-medium">Data</th>
                        <th className="pb-3 font-medium">Horário</th>
                        <th className="pb-3 font-medium">Quadra</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Pagamento</th>
                        <th className="pb-3 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((booking) => (
                        <tr key={booking.id} className="border-b">
                          <td className="py-3">
                            {format(new Date(booking.booking_date), 'dd/MM/yyyy')}
                          </td>
                          <td className="py-3">
                            {booking.start_time} - {booking.end_time}
                          </td>
                          <td className="py-3">
                            {/* Court name would ideally come from a join */}
                            Quadra {booking.court_id.substring(0, 4)}
                          </td>
                          <td className="py-3">
                            <span 
                              className={`px-2 py-1 text-xs rounded-full ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : booking.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {getStatusDisplay(booking.status)}
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                booking.payment_status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.payment_status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : booking.payment_status === 'refunded'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {getPaymentDisplay(booking.payment_status)}
                            </span>
                          </td>
                          <td className="py-3">
                            <Link to="/admin/bookings" className="text-sm text-primary hover:underline">
                              Gerenciar
                            </Link>
                          </td>
                        </tr>
                      ))}
                      
                      {recentBookings.length === 0 && !bookingsLoading && (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-muted-foreground">
                            Nenhuma reserva encontrada
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter>
                <Link to="/admin/bookings" className="text-sm text-blue-500 hover:underline">
                  Ver todas as reservas
                </Link>
              </CardFooter>
            </Card>
            
            {/* Placeholder for a chart */}
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Ocupação por Período</CardTitle>
                <CardDescription>
                  Distribuição de reservas ao longo das últimas semanas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
                  <div className="text-gray-400">
                    Gráfico de ocupação (implementação pendente)
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Placeholder for other tabs */}
          <TabsContent value="reservas">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <p>Gerencie todas as reservas no sistema</p>
                  <Link to="/admin/bookings">
                    <Button variant="outline">Ir para Reservas</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pagamentos">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Resumo financeiro (implementação pendente)</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
