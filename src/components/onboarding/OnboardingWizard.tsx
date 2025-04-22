import React, { useState } from 'react';
import PersonalInfoStep from './PersonalInfoStep';
import SportsSelectionStep from './SportsSelectionStep';
import SkillLevelsStep from './SkillLevelsStep';
import { PreferencesStep } from './PreferencesStep';
import TermsStep from './TermsStep';
import OnboardingProgress from './OnboardingProgress';
import { Card, CardContent } from '@/components/ui/card';

type Step = 'personal-info' | 'sports-selection' | 'skill-levels' | 'preferences' | 'terms';

const OnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState<Step>('personal-info');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  const handleNext = () => {
    setCompletedSteps(prev => {
      const updated = new Set(prev);
      updated.add(currentStep);
      return updated;
    });

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

  const getStepNumber = (): number => {
    switch (currentStep) {
      case 'personal-info': return 1;
      case 'sports-selection': return 2;
      case 'skill-levels': return 3;
      case 'preferences': return 4;
      case 'terms': return 5;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <OnboardingProgress 
        currentStep={getStepNumber()} 
        totalSteps={5}
      />
      
      <Card className="mt-6">
        <CardContent className="p-6">
          {currentStep === 'personal-info' && (
            <PersonalInfoStep onNext={handleNext} />
          )}
          {currentStep === 'sports-selection' && (
            <SportsSelectionStep onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 'skill-levels' && (
            <SkillLevelsStep onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 'preferences' && (
            <PreferencesStep onNext={handleNext} onBack={handleBack} currentStep={currentStep} />
          )}
          {currentStep === 'terms' && (
            <TermsStep onNext={handleNext} onBack={handleBack} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingWizard;
