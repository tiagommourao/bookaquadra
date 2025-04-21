
import React, { useState } from 'react';
import PersonalInfoStep from './PersonalInfoStep';
import SportsSelectionStep from './SportsSelectionStep';
import SkillLevelsStep from './SkillLevelsStep';
import { PreferencesStep } from './PreferencesStep';
import TermsStep from './TermsStep';
import OnboardingProgress from './OnboardingProgress';
import { Card, CardContent } from '@/components/ui/card';

// Tipo para cada passo do onboarding
type Step = 'personal-info' | 'sports-selection' | 'skill-levels' | 'preferences' | 'terms';

// Props que todos os componentes de etapa devem compartilhar
interface CommonStepProps {
  onNext: () => void;
  onBack: () => void;
  currentStep: Step;
}

const OnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState<Step>('personal-info');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  const handleNext = () => {
    // Marcar o passo atual como concluído
    setCompletedSteps(prev => {
      const updated = new Set(prev);
      updated.add(currentStep);
      return updated;
    });

    // Avançar para o próximo passo
    switch (currentStep) {
      case 'personal-info':
        setCurrentStep('sports-selection');
        break;
      case 'sports-selection':
        setCurrentStep('skill-levels');
        break;
      case 'skill-levels':
        setCurrentStep('preferences');
        break;
      case 'preferences':
        setCurrentStep('terms');
        break;
      case 'terms':
        // Finalizar onboarding
        break;
    }
  };

  const handleBack = () => {
    // Voltar para o passo anterior
    switch (currentStep) {
      case 'sports-selection':
        setCurrentStep('personal-info');
        break;
      case 'skill-levels':
        setCurrentStep('sports-selection');
        break;
      case 'preferences':
        setCurrentStep('skill-levels');
        break;
      case 'terms':
        setCurrentStep('preferences');
        break;
    }
  };

  // Determinar o número do passo atual
  const getStepNumber = (): number => {
    switch (currentStep) {
      case 'personal-info': return 1;
      case 'sports-selection': return 2;
      case 'skill-levels': return 3;
      case 'preferences': return 4;
      case 'terms': return 5;
    }
  };

  // Renderizar o componente do passo atual
  const renderStep = () => {
    switch (currentStep) {
      case 'personal-info':
        return <PersonalInfoStep onNext={handleNext} onBack={handleBack} currentStep={currentStep} />;
      case 'sports-selection':
        return <SportsSelectionStep onNext={handleNext} onBack={handleBack} currentStep={currentStep} />;
      case 'skill-levels':
        return <SkillLevelsStep onNext={handleNext} onBack={handleBack} currentStep={currentStep} />;
      case 'preferences':
        return <PreferencesStep onNext={handleNext} onBack={handleBack} currentStep={currentStep} />;
      case 'terms':
        return <TermsStep onNext={handleNext} onBack={handleBack} currentStep={currentStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <OnboardingProgress 
        currentStep={getStepNumber()} 
        totalSteps={5}
        completedSteps={Array.from(completedSteps).length}
      />
      
      <Card className="mt-6">
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingWizard;
