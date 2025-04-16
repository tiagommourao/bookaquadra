
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { OnboardingStep } from '@/types';
import PersonalInfoStep from './PersonalInfoStep';
import SportsSelectionStep from './SportsSelectionStep';
import SkillLevelsStep from './SkillLevelsStep';
import PreferencesStep from './PreferencesStep';
import TermsStep from './TermsStep';
import OnboardingProgress from './OnboardingProgress';
import { Loader2 } from 'lucide-react';

const OnboardingWizard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('personal-info');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: user?.name?.split(' ')?.[0] || '',
      lastName: user?.name?.split(' ')?.[1] || '',
      avatarUrl: user?.avatarUrl || '',
      city: '',
      neighborhood: '',
      zipcode: ''
    },
    selectedSports: [] as string[],
    skillLevels: {} as Record<string, string>,
    skillNotes: {} as Record<string, string>,
    preferences: {
      wantsNotifications: true,
      gameTypes: [] as string[],
      preferredDays: [] as number[],
      preferredTimes: {}
    },
    termsAccepted: false
  });

  const steps: OnboardingStep[] = [
    'personal-info',
    'sports-selection',
    'skill-levels',
    'preferences',
    'terms'
  ];
  
  const currentStepIndex = steps.indexOf(currentStep);
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data && data.onboarding_completed) {
          // Usuário já completou onboarding
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    
    checkOnboardingStatus();
  }, [user, navigate]);
  
  const handleNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handlePrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };
  
  const handlePersonalInfoSubmit = (data: typeof formData.personalInfo) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: data
    }));
    handleNextStep();
  };

  const handleSportsSelectionSubmit = (selectedSports: string[]) => {
    setFormData(prev => ({
      ...prev,
      selectedSports
    }));
    handleNextStep();
  };

  const handleSkillLevelsSubmit = (
    skillLevels: Record<string, string>, 
    skillNotes: Record<string, string>
  ) => {
    setFormData(prev => ({
      ...prev,
      skillLevels,
      skillNotes
    }));
    handleNextStep();
  };

  const handlePreferencesSubmit = (preferences: typeof formData.preferences) => {
    setFormData(prev => ({
      ...prev,
      preferences
    }));
    handleNextStep();
  };

  const handleTermsSubmit = async (termsAccepted: boolean) => {
    if (!termsAccepted) {
      toast.error('Você precisa aceitar os termos para continuar');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      termsAccepted
    }));
    
    await finalizeOnboarding();
  };
  
  const finalizeOnboarding = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 1. Atualizar perfil básico
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.personalInfo.firstName,
          last_name: formData.personalInfo.lastName,
          avatar_url: formData.personalInfo.avatarUrl,
          city: formData.personalInfo.city,
          neighborhood: formData.personalInfo.neighborhood,
          profile_progress: 100
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // 2. Criar preferências do usuário
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          city: formData.personalInfo.city,
          neighborhood: formData.personalInfo.neighborhood,
          zipcode: formData.personalInfo.zipcode,
          wants_notifications: formData.preferences.wantsNotifications,
          preferred_game_types: formData.preferences.gameTypes,
          preferred_days: formData.preferences.preferredDays,
          preferred_times: formData.preferences.preferredTimes,
          onboarding_completed: true,
          terms_accepted: formData.termsAccepted,
          terms_accepted_at: new Date().toISOString()
        });
      
      if (preferencesError) throw preferencesError;
      
      // 3. Adicionar modalidades esportivas e níveis do usuário
      for (const sportTypeId of formData.selectedSports) {
        const skillLevelId = formData.skillLevels[sportTypeId];
        
        if (skillLevelId) {
          const { error: userSportError } = await supabase
            .from('user_sports')
            .insert({
              user_id: user.id,
              sport_type_id: sportTypeId,
              skill_level_id: skillLevelId,
              notes: formData.skillNotes[sportTypeId] || null,
              is_verified: false
            });
          
          if (userSportError) throw userSportError;
        }
      }
      
      // 4. Inicializar sistema de gamificação para o usuário
      const { data: rookieLevel } = await supabase
        .from('gamification_levels')
        .select('id')
        .eq('name', 'Rookie')
        .single();
      
      if (rookieLevel) {
        await supabase
          .from('user_gamification')
          .insert({
            user_id: user.id,
            total_points: 8, // Pontos por completar o perfil
            current_level_id: rookieLevel.id
          });
          
        // Registro da transação de pontos
        await supabase
          .from('point_transactions')
          .insert({
            user_id: user.id,
            points: 8,
            source_type: 'profile_completion',
            description: 'Completou perfil esportivo'
          });
      }
      
      // Atualizar dados do usuário
      await refreshUser();
      
      toast.success('Perfil criado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error('Erro ao finalizar onboarding:', error);
      toast.error(`Erro ao salvar seu perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar componente apropriado baseado no passo atual
  const renderStep = () => {
    switch (currentStep) {
      case 'personal-info':
        return (
          <PersonalInfoStep 
            initialData={formData.personalInfo} 
            onSubmit={handlePersonalInfoSubmit} 
          />
        );
      case 'sports-selection':
        return (
          <SportsSelectionStep
            selectedSports={formData.selectedSports}
            onSubmit={handleSportsSelectionSubmit}
            onBack={handlePrevStep}
          />
        );
      case 'skill-levels':
        return (
          <SkillLevelsStep
            selectedSports={formData.selectedSports}
            skillLevels={formData.skillLevels}
            skillNotes={formData.skillNotes}
            onSubmit={handleSkillLevelsSubmit}
            onBack={handlePrevStep}
          />
        );
      case 'preferences':
        return (
          <PreferencesStep
            initialData={formData.preferences}
            onSubmit={handlePreferencesSubmit}
            onBack={handlePrevStep}
          />
        );
      case 'terms':
        return (
          <TermsStep
            termsAccepted={formData.termsAccepted}
            onSubmit={handleTermsSubmit}
            onBack={handlePrevStep}
            isSubmitting={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Progress Bar */}
          <OnboardingProgress currentStep={currentStepIndex} totalSteps={steps.length} />
          
          {/* Form Container */}
          <Card className="mt-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium">Finalizando seu cadastro...</p>
              </div>
            ) : (
              renderStep()
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
