
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, ChevronDown } from 'lucide-react';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduleFormDrawer } from './ScheduleFormDrawer';
import { Badge } from '@/components/ui/badge';

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

interface ScheduleWithCourt extends Schedule {
  court: Court;
}

const SchedulesPage = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [schedules, setSchedules] = useState<ScheduleWithCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourtId, setSelectedCourtId] = useState<string | 'all'>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | number>(0); // Default to Sunday
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch courts
      const { data: courtsData, error: courtsError } = await supabase
        .from('courts')
        .select('id, name, type')
        .order('name');

      if (courtsError) throw courtsError;
      setCourts(courtsData || []);

      // Fetch schedules with court details
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select(`
          id,
          court_id,
          day_of_week,
          start_time,
          end_time,
          price,
          is_blocked,
          courts:court_id (
            id, 
            name,
            type
          )
        `)
        .order('day_of_week')
        .order('start_time');

      if (schedulesError) throw schedulesError;

      // Transform the data to match our interface
      const formattedSchedules = (schedulesData || []).map((item) => ({
        id: item.id,
        court_id: item.court_id,
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        price: item.price,
        is_blocked: item.is_blocked,
        court: item.courts as Court,
      }));

      setSchedules(formattedSchedules);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os horários e quadras.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSchedule = () => {
    setSelectedSchedule(null);
    setIsDrawerOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDrawerOpen(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);

      if (error) {
        throw error;
      }

      setSchedules(schedules.filter(schedule => schedule.id !== id));
      toast({
        title: 'Horário excluído',
        description: 'O horário foi removido com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Erro ao excluir horário',
        description: 'Não foi possível excluir o horário. Verifique se não há reservas associadas.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = () => {
    setIsDrawerOpen(false);
    fetchData();
  };

  const handleToggleBlockSchedule = async (schedule: Schedule) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ is_blocked: !schedule.is_blocked })
        .eq('id', schedule.id);

      if (error) throw error;

      // Update local state
      setSchedules(
        schedules.map(s => 
          s.id === schedule.id 
            ? { ...s, is_blocked: !s.is_blocked } 
            : s
        )
      );
      
      toast({
        title: schedule.is_blocked ? 'Horário desbloqueado' : 'Horário bloqueado',
        description: schedule.is_blocked 
          ? 'O horário agora está disponível para reservas.' 
          : 'O horário não estará disponível para reservas.',
      });
    } catch (error) {
      console.error('Error toggling schedule block status:', error);
      toast({
        title: 'Erro ao atualizar horário',
        description: 'Não foi possível alterar o status do horário.',
        variant: 'destructive',
      });
    }
  };

  const filterSchedules = () => {
    return schedules.filter(schedule => {
      // Filter by court if a specific court is selected
      if (selectedCourtId !== 'all' && schedule.court_id !== selectedCourtId) {
        return false;
      }
      
      // Filter by day
      if (selectedDay !== 'all' && schedule.day_of_week !== Number(selectedDay)) {
        return false;
      }
      
      return true;
    });
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

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const filteredSchedules = filterSchedules();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Horários</h1>
            <p className="text-muted-foreground">
              Gerencie os horários disponíveis para cada quadra
            </p>
          </div>
          <Button onClick={handleCreateSchedule}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Horário
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Card className="md:w-1/3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Filtrar por Quadra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Button 
                    variant={selectedCourtId === 'all' ? "default" : "outline"} 
                    size="sm" 
                    className="mr-2" 
                    onClick={() => setSelectedCourtId('all')}
                  >
                    Todas
                  </Button>
                  {courts.map(court => (
                    <Button 
                      key={court.id}
                      variant={selectedCourtId === court.id ? "default" : "outline"}
                      size="sm"
                      className="mr-2 text-xs"
                      onClick={() => setSelectedCourtId(court.id)}
                    >
                      {court.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="0" value={selectedDay.toString()} onValueChange={setSelectedDay}>
          <TabsList className="mb-4 flex space-x-1 overflow-x-auto">
            <TabsTrigger value="all">Todos os dias</TabsTrigger>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <TabsTrigger key={day} value={day.toString()}>
                {getDayOfWeekName(day)}
              </TabsTrigger>
            ))}
          </TabsList>

          {['all', '0', '1', '2', '3', '4', '5', '6'].map((dayValue) => (
            <TabsContent key={dayValue} value={dayValue} className="space-y-4">
              {loading ? (
                <div className="text-center py-10">Carregando horários...</div>
              ) : filteredSchedules.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground mb-4">Nenhum horário cadastrado</p>
                  <Button onClick={handleCreateSchedule}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Horário
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayValue === 'all' ? (
                    // Group by day when "All days" is selected
                    [0, 1, 2, 3, 4, 5, 6].map(day => {
                      const daySchedules = filteredSchedules.filter(s => s.day_of_week === day);
                      if (daySchedules.length === 0) return null;
                      
                      return (
                        <Card key={day}>
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {getDayOfWeekName(day)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {daySchedules.map(schedule => (
                                <ScheduleCard 
                                  key={schedule.id} 
                                  schedule={schedule} 
                                  onEdit={handleEditSchedule}
                                  onDelete={handleDeleteSchedule}
                                  onToggleBlock={handleToggleBlockSchedule}
                                />
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    // Show all schedules without day grouping when a specific day is selected
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSchedules.map(schedule => (
                        <ScheduleCard 
                          key={schedule.id} 
                          schedule={schedule} 
                          onEdit={handleEditSchedule}
                          onDelete={handleDeleteSchedule}
                          onToggleBlock={handleToggleBlockSchedule}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <ScheduleFormDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        courts={courts}
        schedule={selectedSchedule}
        onSubmitSuccess={handleFormSubmit}
      />
    </AdminLayout>
  );
};

interface ScheduleCardProps {
  schedule: ScheduleWithCourt;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onToggleBlock: (schedule: Schedule) => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  onEdit,
  onDelete,
  onToggleBlock,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Card className={schedule.is_blocked ? 'bg-muted/30' : ''}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium">{schedule.court.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>
                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            
            {isMenuOpen && (
              <div 
                className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white z-10 ring-1 ring-black ring-opacity-5"
                onBlur={() => setIsMenuOpen(false)}
              >
                <div className="py-1" role="menu">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      onEdit(schedule);
                      setIsMenuOpen(false);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      onToggleBlock(schedule);
                      setIsMenuOpen(false);
                    }}
                  >
                    {schedule.is_blocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      onDelete(schedule.id);
                      setIsMenuOpen(false);
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">
            {formatPrice(schedule.price)}
          </div>
          {schedule.is_blocked && (
            <Badge variant="outline" className="text-red-500 border-red-200">
              Bloqueado
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SchedulesPage;
