import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, FilterIcon, Download, Mail, ShieldAlert, Shield, 
  MoreHorizontal, UserCog, UserX, Eye, Edit, AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AvatarFrame } from '@/components/gamification/AvatarFrame';
import { UserLevel } from '@/components/gamification/UserLevel';
import { AdminUsersFilter } from '@/components/admin/users/AdminUsersFilter';
import { AdminUserDetails } from '@/components/admin/users/AdminUserDetails';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdminUserData } from '@/types/admin';
import { useAdminUsersData } from '@/hooks/admin/useAdminUsersData';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const UsersList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { users, isLoading, error, setAsAdmin, removeAdminRole, blockUser, unblockUser } = useAdminUsersData();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    // Registrar informações importantes para diagnóstico
    console.log("UsersList - Estado atual:", {
      isAdmin,
      currentUser: user?.email,
      loadingUsers: isLoading,
      usersCount: users?.length,
      error
    });
  }, [isAdmin, user, isLoading, users, error]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      selectedStatus === 'all' || 
      (selectedStatus === 'active' && user.status === 'active') ||
      (selectedStatus === 'blocked' && user.status === 'blocked') ||
      (selectedStatus === 'suspended' && user.status === 'suspended') ||
      (selectedStatus === 'admin' && user.isAdmin);
    
    return matchesSearch && matchesStatus;
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

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

  const getSportBadge = (sport: { name: string; level: string }) => {
    switch (sport.name?.toLowerCase()) {
      case 'tênis':
      case 'tenis':
        return <Badge key={`${sport.name}-${sport.level}`} variant="outline" className="bg-green-50 text-green-700 mr-1">🎾 Tênis ({sport.level})</Badge>;
      case 'padel':
        return <Badge key={`${sport.name}-${sport.level}`} variant="outline" className="bg-blue-50 text-blue-700 mr-1">🏓 Padel ({sport.level})</Badge>;
      case 'beach tennis':
        return <Badge key={`${sport.name}-${sport.level}`} variant="outline" className="bg-orange-50 text-orange-700 mr-1">🏝️ Beach ({sport.level})</Badge>;
      default:
        return <Badge key={`${sport.name}-${sport.level}`} variant="outline" className="bg-gray-50 text-gray-700 mr-1">{sport.name} ({sport.level})</Badge>;
    }
  };

  const showUserDetails = (userId: string) => {
    setSelectedUser(userId);
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
  };

  const handleSetAdmin = async (userId: string) => {
    try {
      await setAsAdmin.mutateAsync(userId);
    } catch (error: any) {
      console.error("Erro ao promover usuário:", error);
      toast.error("Houve um erro ao promover o usuário. Tente novamente.");
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      await removeAdminRole.mutateAsync(userId);
    } catch (error: any) {
      console.error("Erro ao remover admin:", error);
      toast.error("Houve um erro ao remover privilégios de admin. Tente novamente.");
    }
  };

  const handleBlockUser = async (userId: string, reason: string = 'Bloqueio administrativo') => {
    try {
      await blockUser.mutateAsync({ userId, reason });
    } catch (error: any) {
      console.error("Erro ao bloquear usuário:", error);
      toast.error("Houve um erro ao bloquear o usuário. Tente novamente.");
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await unblockUser.mutateAsync(userId);
    } catch (error: any) {
      console.error("Erro ao desbloquear usuário:", error);
      toast.error("Houve um erro ao desbloquear o usuário. Tente novamente.");
    }
  };

  const renderErrorState = () => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar usuários</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Ocorreu um erro ao carregar os dados dos usuários. Por favor, tente novamente.'}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h2>
          <Button>
            <Mail className="mr-2 h-4 w-4" /> Convidar Novo Usuário
          </Button>
        </div>
        
        {renderErrorState()}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
            <CardDescription>
              Gerencie os usuários do sistema, seus níveis de acesso e permissões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-wrap gap-4 justify-between items-center">
                <div className="flex items-center gap-2 flex-grow max-w-md">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={isFilterOpen ? 'bg-accent' : ''}
                  >
                    <FilterIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                
                <ToggleGroup type="single" value={selectedStatus} onValueChange={(value) => value && setSelectedStatus(value)}>
                  <ToggleGroupItem value="all">Todos</ToggleGroupItem>
                  <ToggleGroupItem value="active">Ativos</ToggleGroupItem>
                  <ToggleGroupItem value="admin">Admins</ToggleGroupItem>
                  <ToggleGroupItem value="blocked">Bloqueados</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {isFilterOpen && (
                <AdminUsersFilter 
                  onClose={() => setIsFilterOpen(false)}
                  onApply={() => setIsFilterOpen(false)}
                />
              )}

              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <span className="text-sm font-medium">{selectedUsers.length} usuários selecionados</span>
                  <div className="flex-grow"></div>
                  <Button size="sm" variant="outline">
                    <Mail className="mr-2 h-4 w-4" /> Enviar Mensagem
                  </Button>
                  <Button size="sm" variant="outline">
                    <Shield className="mr-2 h-4 w-4" /> Promover a Admin
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                    <UserX className="mr-2 h-4 w-4" /> Bloquear
                  </Button>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </div>
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
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            <span>Carregando usuários...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-destructive">
                          Erro ao carregar dados. Verifique suas permissões de administrador.
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">Nenhum usuário encontrado</TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <AvatarFrame
                                src={user.avatarUrl || undefined}
                                fallback={user.name.charAt(0)}
                                frameType={user.level as any}
                                size="sm"
                              />
                              <div>
                                <div className="font-medium">{user.name || 'Sem nome'}</div>
                                <div className="text-xs text-muted-foreground">{user.city}/{user.neighborhood}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{user.email}</div>
                              <div className="text-xs text-muted-foreground">{user.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <UserLevel level={user.level as any} points={user.points} showDetails />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.sports && user.sports.length > 0 ? 
                                user.sports.map((sport) => getSportBadge(sport)) : 
                                <span className="text-xs text-muted-foreground">Nenhum esporte</span>
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(user.status, user.isAdmin)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm whitespace-nowrap">
                              {formatDate(user.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm whitespace-nowrap">
                              {user.lastLogin ? formatDateTime(user.lastLogin) : 'Nunca'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => showUserDetails(user.id)}>
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
                                  {user.isAdmin ? (
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-amber-600"
                                      onClick={() => handleRemoveAdmin(user.id)}
                                    >
                                      <UserCog className="h-4 w-4 mr-2" /> Remover Admin
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-blue-600"
                                      onClick={() => handleSetAdmin(user.id)}
                                    >
                                      <Shield className="h-4 w-4 mr-2" /> Promover a Admin
                                    </DropdownMenuItem>
                                  )}
                                  {user.status === 'blocked' ? (
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-green-600"
                                      onClick={() => handleUnblockUser(user.id)}
                                    >
                                      <Shield className="h-4 w-4 mr-2" /> Desbloquear
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-destructive"
                                      onClick={() => handleBlockUser(user.id)}
                                    >
                                      <ShieldAlert className="h-4 w-4 mr-2" /> Bloquear
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedUser && (
          <AdminUserDetails 
            userId={selectedUser} 
            onClose={closeUserDetails} 
            userData={filteredUsers.find(user => user.id === selectedUser) as AdminUserData}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default UsersList;
