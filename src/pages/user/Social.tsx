
import React from 'react';
import { UserLayout } from '@/components/layouts/UserLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Medal, Star } from 'lucide-react';
import { AvatarFrame } from '@/components/gamification/AvatarFrame';
import { UserLevel } from '@/components/gamification/UserLevel';
import { Badge } from '@/components/gamification/Badge';
import { Button } from '@/components/ui/button';

// Mock data for the community page
const topPlayers = [
  { id: '1', name: 'Carlos Silva', level: 'gold', points: 1240, avatar: null, position: 1 },
  { id: '2', name: 'Maria Oliveira', level: 'gold', points: 1180, avatar: null, position: 2 },
  { id: '3', name: 'João Santos', level: 'silver', points: 930, avatar: null, position: 3 },
  { id: '4', name: 'Ana Pereira', level: 'silver', points: 850, avatar: null, position: 4 },
  { id: '5', name: 'Roberto Costa', level: 'silver', points: 790, avatar: null, position: 5 },
];

const recentAchievements = [
  { 
    id: '1', 
    userId: '101', 
    userName: 'Fernanda Lima', 
    level: 'bronze', 
    avatar: null,
    achievementName: 'Fair Play', 
    achievementIcon: <Star className="h-4 w-4" />,
    date: '2 horas atrás'
  },
  { 
    id: '2', 
    userId: '102', 
    userName: 'Pedro Alves', 
    level: 'silver', 
    avatar: null,
    achievementName: '10 Jogos', 
    achievementIcon: <Medal className="h-4 w-4" />,
    date: '5 horas atrás'
  },
  { 
    id: '3', 
    userId: '103', 
    userName: 'Juliana Martins', 
    level: 'bronze', 
    avatar: null,
    achievementName: 'Madrugador', 
    achievementIcon: <Trophy className="h-4 w-4" />,
    date: 'Ontem'
  },
];

const friends = [
  { id: '1', name: 'Marcos Souza', level: 'bronze', points: 450, avatar: null, isFollowing: true },
  { id: '2', name: 'Patrícia Mendes', level: 'silver', points: 720, avatar: null, isFollowing: true },
  { id: '3', name: 'Bruno Garcia', level: 'bronze', points: 380, avatar: null, isFollowing: false },
];

const Social = () => {
  return (
    <UserLayout>
      {/* Header */}
      <section className="bg-primary text-primary-foreground p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Comunidade</h1>
          <p className="mt-1 opacity-90">
            Veja rankings, conquistas e conecte-se com outros jogadores
          </p>
        </div>
      </section>
      
      <section className="p-4 pb-20">
        <div className="max-w-lg mx-auto space-y-6">
          <Tabs defaultValue="rankings">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="rankings">Rankings</TabsTrigger>
              <TabsTrigger value="achievements">Conquistas</TabsTrigger>
              <TabsTrigger value="friends">Amigos</TabsTrigger>
            </TabsList>
            
            {/* Rankings Tab */}
            <TabsContent value="rankings" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-primary" />
                        Top Jogadores
                      </CardTitle>
                      <CardDescription>
                        Jogadores com mais pontos este mês
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPlayers.map((player) => (
                      <div 
                        key={player.id} 
                        className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-semibold w-6 text-center">
                            {player.position === 1 && '🥇'}
                            {player.position === 2 && '🥈'}
                            {player.position === 3 && '🥉'}
                            {player.position > 3 && player.position}
                          </div>
                          <AvatarFrame
                            src={player.avatar || undefined}
                            fallback={player.name.charAt(0)}
                            frameType={player.level as any}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-sm">{player.name}</p>
                            <div className="flex items-center gap-1">
                              <UserLevel level={player.level as any} className="mt-1" />
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          {player.points} pts
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <Medal className="h-5 w-5 mr-2 text-primary" />
                    Conquistas Recentes
                  </CardTitle>
                  <CardDescription>
                    Últimas conquistas da comunidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAchievements.map((achievement) => (
                      <div 
                        key={achievement.id} 
                        className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <AvatarFrame
                            src={achievement.avatar || undefined}
                            fallback={achievement.userName.charAt(0)}
                            frameType={achievement.level as any}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-sm">{achievement.userName}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              Ganhou <span className="font-medium text-foreground mx-1">{achievement.achievementName}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge
                            name={achievement.achievementName}
                            icon={achievement.achievementIcon}
                            description={`Conquistado ${achievement.date}`}
                            size="sm"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {achievement.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Friends Tab */}
            <TabsContent value="friends" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Seus Amigos
                  </CardTitle>
                  <CardDescription>
                    Conecte-se e acompanhe seus amigos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {friends.length > 0 ? (
                    <div className="space-y-3">
                      {friends.map((friend) => (
                        <div 
                          key={friend.id} 
                          className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <AvatarFrame
                              src={friend.avatar || undefined}
                              fallback={friend.name.charAt(0)}
                              frameType={friend.level as any}
                              size="sm"
                            />
                            <div>
                              <p className="font-medium text-sm">{friend.name}</p>
                              <div className="flex items-center gap-1">
                                <UserLevel level={friend.level as any} className="mt-1" />
                                <span className="text-xs text-muted-foreground ml-2">
                                  {friend.points} pts
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <Button size="sm" variant={friend.isFollowing ? "outline" : "default"}>
                            {friend.isFollowing ? 'Seguindo' : 'Seguir'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                      <h3 className="font-medium text-lg mb-1">Nenhum amigo ainda</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Adicione amigos para ver as atividades deles
                      </p>
                      <Button>Encontrar Jogadores</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Sugestões para você</CardTitle>
                  <CardDescription>
                    Pessoas que você pode conhecer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <AvatarFrame
                          fallback="L"
                          frameType="bronze"
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-sm">Luciana Moreira</p>
                          <div className="text-xs text-muted-foreground">
                            5 jogos em comum
                          </div>
                        </div>
                      </div>
                      
                      <Button size="sm">Seguir</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <AvatarFrame
                          fallback="R"
                          frameType="silver"
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-sm">Ricardo Gomes</p>
                          <div className="text-xs text-muted-foreground">
                            2 amigos em comum
                          </div>
                        </div>
                      </div>
                      
                      <Button size="sm">Seguir</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </UserLayout>
  );
};

export default Social;
