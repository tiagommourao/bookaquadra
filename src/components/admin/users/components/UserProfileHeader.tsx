import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AvatarFrame } from '@/components/gamification/AvatarFrame';
import { UserLevel } from '@/components/gamification/UserLevel';
import { UserData } from '../AdminUserDetails';

export interface UserProfileHeaderProps {
  user: UserData;
  onBlockUser: (reason: string) => Promise<boolean>;
  onUnblockUser: () => Promise<boolean>;
  onMakeAdmin: () => Promise<boolean>;
  onRemoveAdmin: () => Promise<boolean>;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  user,
  onBlockUser,
  onUnblockUser,
  onMakeAdmin,
  onRemoveAdmin
}) => {
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
        src={user.avatarUrl || undefined}
        fallback={user.name.charAt(0)}
        frameType={user.level as any}
        size="lg"
      />
      <div>
        <h3 className="text-xl font-semibold">{user.name}</h3>
        <div className="flex items-center mt-1 space-x-2">
          <UserLevel level={user.level as any} points={user.points} showDetails />
          {user.status !== 'active' && (
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
              {getStatusLabel(user.status)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
