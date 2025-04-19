
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AvatarFrame } from '@/components/gamification/AvatarFrame';
import { UserLevel } from '@/components/gamification/UserLevel';
import { AdminUserData } from '@/types/admin';

interface UserProfileSectionProps {
  userData: AdminUserData;
}

export const UserProfileSection = ({ userData }: UserProfileSectionProps) => {
  const getStatusBadge = (status: string, isAdmin: boolean) => {
    if (isAdmin) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>;
      case 'blocked':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Bloqueado</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Suspenso</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
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
          {userData.status !== 'active' && getStatusBadge(userData.status, userData.isAdmin)}
        </div>
      </div>
    </div>
  );
};
