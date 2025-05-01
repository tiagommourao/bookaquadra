import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { getDayName } from '@/lib/utils';
import { UserData } from '../AdminUserDetails';

export interface UserPreferencesProps {
  user: UserData;
}

export const UserPreferences: React.FC<UserPreferencesProps> = ({
  user
}) => {
  const getPreferredGameTypes = () => {
    if (!user?.preferred_game_types || user.preferred_game_types.length === 0) {
      return 'Não informado';
    }
    
    return user.preferred_game_types.map((type: string) => {
      switch (type) {
        case 'singles':
          return 'Individual';
        case 'doubles':
          return 'Duplas';
        case 'group':
          return 'Grupo';
        default:
          return type;
      }
    }).join(', ');
  };
  
  const getPreferredDays = () => {
    if (!user?.preferred_days || user.preferred_days.length === 0) {
      return 'Não informado';
    }
    
    return user.preferred_days
      .map((day: number) => getDayName(day))
      .join(', ');
  };
  
  const getPreferredTimes = () => {
    if (!user?.preferred_times) {
      return 'Não informado';
    }
    
    const times: string[] = [];
    
    if (user.preferred_times.morning) {
      times.push('Manhã');
    }
    
    if (user.preferred_times.afternoon) {
      times.push('Tarde');
    }
    
    if (user.preferred_times.evening) {
      times.push('Noite');
    }
    
    return times.length > 0 ? times.join(', ') : 'Não informado';
  };

  return (
    <div className="space-y-3">
      <div className="p-3 bg-muted/30 rounded-md">
        <div className="font-medium text-sm mb-2">Preferências de Jogo</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Tipos de Jogo Preferidos</div>
            <div className="text-sm">{getPreferredGameTypes()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Dias Preferidos</div>
            <div className="text-sm">{getPreferredDays()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Horários Preferidos</div>
            <div className="text-sm">{getPreferredTimes()}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-sm">Receber notificações por e-mail</div>
        <Switch checked={user?.wants_notifications || false} disabled />
      </div>
      <div className="flex justify-between items-center">
        <div className="text-sm">Status do onboarding</div>
        <Badge variant={user?.onboarding_completed ? "secondary" : "outline"} className={user?.onboarding_completed ? "bg-green-100 text-green-800" : ""}>
          {user?.onboarding_completed ? "Completo" : "Pendente"}
        </Badge>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-sm">Termos aceitos</div>
        <Badge variant={user?.terms_accepted ? "secondary" : "outline"} className={user?.terms_accepted ? "bg-green-100 text-green-800" : ""}>
          {user?.terms_accepted ? "Sim" : "Não"}
        </Badge>
      </div>
    </div>
  );
};
