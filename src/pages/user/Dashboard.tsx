
import React from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserLayout } from '@/components/layouts/UserLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useNavigate } from 'react-router-dom';

// Mock data for available courts
const availableCourts = [
  { id: '1', name: 'Quadra Beach Tennis 01', type: 'beach-tennis', nextAvailable: '14:00 hoje' },
  { id: '2', name: 'Quadra Padel 01', type: 'padel', nextAvailable: '15:30 hoje' },
  { id: '3', name: 'Quadra Tênis 01', type: 'tennis', nextAvailable: '16:00 hoje' },
];

// Mock data for upcoming bookings
const upcomingBookings = [
  { 
    id: '1', 
    court: 'Quadra Beach Tennis 01', 
    date: new Date(2023, 5, 15, 14, 0), 
    status: 'confirmed',
    paymentStatus: 'paid'
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <UserLayout>
      {/* Hero/Welcome Section */}
      <section className="bg-primary text-primary-foreground p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">
            Olá, {user?.name?.split(' ')[0] || 'Esportista'}!
          </h1>
          <p className="mt-2 opacity-90">
            Bem-vindo ao {settings.companyName}. O que você gostaria de fazer hoje?
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-6 px-4">
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-4">
          <Button 
            onClick={() => navigate('/reservar')}
            className="h-auto py-4 flex flex-col items-center"
            size="lg"
          >
            <Calendar className="mb-2 h-6 w-6" />
            <span>Reservar Quadra</span>
          </Button>
          <Button 
            onClick={() => navigate('/minhas-reservas')}
            className="h-auto py-4 flex flex-col items-center"
            variant="outline"
            size="lg"
          >
            <Clock className="mb-2 h-6 w-6" />
            <span>Minhas Reservas</span>
          </Button>
        </div>
      </section>

      {/* Available Courts */}
      <section className="py-4 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Quadras Disponíveis</h2>
            <Button 
              variant="link" 
              onClick={() => navigate('/reservar')}
              className="flex items-center text-primary"
            >
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {availableCourts.map(court => (
              <Card key={court.id} className="overflow-hidden">
                <CardContent className="p-0 flex">
                  <div 
                    className={`w-3 self-stretch ${
                      court.type === 'beach-tennis' 
                        ? 'bg-amber-500' 
                        : court.type === 'padel' 
                          ? 'bg-blue-500' 
                          : 'bg-green-500'
                    }`} 
                  />
                  <div className="p-4 flex-1">
                    <h3 className="font-medium">{court.name}</h3>
                    <p className="text-sm text-gray-500">Próximo horário: {court.nextAvailable}</p>
                  </div>
                  <div className="flex items-center pr-4">
                    <Button 
                      onClick={() => navigate(`/reservar?court=${court.id}`)}
                      size="sm"
                      variant="ghost"
                    >
                      Reservar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Bookings */}
      <section className="py-4 px-4 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Próximas Reservas</h2>
            <Button 
              variant="link" 
              onClick={() => navigate('/minhas-reservas')}
              className="flex items-center text-primary"
            >
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          {upcomingBookings.length > 0 ? (
            <div className="space-y-3">
              {upcomingBookings.map(booking => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{booking.court}</h3>
                        <p className="text-sm text-gray-500">{formatDate(booking.date)}</p>
                      </div>
                      <div className="flex items-center">
                        {booking.paymentStatus === 'paid' ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Pago
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500 mb-4">Você não tem reservas agendadas</p>
                <Button onClick={() => navigate('/reservar')}>
                  Fazer uma Reserva
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </UserLayout>
  );
};

export default Dashboard;
