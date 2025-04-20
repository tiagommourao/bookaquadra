
import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { OnboardingStep, GameTypePreference } from '@/types';

interface PreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
  currentStep: OnboardingStep;
}

interface PreferencesFormValues {
  gameTypes: GameTypePreference[];
  preferredDays: number[];
}

export const PreferencesStep: React.FC<PreferencesStepProps> = ({ onNext, onBack, currentStep }) => {
  const { handleSubmit, setValue, watch } = useForm<PreferencesFormValues>({
    defaultValues: {
      gameTypes: [],
      preferredDays: [],
    },
  });

  const selectedGameTypes = watch('gameTypes') || [];
  const selectedPreferredDays = watch('preferredDays') || [];

  const gameTypeOptions = [
    { id: 'singles', label: 'Singles (1v1)' },
    { id: 'doubles', label: 'Doubles (2v2)' },
    { id: 'mixed', label: 'Mixed Doubles' },
    { id: 'group_play', label: 'Group Play' },
    { id: 'lessons', label: 'Lessons/Training' },
  ] as const;

  const daysOfWeekOptions = [
    { id: 0, label: 'Domingo' },
    { id: 1, label: 'Segunda-feira' },
    { id: 2, label: 'Terça-feira' },
    { id: 3, label: 'Quarta-feira' },
    { id: 4, label: 'Quinta-feira' },
    { id: 5, label: 'Sexta-feira' },
    { id: 6, label: 'Sábado' },
  ] as const;

  const handleGameTypeChange = (gameType: GameTypePreference) => {
    const current = [...selectedGameTypes];
    const index = current.indexOf(gameType);
    
    if (index === -1) {
      setValue('gameTypes', [...current, gameType]);
    } else {
      current.splice(index, 1);
      setValue('gameTypes', current);
    }
  };

  const handleDayChange = (day: number) => {
    const current = [...selectedPreferredDays];
    const index = current.indexOf(day);
    
    if (index === -1) {
      setValue('preferredDays', [...current, day]);
    } else {
      current.splice(index, 1);
      setValue('preferredDays', current);
    }
  };

  const onSubmit = (data: PreferencesFormValues) => {
    console.log('Preferences data:', data);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preferências de Jogo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quais tipos de jogos você prefere?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gameTypeOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`game-type-${option.id}`}
                    checked={selectedGameTypes.includes(option.id as GameTypePreference)}
                    onCheckedChange={() => handleGameTypeChange(option.id as GameTypePreference)}
                  />
                  <Label 
                    htmlFor={`game-type-${option.id}`}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Em quais dias você geralmente prefere jogar?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {daysOfWeekOptions.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`day-${day.id}`}
                    checked={selectedPreferredDays.includes(day.id)}
                    onCheckedChange={() => handleDayChange(day.id)}
                  />
                  <Label 
                    htmlFor={`day-${day.id}`}
                    className="cursor-pointer"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline"
          onClick={onBack}
        >
          Voltar
        </Button>
        <Button type="submit">
          Continuar
        </Button>
      </div>
    </form>
  );
};
