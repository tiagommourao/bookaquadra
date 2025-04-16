import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SportType } from '@/types';
import { TennisRacket, Waves, Dumbbell } from 'lucide-react';

interface SportsSelectionStepProps {
  selectedSports: string[];
  onSubmit: (selectedSports: string[]) => void;
  onBack: () => void;
}

const SportsSelectionStep: React.FC<SportsSelectionStepProps> = ({ 
  selectedSports,
  onSubmit,
  onBack
}) => {
  const [sports, setSports] = useState<SportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>(selectedSports);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const { data, error } = await supabase
          .from('sport_types')
          .select('*');
        
        if (error) throw error;
        
        setSports(data || []);
      } catch (error) {
        console.error('Error fetching sports:', error);
        toast.error('Erro ao carregar modalidades esportivas');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSports();
  }, []);

  const handleToggleSport = (sportId: string) => {
    setSelected(prev => {
      if (prev.includes(sportId)) {
        return prev.filter(id => id !== sportId);
      } else {
        return [...prev, sportId];
      }
    });
  };

  const handleSubmit = () => {
    if (selected.length === 0) {
      toast.error('Selecione pelo menos uma modalidade esportiva');
      return;
    }
    onSubmit(selected);
  };

  const getSportIcon = (sportName: string) => {
    const name = sportName.toLowerCase();
    if (name.includes('tênis') || name.includes('tennis') || name.includes('padel')) {
      return <TennisRacket className="h-8 w-8" />;
    } else if (name.includes('vôlei') || name.includes('volley') || name.includes('beach')) {
      return <Waves className="h-8 w-8" />;
    } else {
      return <Dumbbell className="h-8 w-8" />;
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Modalidades Esportivas</CardTitle>
        <CardDescription>
          Escolha as modalidades que você pratica
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {sports.map(sport => (
              <div
                key={sport.id}
                className={`border rounded-lg p-4 flex flex-col items-center transition-all cursor-pointer ${
                  selected.includes(sport.id)
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleToggleSport(sport.id)}
              >
                <div className={`p-3 rounded-full mb-2 ${
                  selected.includes(sport.id)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {getSportIcon(sport.name)}
                </div>
                <span className="font-medium">{sport.name}</span>
                <span className="text-xs text-gray-500 mt-1 text-center">{sport.description}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button onClick={handleSubmit}>Próximo</Button>
      </CardFooter>
    </>
  );
};

export default SportsSelectionStep;
