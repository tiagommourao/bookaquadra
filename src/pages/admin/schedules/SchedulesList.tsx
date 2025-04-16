
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Court, Schedule } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { ScheduleModal } from '@/components/admin/schedules/ScheduleModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DAYS_OF_WEEK = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda' },
  { value: '2', label: 'Terça' },
  { value: '3', label: 'Quarta' },
  { value: '4', label: 'Quinta' },
  { value: '5', label: 'Sexta' },
  { value: '6', label: 'Sábado' }
];

const SchedulesList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('1'); // Default to Monday

  // Fetch courts
  const { data: courts, isLoading: courtsLoading } = useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Court[];
    }
  });

  // Set first court as default when courts are loaded
  React.useEffect(() => {
    if (courts && courts.length > 0 && !selectedCourt) {
      setSelectedCourt(courts[0].id);
    }
  }, [courts, selectedCourt]);

  // Fetch schedules for selected court and day
  const { data: schedules, isLoading: schedulesLoading, refetch: refetchSchedules } = useQuery({
    queryKey: ['schedules', selectedCourt, selectedDay],
    queryFn: async () => {
      if (!selectedCourt) return [];
      
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('court_id', selectedCourt)
        .eq('day_of_week', parseInt(selectedDay))
        .order('start_time');
      
      if (error) throw error;
      return data as Schedule[];
    },
    enabled: !!selectedCourt
  });

  const handleAddSchedule = () => {
    if (!selectedCourt) {
      toast({
        title: "Selecione uma quadra",
        description: "Você precisa selecionar uma quadra antes de adicionar horários",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedSchedule(null);
    setIsModalOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Horário excluído",
        description: "O horário foi excluído com sucesso",
      });
      
      refetchSchedules();
    } catch (error) {
      console.error('Erro ao excluir horário:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o horário",
        variant: "destructive"
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    refetchSchedules();
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const isLoading = courtsLoading || (selectedCourt && schedulesLoading);

  if (isLoading && !courts) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Carregando...</h1>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Horários</h1>
          <Button onClick={handleAddSchedule}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Horário
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtrar Horários</CardTitle>
            <CardDescription>Selecione a quadra e o dia da semana para visualizar os horários</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quadra</label>
                <Select
                  value={selectedCourt || ''}
                  onValueChange={(value) => setSelectedCourt(value)}
                  disabled={!courts || courts.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma quadra" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts && courts.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dia da Semana</label>
                <Select
                  value={selectedDay}
                  onValueChange={(value) => setSelectedDay(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Horários {courts && selectedCourt && courts.find(c => c.id === selectedCourt)?.name} - {
                DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label
              }
            </CardTitle>
            <CardDescription>Gerencie os horários disponíveis para reserva</CardDescription>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <div className="text-center py-4">Carregando horários...</div>
            ) : schedules && schedules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Início</th>
                      <th className="text-left py-2">Fim</th>
                      <th className="text-left py-2">Preço</th>
                      <th className="text-left py-2">Preço (Fim de Semana)</th>
                      <th className="text-left py-2">Duração Mínima</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-right py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((schedule) => (
                      <tr key={schedule.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{formatTime(schedule.start_time)}</td>
                        <td className="py-3">{formatTime(schedule.end_time)}</td>
                        <td className="py-3">R$ {schedule.price.toFixed(2)}</td>
                        <td className="py-3">
                          {schedule.price_weekend 
                            ? `R$ ${schedule.price_weekend.toFixed(2)}` 
                            : '-'}
                        </td>
                        <td className="py-3">{schedule.min_booking_time} min</td>
                        <td className="py-3">
                          <Badge variant={schedule.is_blocked ? "destructive" : "default"}>
                            {schedule.is_blocked ? 'Bloqueado' : 'Disponível'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSchedule(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                {selectedCourt ? (
                  <>
                    <p className="text-gray-500 mb-4">Nenhum horário cadastrado para esta quadra neste dia.</p>
                    <Button onClick={handleAddSchedule}>Adicionar Horário</Button>
                  </>
                ) : (
                  <p className="text-gray-500">Selecione uma quadra para visualizar os horários.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {isModalOpen && (
        <ScheduleModal
          schedule={selectedSchedule}
          courtId={selectedCourt || ''}
          dayOfWeek={parseInt(selectedDay)}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </AdminLayout>
  );
};

export default SchedulesList;
