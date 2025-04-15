
import React from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, DollarSign, Users, Calendar } from 'lucide-react';

// Mock data for statistics
const stats = [
  { 
    title: 'Reservas Hoje', 
    value: '12', 
    description: '+2.1% em relação a ontem', 
    trend: 'up',
    icon: <Calendar className="h-5 w-5 text-blue-500" /> 
  },
  { 
    title: 'Usuários Ativos', 
    value: '342', 
    description: '+5.4% em relação ao mês passado', 
    trend: 'up',
    icon: <Users className="h-5 w-5 text-green-500" /> 
  },
  { 
    title: 'Faturamento Mensal', 
    value: 'R$ 7.430', 
    description: '+12% em relação ao mês passado', 
    trend: 'up',
    icon: <DollarSign className="h-5 w-5 text-amber-500" /> 
  },
  { 
    title: 'Taxa de Ocupação', 
    value: '68%', 
    description: '+3% em relação à semana passada', 
    trend: 'up',
    icon: <BarChart className="h-5 w-5 text-purple-500" /> 
  }
];

// Mock data for recent bookings
const recentBookings = [
  { id: '1', user: 'Carlos Silva', court: 'Beach Tennis 01', time: '09:00 - 10:00', status: 'confirmed', paymentStatus: 'paid' },
  { id: '2', user: 'Ana Oliveira', court: 'Padel 02', time: '10:00 - 11:30', status: 'confirmed', paymentStatus: 'pending' },
  { id: '3', user: 'Bruno Costa', court: 'Tênis 01', time: '14:00 - 15:00', status: 'confirmed', paymentStatus: 'paid' },
  { id: '4', user: 'Juliana Santos', court: 'Beach Tennis 02', time: '16:00 - 17:00', status: 'confirmed', paymentStatus: 'paid' },
  { id: '5', user: 'Marcos Pereira', court: 'Vôlei', time: '18:00 - 19:00', status: 'pending', paymentStatus: 'pending' },
];

const AdminDashboard = () => {
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
                <p className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
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
                  Foram feitas 12 reservas nas últimas 24 horas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 font-medium">Cliente</th>
                        <th className="pb-3 font-medium">Quadra</th>
                        <th className="pb-3 font-medium">Horário</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((booking) => (
                        <tr key={booking.id} className="border-b">
                          <td className="py-3">{booking.user}</td>
                          <td className="py-3">{booking.court}</td>
                          <td className="py-3">{booking.time}</td>
                          <td className="py-3">
                            <span 
                              className={`px-2 py-1 text-xs rounded-full ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {booking.status === 'confirmed' ? 'Confirmado' : booking.status === 'pending' ? 'Pendente' : 'Cancelado'}
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                booking.paymentStatus === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {booking.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter>
                <button className="text-sm text-blue-500 hover:underline">
                  Ver todas as reservas
                </button>
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
                <p>Conteúdo detalhado de reservas (implementação pendente)</p>
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
