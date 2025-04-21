
import React from 'react';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps?: number; // Tornando opcional
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  completedSteps = 0 // Valor padrão
}) => {
  const progress = ((currentStep) / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">Configurando seu perfil</span>
        <span className="text-sm font-medium">{`${currentStep} de ${totalSteps}`}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default OnboardingProgress;
