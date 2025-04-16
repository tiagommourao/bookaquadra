
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { GameTypePreference } from '@/types';

interface PreferencesStepProps {
  initialData: {
    wantsNotifications: boolean;
    gameTypes: string[];
    preferredDays: number[];
    preferredTimes: Record<string, any>;
  };
  onSubmit: (data: PreferencesStepProps['initialData']) => void;
  onBack: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' }
];

const GAME_TYPES: { id: GameTypePreference, label: string }[] = [
  { id: 'individual', label: 'Individual' },
  { id: 'doubles', label: 'Duplas' },
  { id: 'group', label: 'Grupos' }
];

const TIME_SLOTS = [
  { id: 'morning', label: 'Manhã', range: '06:00 - 12:00' },
  { id: 'afternoon', label: 'Tarde', range: '12:00 - 18:00' },
  { id: 'evening', label: 'Noite', range: '18:00 - 23:00' }
];

const PreferencesStep: React.FC<PreferencesStepProps> = ({
  initialData,
  onSubmit,
  onBack
}) => {
  const [preferences, setPreferences] = React.useState({
    wantsNotifications: initialData.wantsNotifications,
    gameTypes: initialData.gameTypes,
    preferredDays: initialData.preferredDays,
    preferredTimes: initialData.preferredTimes
  });

  const toggleNotifications = (checked: boolean) => {
    setPreferences(prev => ({ ...prev, wantsNotifications: checked }));
  };

  const toggleGameType = (typeId: string) => {
    setPreferences(prev => {
      const gameTypes = prev.gameTypes.includes(typeId)
        ? prev.gameTypes.filter(id => id !== typeId)
        : [...prev.gameTypes, typeId];
      return { ...prev, gameTypes };
    });
  };

  const toggleDay = (day: number) => {
    setPreferences(prev => {
      const preferredDays = prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day];
      return { ...prev, preferredDays };
    });
  };

  const toggleTimeSlot = (day: number, slotId: string) => {
    setPreferences(prev => {
      const preferredTimes = { ...prev.preferredTimes };
      const dayKey = `day_${day}`;
      
      if (!preferredTimes[dayKey]) {
        preferredTimes[dayKey] = [];
      }
      
      const daySlots = preferredTimes[dayKey] as string[];
      preferredTimes[dayKey] = daySlots.includes(slotId)
        ? daySlots.filter(id => id !== slotId)
        : [...daySlots, slotId];
      
      return { ...prev, preferredTimes };
    });
  };

  const handleSubmit = () => {
    onSubmit(preferences);
  };

  // Verificar se um slot de horário está selecionado
  const isTimeSlotSelected = (day: number, slotId: string) => {
    const dayKey = `day_${day}`;
    return preferences.preferredTimes[dayKey]?.includes(slotId) || false;
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Suas Preferências</CardTitle>
        <CardDescription>
          Configure como você prefere jogar e receber notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notificações */}
        <div>
          <h3 className="text-base font-medium mb-3">Notificações</h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Receber notificações de partidas abertas?</Label>
            <Switch 
              id="notifications" 
              checked={preferences.wantsNotifications}
              onCheckedChange={toggleNotifications}
            />
          </div>
        </div>

        {/* Tipos de Jogo */}
        <div>
          <h3 className="text-base font-medium mb-3">Tipos de Jogo</h3>
          <div className="space-y-3">
            {GAME_TYPES.map(gameType => (
              <div key={gameType.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`game-type-${gameType.id}`}
                  checked={preferences.gameTypes.includes(gameType.id)}
                  onCheckedChange={() => toggleGameType(gameType.id)}
                />
                <Label 
                  htmlFor={`game-type-${gameType.id}`}
                  className="cursor-pointer"
                >
                  {gameType.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Dias Preferidos */}
        <div>
          <h3 className="text-base font-medium mb-3">Dias Preferidos</h3>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day.value}
                type="button"
                className={`px-3 py-1 rounded-full text-sm ${
                  preferences.preferredDays.includes(day.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => toggleDay(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horários Preferidos */}
        <div>
          <h3 className="text-base font-medium mb-3">Horários Preferidos</h3>
          {preferences.preferredDays.length > 0 ? (
            <div className="space-y-4">
              {preferences.preferredDays.map(day => (
                <div key={day} className="border p-3 rounded-lg">
                  <h4 className="font-medium mb-2">{DAYS_OF_WEEK.find(d => d.value === day)?.label}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot.id}
                        type="button"
                        className={`p-2 text-xs text-center rounded border ${
                          isTimeSlotSelected(day, slot.id)
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => toggleTimeSlot(day, slot.id)}
                      >
                        <div>{slot.label}</div>
                        <div className="text-xs opacity-70">{slot.range}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Selecione pelo menos um dia para definir horários preferidos.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button onClick={handleSubmit}>Próximo</Button>
      </CardFooter>
    </>
  );
};

export default PreferencesStep;
