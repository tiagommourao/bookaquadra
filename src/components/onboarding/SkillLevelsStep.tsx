import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  SportType,
  SkillLevel,
} from '@/types';

export interface SkillLevelsStepProps {
  onNext: () => void;
  onPrev: () => void;
  selectedSports: SportType[];
  availableLevels: SkillLevel[];
  onSelectLevels: (levels: SkillLevel[]) => void;
}

const SkillLevelsStep = ({
  onNext,
  onPrev,
  selectedSports,
  availableLevels,
  onSelectLevels,
}: SkillLevelsStepProps) => {
  const [selectedLevels, setSelectedLevels] = useState<SkillLevel[]>([]);

  // Corrigir os tipos ao mapear os esportes
  const selectedSportsWithLevels = selectedSports.map(sport => ({
    id: sport.id,
    name: sport.name,
    icon: sport.icon || '',
    created_at: sport.created_at || new Date().toISOString(),
    updated_at: sport.updated_at || new Date().toISOString(),
    levels: availableLevels.filter(
      level => level.sport_type_id === sport.id
    ),
  }));

  const toggleLevel = (level: SkillLevel) => {
    const isSelected = selectedLevels.some((selectedLevel) => selectedLevel.id === level.id);

    if (isSelected) {
      setSelectedLevels(prevLevels => prevLevels.filter(selectedLevel => selectedLevel.id !== level.id));
    } else {
      setSelectedLevels(prevLevels => [...prevLevels, level]);
    }
  };

  useEffect(() => {
    onSelectLevels(selectedLevels);
  }, [selectedLevels, onSelectLevels]);

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="skill-levels">Selecione seus níveis de habilidade:</Label>
          <p className="text-sm text-muted-foreground">
            Para cada esporte selecionado, indique seu nível de habilidade.
          </p>
        </div>
        <ScrollArea className="h-[400px] w-full rounded-md border">
          <div className="p-4">
            {selectedSportsWithLevels.map((sport) => (
              <div key={sport.id} className="mb-4">
                <h3 className="text-lg font-semibold">{sport.name}</h3>
                {sport.levels.length > 0 ? (
                  <div className="grid gap-2">
                    {sport.levels.map((level) => (
                      <div key={level.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`level-${level.id}`}
                          checked={selectedLevels.some((selectedLevel) => selectedLevel.id === level.id)}
                          onCheckedChange={() => toggleLevel(level)}
                        />
                        <Label htmlFor={`level-${level.id}`} className="cursor-pointer">
                          {level.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum nível de habilidade disponível para este esporte.
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-between">
          <Button variant="secondary" onClick={onPrev}>
            Anterior
          </Button>
          <Button onClick={onNext}>Próximo</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillLevelsStep;
