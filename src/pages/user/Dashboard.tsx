
import React from 'react';
import { Calendar, Clock, ArrowRight, Trophy, Users, Medal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserLayout } from '@/components/layouts/UserLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useNavigate } from 'react-router-dom';
import { AvatarFrame } from '@/components/gamification/AvatarFrame';
import { Badge } from '@/components/gamification/Badge';

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

// Mock data for achievements
const recentAchievements = [
  { id: '1', name: 'Fair Play', icon: <Medal className="h-4 w-4" /> },
  { id: '2', name: '10 Jogos', icon: <Trophy className="h-4 w-4" /> }
];

const Dashboard = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  
  // Mock gamification data
  const userLevel = 'silver';
  const frameType = 'silver';

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
      {/* Hero/Welcome Section with Gamification */}
      <section className="bg-primary text-primary-foreground p-6">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <AvatarFrame
            src={user?.avatarUrl}
            fallback={user?.name?.charAt(0) || 'U'}
            frameType={frameType as any}
            size="md"
          />
          <div>
            <h1 className="text-2xl font-bold">
              Olá, {user?.name?.split(' ')[0] || 'Esportista'}!
            </h1>
            <p className="mt-2 opacity-90">
              Bem-vindo ao {settings.companyName}. O que você gostaria de fazer hoje?
            </p>
          </div>
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

      {/* Recent Achievements - New Section */}
      {recentAchievements.length > 0 && (
        <section className="py-2 px-4">
          <div className="max-w-lg mx-auto">
            <Card className="bg-primary/5 border border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">Conquistas Recentes</span>
                  </div>
                  <Button 
                    variant="link" 
                    className="text-primary p-0 h-auto text-sm"
                    onClick={() => navigate('/conta')}
                  >
                    Ver todas
                  </Button>
                </div>
                <div className="flex gap-3 mt-2">
                  {recentAchievements.map(achievement => (
                    <Badge
                      key={achievement.id}
                      name={achievement.name}
                      icon={achievement.icon}
                      description={`Nova conquista!`}
                      size="sm"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

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

      {/* Community Highlight - New Section */}
      <section className="py-4 px-4 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Comunidade</h2>
            <Button 
              variant="link" 
              onClick={() => navigate('/social')}
              className="flex items-center text-primary"
            >
              Ver tudo <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Comunidade de Esportistas
              </CardTitle>
              <CardDescription>
                Conecte-se com outros jogadores
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between gap-4">
              <Button 
                variant="outline" 
                className="flex-1 h-auto py-3 flex flex-col items-center"
                onClick={() => navigate('/social')}
              >
                <Users className="mb-1 h-5 w-5" />
                <span className="text-sm">Encontrar Jogadores</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-auto py-3 flex flex-col items-center"
                onClick={() => navigate('/social?tab=rankings')}
              >
                <Trophy className="mb-1 h-5 w-5" />
                <span className="text-sm">Ver Rankings</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </UserLayout>
  );
};

export default Dashboard;
