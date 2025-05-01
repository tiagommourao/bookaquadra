
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserProfileHeader } from './components/UserProfileHeader';
import { UserContactInfo } from './components/UserContactInfo';
import { UserPreferences } from './components/UserPreferences';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useUserDetails } from './hooks/useUserDetails';

export interface UserData {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  level?: string;
  points?: number;
  sports?: string[];
  status: 'active' | 'blocked' | 'suspended';
  avatarUrl?: string;
  badges?: string[];
  lastLogin?: Date | string;
  createdAt?: string;
  isAdmin?: boolean;
  role?: string;
}

interface AdminUserDetailsProps {
  userId: string;
  onClose: () => void;
  userData: UserData;
}

export const AdminUserDetails = ({ userId, onClose, userData }: AdminUserDetailsProps) => {
  const {
    userDetails,
    loading,
    error,
    updateUserName,
    updateUserContact,
    blockUser,
    unblockUser,
    makeAdmin,
    removeAdmin
  } = useUserDetails(userId, userData);

  const [currentTab, setCurrentTab] = useState<'info' | 'preferences'>('info');

  const handleTabChange = (tab: 'info' | 'preferences') => {
    setCurrentTab(tab);
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2 h-8 w-8 p-0" 
            onClick={onClose}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle>Detalhes do Usuário</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando detalhes do usuário...</span>
          </div>
        ) : error ? (
          <div className="text-center p-6 text-red-500">
            <p>Erro ao carregar os detalhes do usuário.</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <UserProfileHeader 
              userData={userDetails}
              onBlockUser={blockUser}
              onUnblockUser={unblockUser}
              onMakeAdmin={makeAdmin}
              onRemoveAdmin={removeAdmin}
            />
            
            <div className="flex border-b">
              <button
                className={`px-4 py-2 font-medium ${
                  currentTab === 'info'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange('info')}
              >
                Informações Pessoais
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  currentTab === 'preferences'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange('preferences')}
              >
                Preferências
              </button>
            </div>

            {currentTab === 'info' ? (
              <UserContactInfo 
                userData={userDetails} 
                onUpdateName={updateUserName}
                onUpdateContact={updateUserContact} 
              />
            ) : (
              <UserPreferences userData={userDetails} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
