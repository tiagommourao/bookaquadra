import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SportType } from '@/types';

export interface SportsSelectionStepProps {
  onNext: () => void;
  onBack: () => void;
}

const SportsSelectionStep = ({ onNext, onBack }: SportsSelectionStepProps) => {
  const [selectedSports, setSelectedSports] = React.useState<string[]>([]);
  const [sports, setSports] = React.useState<SportType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Carregar esportes da API
    const fetchSports = async () => {
      setIsLoading(true);
      try {
        // Aqui você faria uma chamada real para sua API
        // Por enquanto, vamos usar dados de exemplo
        const mockSports: SportType[] = [
          { id: '1', name: 'Tênis', icon: '🎾', created_at: '', updated_at: '' },
          { id: '2', name: 'Padel', icon: '🏓', created_at: '', updated_at: '' },
          { id: '3', name: 'Beach Tennis', icon: '🏖️', created_at: '', updated_at: '' },
          { id: '4', name: 'Squash', icon: '🏸', created_at: '', updated_at: '' },
        ];
        setSports(mockSports);
      } catch (error) {
        console.error('Erro ao carregar esportes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSports();
  }, []);

  const toggleSport = (sportId: string) => {
    setSelectedSports(prev => {
      if (prev.includes(sportId)) {
        return prev.filter(id => id !== sportId);
      } else {
        return [...prev, sportId];
      }
    });
  };

  const handleNext = () => {
    // Aqui você salvaria os esportes selecionados
    console.log('Esportes selecionados:', selectedSports);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Quais esportes você pratica?</h2>
        <p className="text-muted-foreground">
          Selecione os esportes que você tem interesse em jogar
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {sports.map((sport) => (
            <Card
              key={sport.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedSports.includes(sport.id)
                  ? 'border-primary bg-primary/10'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => toggleSport(sport.id)}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="text-3xl">{sport.icon}</div>
                <div className="font-medium">{sport.name}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={selectedSports.length === 0}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default SportsSelectionStep;
