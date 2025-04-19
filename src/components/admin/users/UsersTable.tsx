
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, Edit, Shield, ShieldAlert } from 'lucide-react';
import { AvatarFrame } from '@/components/gamification/AvatarFrame';
import { UserLevel } from '@/components/gamification/UserLevel';
import { AdminUser } from '@/hooks/admin/useAdminUsers';
import { formatDate, formatDateTime } from '@/lib/utils';

interface UsersTableProps {
  users: AdminUser[];
  selectedUsers: string[];
  onToggleUserSelection: (userId: string) => void;
  onToggleSelectAll: () => void;
  onShowUserDetails: (userId: string) => void;
}

export const UsersTable = ({
  users,
  selectedUsers,
  onToggleUserSelection,
  onToggleSelectAll,
  onShowUserDetails,
}: UsersTableProps) => {
  // Função auxiliar para renderizar o status
  const getStatusBadge = (status: string) => {
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

  // Função auxiliar para renderizar badges de modalidades
  const getSportsBadge = (sport: string) => {
    const sportIcons: Record<string, string> = {
      'Tênis': '🎾',
      'Padel': '🏓',
      'Beach Tennis': '🏖️'
    };

    return (
      <Badge 
        key={sport}
        variant="outline" 
        className="mr-1 bg-blue-50 text-blue-700"
      >
        {sportIcons[sport] || '🎯'} {sport}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={onToggleSelectAll}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
            </TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead>Modalidades</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cadastro</TableHead>
            <TableHead>Último acesso</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => onToggleUserSelection(user.id)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <AvatarFrame
                    src={user.avatarUrl}
                    fallback={user.name.charAt(0)}
                    frameType={user.level as any}
                    size="sm"
                  />
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.city}/{user.neighborhood}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">{user.email}</div>
                  <div className="text-xs text-muted-foreground">{user.phone}</div>
                </div>
              </TableCell>
              <TableCell>
                <UserLevel level={user.level as any} points={user.points} showDetails />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.sports.map(sport => getSportsBadge(sport))}
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(user.status)}
              </TableCell>
              <TableCell>
                <div className="text-sm whitespace-nowrap">
                  {formatDate(new Date(user.createdAt))}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm whitespace-nowrap">
                  {user.lastLogin ? formatDateTime(new Date(user.lastLogin)) : 'Nunca'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onShowUserDetails(user.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={`cursor-pointer ${
                          user.status === 'blocked' 
                            ? 'text-green-600' 
                            : 'text-destructive'
                        }`}
                      >
                        {user.status === 'blocked' ? (
                          <>
                            <Shield className="h-4 w-4 mr-2" /> Desbloquear
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-4 w-4 mr-2" /> Bloquear
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
