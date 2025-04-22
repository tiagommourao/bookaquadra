
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
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<Record<string, string>>({});
  const [skillNotes, setSkillNotes] = useState<Record<string, string>>({});
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    avatarUrl: '',
    city: '',
    neighborhood: '',
    zipcode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

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

  // Handlers para cada componente
  const handlePersonalInfoSubmit = (data: typeof personalInfo) => {
    setPersonalInfo(data);
    handleNext();
  };

  const handleSportsSubmit = (sports: string[]) => {
    setSelectedSports(sports);
    handleNext();
  };

  const handleSkillLevelsSubmit = (levels: Record<string, string>, notes: Record<string, string>) => {
    setSkillLevels(levels);
    setSkillNotes(notes);
    handleNext();
  };

  const handleTermsSubmit = (accepted: boolean) => {
    setTermsAccepted(accepted);
    setIsSubmitting(true);
    // Aqui você pode adicionar o código para finalizar o onboarding
    // Por exemplo: salvar todos os dados no banco de dados
    setTimeout(() => {
      setIsSubmitting(false);
      // Redirecionar ou fazer outra ação após a conclusão
    }, 1000);
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
            <PersonalInfoStep 
              initialData={personalInfo}
              onSubmit={handlePersonalInfoSubmit}
            />
          )}
          {currentStep === 'sports-selection' && (
            <SportsSelectionStep 
              selectedSports={selectedSports}
              onSubmit={handleSportsSubmit}
              onBack={handleBack} 
            />
          )}
          {currentStep === 'skill-levels' && (
            <SkillLevelsStep 
              selectedSports={selectedSports}
              skillLevels={skillLevels}
              skillNotes={skillNotes}
              onSubmit={handleSkillLevelsSubmit}
              onBack={handleBack} 
            />
          )}
          {currentStep === 'preferences' && (
            <PreferencesStep onNext={handleNext} onBack={handleBack} currentStep={currentStep} />
          )}
          {currentStep === 'terms' && (
            <TermsStep 
              termsAccepted={termsAccepted}
              onSubmit={handleTermsSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingWizard;
