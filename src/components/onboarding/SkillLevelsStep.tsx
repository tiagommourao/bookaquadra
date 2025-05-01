import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SportType, SkillLevel } from '@/types';

export interface SkillLevelsStepProps {
  onNext: () => void;
  onBack: () => void;
}

const SkillLevelsStep = ({ onNext, onBack }: SkillLevelsStepProps) => {
  const [selectedSports, setSelectedSports] = React.useState<SportType[]>([]);
  const [skillLevels, setSkillLevels] = React.useState<Record<string, string>>({});
  
  // Fetch selected sports from previous step
  React.useEffect(() => {
    // This would typically come from context or state management
    // For now, we'll use mock data
    setSelectedSports([
      { id: '1', name: 'Tênis', icon: '🎾' },
      { id: '2', name: 'Padel', icon: '🏓' }
    ]);
  }, []);

  // Mock skill levels for each sport
  const getSkillLevelsForSport = (sportId: string): SkillLevel[] => {
    const skillLevelsMap: Record<string, SkillLevel[]> = {
      '1': [
        { id: '1', sport_type_id: '1', name: 'Iniciante', description: 'Pouca ou nenhuma experiência', rank_order: 1, created_at: '', updated_at: '' },
        { id: '2', sport_type_id: '1', name: 'Intermediário', description: 'Joga regularmente', rank_order: 2, created_at: '', updated_at: '' },
        { id: '3', sport_type_id: '1', name: 'Avançado', description: 'Joga competitivamente', rank_order: 3, created_at: '', updated_at: '' }
      ],
      '2': [
        { id: '4', sport_type_id: '2', name: 'Iniciante', description: 'Pouca ou nenhuma experiência', rank_order: 1, created_at: '', updated_at: '' },
        { id: '5', sport_type_id: '2', name: 'Intermediário', description: 'Joga regularmente', rank_order: 2, created_at: '', updated_at: '' },
        { id: '6', sport_type_id: '2', name: 'Avançado', description: 'Joga competitivamente', rank_order: 3, created_at: '', updated_at: '' }
      ]
    };
    
    return skillLevelsMap[sportId] || [];
  };

  const handleSkillLevelChange = (sportId: string, skillLevelId: string) => {
    setSkillLevels(prev => ({
      ...prev,
      [sportId]: skillLevelId
    }));
  };

  const handleSubmit = () => {
    // Save skill levels to user profile
    console.log('Selected skill levels:', skillLevels);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Qual é o seu nível de habilidade?</h2>
        <p className="text-muted-foreground">
          Selecione seu nível para cada esporte escolhido
        </p>
      </div>

      <div className="space-y-4">
        {selectedSports.map(sport => (
          <Card key={sport.id} className="p-4">
            <div className="mb-2 flex items-center">
              <span className="text-xl mr-2">{sport.icon}</span>
              <h3 className="text-lg font-medium">{sport.name}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {getSkillLevelsForSport(sport.id).map(level => (
                <div 
                  key={level.id}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    skillLevels[sport.id] === level.id 
                      ? 'border-primary bg-primary/10' 
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => handleSkillLevelChange(sport.id, level.id)}
                >
                  <div className="font-medium">{level.name}</div>
                  <div className="text-sm text-muted-foreground">{level.description}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={selectedSports.some(sport => !skillLevels[sport.id])}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default SkillLevelsStep;
