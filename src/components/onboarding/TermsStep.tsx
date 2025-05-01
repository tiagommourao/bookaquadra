
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export interface TermsStepProps {
  onNext: () => void;
  onBack: () => void;
}

const TermsStep = ({ onNext, onBack }: TermsStepProps) => {
  const [acceptedTerms, setAcceptTerms] = React.useState(false);

  const handleAcceptTerms = (checked: boolean) => {
    setAcceptTerms(checked);
  };

  return (
    <Card className="w-full">
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Termos e Condições</h2>
        <p className="text-gray-600 mb-6">
          Leia atentamente os termos e condições antes de prosseguir.
        </p>
        <div className="mb-4">
          <label
            htmlFor="terms"
            className="flex items-center space-x-2 cursor-pointer"
          >
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => {
                handleAcceptTerms(checked === true);
              }}
            />
            <span>Eu aceito os termos e condições</span>
          </label>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          <Button onClick={onNext} disabled={!acceptedTerms}>
            Avançar
          </Button>
        </div>
      </Card>
    </Card>
  );
};

export default TermsStep;
