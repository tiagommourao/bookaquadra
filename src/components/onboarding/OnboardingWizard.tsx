import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingStep } from '@/types';
import { OnboardingProgress } from './OnboardingProgress';
import { PersonalInfoStep } from './PersonalInfoStep';
import { SportsSelectionStep } from './SportsSelectionStep';
import { SkillLevelsStep } from './SkillLevelsStep';
import { PreferencesStep } from './PreferencesStep';
import { TermsStep } from './TermsStep';

interface OnboardingWizardProps {
  initialStep?: OnboardingStep;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ initialStep = 'personal-info' }) => {
  const [step, setStep] = useState<OnboardingStep>(initialStep);

  const nextStep = () => {
    switch (step) {
      case 'personal-info':
        setStep('sports-selection');
        break;
      case 'sports-selection':
        setStep('skill-levels');
        break;
      case 'skill-levels':
        setStep('preferences');
        break;
      case 'preferences':
        setStep('terms');
        break;
      case 'terms':
        // Handle completion or redirect
        console.log('Onboarding completed!');
        break;
      default:
        break;
    }
  };

  const prevStep = () => {
    switch (step) {
      case 'sports-selection':
        setStep('personal-info');
        break;
      case 'skill-levels':
        setStep('sports-selection');
        break;
      case 'preferences':
        setStep('skill-levels');
        break;
      case 'terms':
        setStep('preferences');
        break;
      default:
        break;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'personal-info':
        return <PersonalInfoStep onNext={nextStep} currentStep={step} />;
      case 'sports-selection':
        return <SportsSelectionStep onNext={nextStep} onBack={prevStep} currentStep={step} />;
      case 'skill-levels':
        return <SkillLevelsStep onNext={nextStep} onBack={prevStep} currentStep={step} />;
      case 'preferences':
        return <PreferencesStep onNext={nextStep} onBack={prevStep} currentStep={step} />;
      case 'terms':
        return <TermsStep onNext={nextStep} onBack={prevStep} currentStep={step} />;
      default:
        return <div>Invalid step</div>;
    }
  };

  const stepNumber = () => {
    switch (step) {
      case 'personal-info':
        return 1;
      case 'sports-selection':
        return 2;
      case 'skill-levels':
        return 3;
      case 'preferences':
        return 4;
      case 'terms':
        return 5;
      default:
        return 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bem-vindo! Complete seu cadastro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <OnboardingProgress step={stepNumber()} />
        {renderStepContent()}
      </CardContent>
    </Card>
  );
};
