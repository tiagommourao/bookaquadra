
import React from 'react';
import { UserLayout } from '@/components/layouts/UserLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, LogOut, Users, Trophy, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AvatarFrame } from '@/components/gamification/AvatarFrame';
import { UserLevel } from '@/components/gamification/UserLevel';
import { BadgesGrid } from '@/components/gamification/BadgesGrid';
import { NextAchievement } from '@/components/gamification/NextAchievement';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Mock gamification data (would come from API in real app)
  const userLevel = 'silver';
  const userPoints = 780;
  const frameType = 'silver';
  
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
          {/* Profile Card with Gamification */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Suas informações de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <AvatarFrame
                    src={user?.avatarUrl} 
                    fallback={user?.name || 'U'} 
                    frameType={frameType as any}
                    size="lg"
                  />
                  
                  <div className="mt-2 text-center">
                    <UserLevel level={userLevel as any} points={userPoints} />
                  </div>
                </div>
                
                <div className="flex-1 space-y-1 text-center sm:text-left mt-2 sm:mt-0">
                  <h3 className="font-medium text-lg">{user?.name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => navigate('/social')}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Social
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => navigate('/rankings')}
                    >
                      <Trophy className="h-3 w-3 mr-1" />
                      Rankings
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Badges/Achievements Section */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 flex items-center">
                  <Trophy className="h-4 w-4 mr-1 text-primary" />
                  Minhas Conquistas
                </h4>
                
                <BadgesGrid maxDisplay={8} />
                
                <div className="mt-3">
                  <NextAchievement 
                    name="Próxima conquista: Explorador"
                    description="Jogue em 3 quadras diferentes (2/3)"
                    progress={66}
                  />
                </div>
              </div>
              
              <Separator className="my-6" />
              
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
                
                {/* Gamification notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Conquistas e Níveis</Label>
                    <p className="text-sm text-gray-500">Notificações sobre novas conquistas e subida de nível</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Atividades Sociais</Label>
                    <p className="text-sm text-gray-500">Notificações sobre rankings e conquistas da comunidade</p>
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
                  onClick={() => navigate('/social')}
                >
                  <span className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Amizades e Social
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                  onClick={() => navigate('/rankings')}
                >
                  <span className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-primary" />
                    Rankings e Conquistas
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                
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
