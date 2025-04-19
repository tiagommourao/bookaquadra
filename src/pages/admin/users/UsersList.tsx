
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FilterIcon, Download, Mail, UserX } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AdminUsersFilter } from '@/components/admin/users/AdminUsersFilter';
import { AdminUserDetails } from '@/components/admin/users/AdminUserDetails';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { toast } from 'sonner';

const UsersList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<any>({});

  const {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    blockUser,
    unblockUser,
    updateUser,
    exportUsers
  } = useAdminUsers();

  useEffect(() => {
    fetchUsers(1, 10, {
      search: searchQuery,
      status: selectedStatus !== 'all' ? [selectedStatus] : undefined
    });
  }, [searchQuery, selectedStatus]);

  // Toggle selection of a user for batch operations
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Toggle selection of all visible users
  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  // Show user details panel
  const showUserDetails = (userId: string) => {
    setSelectedUser(userId);
  };

  // Close user details panel
  const closeUserDetails = () => {
    setSelectedUser(null);
  };
  
  // Handle apply filters
  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    fetchUsers(1, 10, {
      ...newFilters,
      search: searchQuery,
      status: selectedStatus !== 'all' ? [selectedStatus] : undefined
    });
    setIsFilterOpen(false);
  };

  // Handle export
  const handleExport = async () => {
    const csvData = await exportUsers();
    if (csvData) {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h3 className="text-xl font-semibold text-red-600 mb-2">
            Erro ao carregar usuários
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchUsers()}>Tentar novamente</Button>
        </div>
      </AdminLayout>
    );
  }

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
              {/* Search and filter controls */}
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
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                
                <ToggleGroup 
                  type="single" 
                  value={selectedStatus} 
                  onValueChange={(value) => value && setSelectedStatus(value)}
                >
                  <ToggleGroupItem value="all">Todos</ToggleGroupItem>
                  <ToggleGroupItem value="active">Ativos</ToggleGroupItem>
                  <ToggleGroupItem value="blocked">Bloqueados</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {isFilterOpen && (
                <AdminUsersFilter
                  onClose={() => setIsFilterOpen(false)}
                  onApply={handleApplyFilters}
                />
              )}

              {/* Batch actions */}
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <span className="text-sm font-medium">
                    {selectedUsers.length} usuários selecionados
                  </span>
                  <div className="flex-grow" />
                  <Button size="sm" variant="outline">
                    <Mail className="mr-2 h-4 w-4" /> Enviar Mensagem
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-destructive hover:text-destructive"
                  >
                    <UserX className="mr-2 h-4 w-4" /> Bloquear
                  </Button>
                </div>
              )}

              {/* Users table */}
              <UsersTable
                users={users}
                selectedUsers={selectedUsers}
                onToggleUserSelection={toggleUserSelection}
                onToggleSelectAll={toggleSelectAll}
                onShowUserDetails={showUserDetails}
              />
            </div>
          </CardContent>
        </Card>

        {/* User details component */}
        {selectedUser && (
          <AdminUserDetails 
            userId={selectedUser} 
            onClose={closeUserDetails}
            userData={{
              ...users.find(u => u.id === selectedUser)!,
              isAdmin: users.find(u => u.id === selectedUser)?.role === 'admin'
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default UsersList;
