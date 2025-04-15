
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Court {
  id: string;
  name: string;
  type: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface Schedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  price: number;
  is_blocked: boolean;
}

interface CourtDetailsDialogProps {
  court: Court;
  isOpen: boolean;
  onClose: () => void;
}

export const CourtDetailsDialog: React.FC<CourtDetailsDialogProps> = ({
  court,
  isOpen,
  onClose,
}) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (isOpen && court) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('court_id', court.id)
            .order('day_of_week')
            .order('start_time');
          
          if (error) {
            throw error;
          }
          
          setSchedules(data || []);
        } catch (error) {
          console.error('Error fetching schedules:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSchedules();
  }, [isOpen, court]);

  const getCourtTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'beach-tennis': 'Beach Tennis',
      'padel': 'Padel',
      'tennis': 'Tênis',
      'volleyball': 'Vôlei',
      'other': 'Outro'
    };
    
    return typeMap[type] || type;
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
    // Format time from 'HH:MM:SS' to 'HH:MM'
    return timeStr.substring(0, 5);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{court.name}</DialogTitle>
          <DialogDescription>
            {getCourtTypeLabel(court.type)}
            <Badge
              variant={court.is_active ? "default" : "outline"}
              className="ml-2"
            >
              {court.is_active ? "Ativa" : "Inativa"}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {court.image_url && (
            <div className="w-full h-48 overflow-hidden rounded-md">
              <img
                src={court.image_url}
                alt={court.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {court.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Descrição</h4>
              <p className="text-sm text-muted-foreground">{court.description}</p>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium mb-2">Horários Disponíveis</h4>
            {loading ? (
              <div className="text-sm text-muted-foreground">Carregando horários...</div>
            ) : schedules.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum horário cadastrado para esta quadra</div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                {[...new Set(schedules.map(s => s.day_of_week))].sort().map(day => (
                  <Card key={day}>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm">
                        <Calendar className="h-4 w-4 inline-block mr-1" />
                        {getDayOfWeekName(day)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <div className="space-y-1">
                        {schedules
                          .filter(s => s.day_of_week === day)
                          .map(schedule => (
                            <div 
                              key={schedule.id}
                              className="flex justify-between items-center text-xs"
                            >
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span>
                                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                </span>
                              </div>
                              <div className="font-medium">
                                {formatPrice(schedule.price)}
                                {schedule.is_blocked && (
                                  <Badge variant="destructive" className="ml-2">
                                    Bloqueado
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
