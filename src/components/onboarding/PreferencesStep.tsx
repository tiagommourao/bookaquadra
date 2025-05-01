
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GameTypePreference } from '@/types';

export interface PreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
  currentStep: string;
}

const gameTypeOptions: GameTypePreference[] = [
  { id: 'competitive', name: 'Competitivo', description: 'Focado em vencer e melhorar o desempenho.', selected: false },
  { id: 'social', name: 'Social', description: 'Prioriza a diversão e o contato com outras pessoas.', selected: false },
  { id: 'exercise', name: 'Exercício', description: 'Busca a prática esportiva como forma de se exercitar.', selected: false },
  { id: 'relaxation', name: 'Relaxamento', description: 'Utiliza o esporte para relaxar e aliviar o estresse.', selected: false },
];

const PreferencesStep = ({ onNext, onBack }: PreferencesStepProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gameTypes, setGameTypes] = useState<GameTypePreference[]>(gameTypeOptions);

  const filteredGameTypes = gameTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateGameTypePreference = (id: string, selected: boolean) => {
    setGameTypes(prev => 
      prev.map(item => {
        return item.id === id ? { ...item, selected } : item;
      })
    );
  };

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="search">Buscar Modalidades</Label>
          <Input
            type="search"
            id="search"
            placeholder="Buscar por tipo de jogo"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Preferências de Jogo</Label>
          <div className="flex flex-col space-y-2">
            {filteredGameTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={type.selected}
                  onCheckedChange={(checked) => updateGameTypePreference(type.id, !!checked)}
                />
                <Label htmlFor={type.id} className="cursor-pointer">
                  {type.name} - {type.description}
                </Label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Voltar</Button>
          <Button onClick={onNext}>Próximo</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreferencesStep;
