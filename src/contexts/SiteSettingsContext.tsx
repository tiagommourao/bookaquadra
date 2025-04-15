
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteSettings } from '@/types';

interface SiteSettingsContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  isLoading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

// Default settings for development
const defaultSettings: SiteSettings = {
  companyName: 'BookaQuadra',
  logo: '/logo.png',
  primaryColor: '#3B7D4F',
  secondaryColor: '#1E88E5',
  contactEmail: 'contato@bookaquadra.com.br',
  contactPhone: '+55 11 99999-9999',
  cancellationPolicy: 'Cancelamentos devem ser feitos com pelo menos 24 horas de antecedência para reembolso integral.',
  mercadoPagoKey: '',
  googleCalendarIntegration: false
};

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Here we would fetch settings from database
        // For now, simulate loading
        setTimeout(() => {
          // In the real app, load from Supabase
          setSettings(defaultSettings);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error loading site settings:', error);
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    setIsLoading(true);
    try {
      // Here we would update settings in database
      const updatedSettings = { ...settings, ...newSettings };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        isLoading
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
