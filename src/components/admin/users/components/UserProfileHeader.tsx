
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AvatarFrame } from '@/components/gamification/AvatarFrame';
import { UserLevel } from '@/components/gamification/UserLevel';
import { UserData } from '../AdminUserDetails';

interface UserProfileHeaderProps {
  userData: UserData;
}

export function UserProfileHeader({ userData }: UserProfileHeaderProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'blocked':
        return 'Bloqueado';
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <AvatarFrame
        src={userData.avatarUrl || undefined}
        fallback={userData.name.charAt(0)}
        frameType={userData.level as any}
        size="lg"
      />
      <div>
        <h3 className="text-xl font-semibold">{userData.name}</h3>
        <div className="flex items-center mt-1 space-x-2">
          <UserLevel level={userData.level as any} points={userData.points} showDetails />
          {userData.status !== 'active' && (
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
              {getStatusLabel(userData.status)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
