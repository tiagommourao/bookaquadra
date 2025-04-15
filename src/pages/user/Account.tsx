
import React from 'react';
import { UserLayout } from '@/components/layouts/UserLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Account = () => {
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <UserLayout>
      {/* Header */}
      <section className="bg-primary text-primary-foreground p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Minha Conta</h1>
          <p className="mt-1 opacity-90">
            Gerencie suas informações e preferências
          </p>
        </div>
      </section>
      
      <section className="p-4 pb-20">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Suas informações de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{user?.name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={user?.name} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="Adicione seu número de telefone" />
                </div>
                
                <Button>Atualizar Perfil</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure como você deseja ser notificado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Email</Label>
                    <p className="text-sm text-gray-500">Receba lembretes por email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Eventos no Google Calendar</Label>
                    <p className="text-sm text-gray-500">Adicionar reservas ao seu calendário</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Lembretes de pagamento</Label>
                    <p className="text-sm text-gray-500">Receba lembretes sobre pagamentos pendentes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Additional Links */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  onClick={() => window.location.href = '/pagamentos'}
                >
                  <span>Histórico de pagamentos</span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  onClick={() => window.location.href = '/ajuda'}
                >
                  <span>Ajuda e Suporte</span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  onClick={() => window.location.href = '/termos'}
                >
                  <span>Termos e Condições</span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                
                <button
                  className="w-full flex items-center justify-between p-4 text-left text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <span className="flex items-center">
                    <LogOut className="h-5 w-5 mr-2" />
                    Sair
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </UserLayout>
  );
};

export default Account;
