import React from 'react';
import { Calendar, Clock, ArrowRight, Trophy, Users, Medal, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserLayout } from '@/components/layouts/UserLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useNavigate } from 'react-router-dom';
import { AvatarFrame } from '@/components/gamification/AvatarFrame';
import { Badge } from '@/components/gamification/Badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EventDetailsModal } from './components/EventDetailsModal';
import { useState } from 'react';

const availableCourts = [
  { id: '1', name: 'Quadra Beach Tennis 01', type: 'beach-tennis', nextAvailable: '14:00 hoje' },
  { id: '2', name: 'Quadra Padel 01', type: 'padel', nextAvailable: '15:30 hoje' },
  { id: '3', name: 'Quadra Tênis 01', type: 'tennis', nextAvailable: '16:00 hoje' },
];

const upcomingBookings = [
  { 
    id: '1', 
    court: 'Quadra Beach Tennis 01', 
    date: new Date(2023, 5, 15, 14, 0), 
    status: 'confirmed',
    paymentStatus: 'paid'
  },
];

const recentAchievements = [
  { id: '1', name: 'Fair Play', icon: <Medal className="h-4 w-4" /> },
  { id: '2', name: '10 Jogos', icon: <Trophy className="h-4 w-4" /> }
];

const useActiveEvents = () => {
  return useQuery({
    queryKey: ['active-events'],
    queryFn: async () => {
      const today = new Date();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .gte('end_datetime', today.toISOString())
        .order('start_datetime', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });
};

const Dashboard = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const userLevel = 'silver';
  const frameType = 'silver';

  const { data: events, isLoading: eventsLoading } = useActiveEvents();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  const formatEventDate = (start: string, end: string) => {
    try {
      const startAt = new Date(start);
      const endAt = new Date(end);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      };
      return `De ${startAt.toLocaleDateString('pt-BR', options)} às ${startAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} até ${endAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  };

  const [modalEvent, setModalEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  return (
    <UserLayout>
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

      <section className="py-2 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="border-primary/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-5 w-5 text-primary" />
                Eventos & Torneios
              </CardTitle>
              <CardDescription>
                Confira os próximos eventos e torneios abertos no clube!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="text-center text-sm text-muted-foreground py-6">Carregando eventos...</div>
              ) : events && events.length === 0 ? (
                <div className="text-center text-gray-400 py-6">Nenhum evento ou torneio cadastrado.</div>
              ) : (
                <div className="grid gap-3">
                  {events?.slice(0, 3).map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center rounded border border-primary/20 bg-white hover:bg-primary/5 transition p-2 gap-3"
                    >
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.name}
                          className="h-14 w-14 rounded object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="h-14 w-14 flex items-center justify-center rounded bg-gradient-to-tr from-blue-400 via-blue-600 to-blue-300">
                          <Activity className="h-7 w-7 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{event.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatEventDate(event.start_datetime, event.end_datetime)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          onClick={() => {
                            setModalEvent(event);
                            setShowEventModal(true);
                          }}
                          size="sm"
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          Detalhes
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="whitespace-nowrap"
                          onClick={() => {
                            window.location.href = `/eventos/${event.id}?action=reservar`;
                          }}
                        >
                          Reservar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

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

      <EventDetailsModal
        open={showEventModal}
        event={modalEvent}
        onOpenChange={setShowEventModal}
        onClickReserve={() => {
          setShowEventModal(false);
          if (modalEvent?.id) window.location.href = `/eventos/${modalEvent.id}?action=reservar`;
        }}
      />
    </UserLayout>
  );
};

export default Dashboard;
