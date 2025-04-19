import React, { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Search, FilterIcon, Download, Mail, ShieldAlert, Shield, 
  MoreHorizontal, UserCog, UserX, Eye, Edit 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AvatarFrame } from '@/components/gamification/AvatarFrame';
import { UserLevel } from '@/components/gamification/UserLevel';
import { AdminUsersFilter } from '@/components/admin/users/AdminUsersFilter';
import { AdminUserDetails } from '@/components/admin/users/AdminUserDetails';
import { useAdminUsersData } from '@/hooks/admin/useAdminUsers';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const MOCK_USERS = [
  {
    id: '1',
    name: 'Maria Silva',
    email: 'maria@example.com',
    phone: '(11) 98765-4321',
    city: 'São Paulo',
    neighborhood: 'Moema',
    level: 'gold',
    points: 970,
    sports: ['padel', 'tennis'],
    status: 'active',
    isAdmin: false,
    createdAt: '2023-10-15T14:30:00Z',
    lastLogin: '2024-04-15T09:45:00Z',
    avatarUrl: null,
    badges: ['fairplay', 'streak10', 'seasonal'],
  },
  {
    id: '2',
    name: 'João Costa',
    email: 'joao@example.com',
    phone: '(11) 91234-5678',
    city: 'São Paulo',
    neighborhood: 'Pinheiros',
    level: 'silver',
    points: 790,
    sports: ['beach', 'padel'],
    status: 'blocked',
    isAdmin: false,
    createdAt: '2023-11-05T10:15:00Z',
    lastLogin: '2024-03-20T16:30:00Z',
    avatarUrl: null,
    badges: ['streak10', 'explorer'],
  },
  {
    id: '3',
    name: 'Ana Ferreira',
    email: 'ana@example.com',
    phone: '(11) 97654-3210',
    city: 'São Paulo',
    neighborhood: 'Vila Madalena',
    level: 'legend',
    points: 1650,
    sports: ['tennis', 'beach', 'padel'],
    status: 'active',
    isAdmin: true,
    createdAt: '2023-09-10T09:00:00Z',
    lastLogin: '2024-04-16T08:10:00Z',
    avatarUrl: null,
    badges: ['fairplay', 'streak10', 'explorer', 'teacher', 'community'],
  },
  {
    id: '4',
    name: 'Carlos Oliveira',
    email: 'carlos@example.com',
    phone: '(11) 95555-4444',
    city: 'Santos',
    neighborhood: 'Gonzaga',
    level: 'bronze',
    points: 320,
    sports: ['beach'],
    status: 'suspended',
    isAdmin: false,
    createdAt: '2024-01-20T15:45:00Z',
    lastLogin: '2024-02-10T19:20:00Z',
    avatarUrl: null,
    badges: ['explorer'],
  },
  {
    id: '5',
    name: 'Patricia Mendes',
    email: 'patricia@example.com',
    phone: '(11) 93333-2222',
    city: 'São Paulo',
    neighborhood: 'Jardim Paulista',
    level: 'gold',
    points: 1100,
    sports: ['tennis', 'padel'],
    status: 'active',
    isAdmin: false,
    createdAt: '2023-08-15T11:30:00Z',
    lastLogin: '2024-04-14T14:35:00Z',
    avatarUrl: null,
    badges: ['fairplay', 'streak10', 'community'],
  },
];

const UsersList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { users, isLoading } = useAdminUsersData();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatDateTime = (dateString: string) => {
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

  const getSportsBadge = (sport: string) => {
    switch (sport) {
      case 'tennis':
        return <Badge variant="outline" className="bg-green-50 text-green-700 mr-1">🎾 Tênis</Badge>;
      case 'padel':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 mr-1">🏓 Padel</Badge>;
      case 'beach':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 mr-1">🏝️ Beach</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 mr-1">{sport}</Badge>;
    }
  };

  const showUserDetails = (userId: string) => {
    setSelectedUser(userId);
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
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
                <Card className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Modalidades</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="cursor-pointer">🎾 Tênis</Badge>
                        <Badge variant="outline" className="cursor-pointer">🏓 Padel</Badge>
                        <Badge variant="outline" className="cursor-pointer">🏝️ Beach Tennis</Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Níveis</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="cursor-pointer">Bronze</Badge>
                        <Badge variant="outline" className="cursor-pointer">Silver</Badge>
                        <Badge variant="outline" className="cursor-pointer">Gold</Badge>
                        <Badge variant="outline" className="cursor-pointer">Legend</Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Data de cadastro</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="cursor-pointer">Últimos 7 dias</Badge>
                        <Badge variant="outline" className="cursor-pointer">Este mês</Badge>
                        <Badge variant="outline" className="cursor-pointer">Este ano</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
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
                    {filteredUsers.map((user) => (
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
                              <div className="font-medium">{user.name}</div>
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
                            {user.sports.map(sport => getSportsBadge(sport))}
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
                            {formatDateTime(user.lastLogin)}
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
                                  <DropdownMenuItem className="cursor-pointer text-amber-600">
                                    <UserCog className="h-4 w-4 mr-2" /> Remover Admin
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="cursor-pointer text-blue-600">
                                    <Shield className="h-4 w-4 mr-2" /> Promover a Admin
                                  </DropdownMenuItem>
                                )}
                                {user.status === 'blocked' ? (
                                  <DropdownMenuItem className="cursor-pointer text-green-600">
                                    <Shield className="h-4 w-4 mr-2" /> Desbloquear
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="cursor-pointer text-destructive">
                                    <ShieldAlert className="h-4 w-4 mr-2" /> Bloquear
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
            userData={MOCK_USERS.find(user => user.id === selectedUser)!}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default UsersList;
