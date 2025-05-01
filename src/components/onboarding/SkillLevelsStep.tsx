import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface SkillLevelsStepProps {
  onNext: () => void;
  onBack: () => void;
}

const SkillLevelsStep = ({ onNext, onBack }: SkillLevelsStepProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Nível de Habilidade</h2>
      <p className="text-gray-600 mb-6">
        Selecione seu nível de habilidade para cada esporte escolhido.
      </p>
      <div className="space-y-4">
        {/* Aqui seria implementado a seleção de níveis por esporte */}
        <div className="bg-gray-100 p-4 rounded-md text-center">
          <p>Níveis de habilidade serão mostrados aqui</p>
        </div>
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext}>
          Próximo
        </Button>
      </div>
    </Card>
  );
};

export default SkillLevelsStep;
