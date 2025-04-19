import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, 
  Edit, 
  Mail, 
  UserCog, 
  Shield, 
  ShieldAlert,
  Calendar,
  Trophy,
  Heart,
  Award
} from 'lucide-react';
import { formatDate, formatDateTime, formatSportName } from '@/lib/utils';
import { UserProfileHeader } from './components/UserProfileHeader';
import { UserContactInfo } from './components/UserContactInfo';
import { UserPreferences } from './components/UserPreferences';
import { useUserDetails } from './hooks/useUserDetails';
import { UserLevel } from '@/components/gamification/UserLevel';

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

interface UserBooking {
  id: string;
  date: string;
  time: string;
  court: string;
  status: 'completed' | 'upcoming' | 'cancelled';
}

interface UserAchievement {
  id: string;
  name: string;
  description: string;
  date: string;
  icon: string;
}

interface UserRecognition {
  id: string;
  fromUser: string;
  type: string;
  comment?: string;
  date: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  neighborhood?: string;
  level: string;
  points: number;
  sports: string[];
  status: 'active' | 'blocked' | 'suspended';
  avatarUrl?: string;
  badges?: string[];
  lastLogin?: string | Date;
  createdAt: string;
  isAdmin: boolean;
}

interface AdminUserDetailsProps {
  userId: string;
  onClose: () => void;
  userData: UserData;
}

export const AdminUserDetails = ({ userId, onClose, userData }: AdminUserDetailsProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isAdminNoteVisible, setIsAdminNoteVisible] = useState(false);
  
  const {
    userSportsDetails,
    userPreferences,
    achievements,
    recognitions,
    recentBookings,
    loading
  } = useUserDetails(userId);

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Concluída</Badge>;
      case 'upcoming':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Agendada</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRecognitionTypeLabel = (type: string) => {
    switch (type) {
      case 'fairplay':
        return '🤝 Fair Play';
      case 'skills':
        return '🎯 Habilidade';
      case 'teamwork':
        return '👥 Trabalho em Equipe';
      default:
        return type;
    }
  };

  return (
    <>
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Usuário</DialogTitle>
            <DialogDescription>
              Informe o motivo pelo qual você está bloqueando este usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Textarea
                placeholder="Descreva o motivo do bloqueio..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => setIsBlockDialogOpen(false)}>
              Confirmar Bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                Detalhes do Usuário
                {userData.isAdmin && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Informações completas e gerenciamento do usuário
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Carregando dados do usuário...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left column - Basic Info */}
              <div className="space-y-6">
                <UserProfileHeader userData={userData} />
                <UserContactInfo userData={userData} isEditMode={isEditMode} />

                <div className="space-y-4">
                  <h4 className="text-md font-semibold flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Informações do Sistema
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Data de Cadastro</div>
                      <div className="text-sm">{formatDateTime(userData.createdAt)}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Último Acesso</div>
                      <div className="text-sm">{formatDateTime(userData.lastLogin)}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-md font-semibold mb-3">Observação Administrativa</h4>
                  <div className="space-y-2">
                    {isAdminNoteVisible ? (
                      <>
                        <Textarea
                          placeholder="Adicione uma observação sobre este usuário..."
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button size="sm" variant="outline" onClick={() => setIsAdminNoteVisible(false)}>
                            Salvar Observação
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div 
                        className="text-sm p-3 bg-muted/50 rounded-md min-h-[80px] cursor-pointer hover:bg-muted"
                        onClick={() => setIsAdminNoteVisible(true)}
                      >
                        {adminNote ? adminNote : "Clique para adicionar uma observação..."}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Center & Right columns - Tabs */}
              <div className="col-span-2">
                <Tabs defaultValue="profile">
                  <TabsList className="mb-4">
                    <TabsTrigger value="profile">Perfil</TabsTrigger>
                    <TabsTrigger value="achievements">Conquistas</TabsTrigger>
                    <TabsTrigger value="bookings">Reservas</TabsTrigger>
                    <TabsTrigger value="recognition">Avaliações</TabsTrigger>
                  </TabsList>
                  
                  {/* Profile Tab */}
                  <TabsContent value="profile">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-md font-semibold mb-3">Modalidades Esportivas</h4>
                        <div className="space-y-3">
                          {userSportsDetails.length > 0 ? (
                            userSportsDetails.map((sport) => (
                              <div key={sport.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-accent/50">
                                    {formatSportName(sport.name)}
                                  </Badge>
                                  <span className="text-sm">Nível {sport.skillLevel}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {sport.isVerified && (
                                    <Badge variant="secondary" className="text-xs">Verificado</Badge>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              Nenhuma modalidade esportiva registrada
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-md font-semibold mb-3">Preferências</h4>
                        <UserPreferences userPreferences={userPreferences} />
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Achievements Tab */}
                  <TabsContent value="achievements">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-md font-semibold mb-3 flex items-center gap-1">
                          <Trophy className="h-4 w-4" /> Progresso e Níveis
                        </h4>
                        <div className="p-4 bg-muted/30 rounded-md">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <UserLevel level={userData.level as any} showDetails />
                              <div className="text-sm mt-1">{userData.points} pontos</div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Próximo nível: Legend (1500 pontos)
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-md font-semibold mb-3">Marcos Importantes</h4>
                        {achievements.length > 0 ? (
                          <div className="space-y-3">
                            {achievements.map((achievement) => (
                              <div key={achievement.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl">{achievement.icon}</div>
                                  <div>
                                    <div className="font-medium">{achievement.name}</div>
                                    <div className="text-xs text-muted-foreground">{achievement.description}</div>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDate(achievement.date)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            Nenhum marco importante registrado
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-md font-semibold mb-3">Estatísticas</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="text-xl font-bold">{recentBookings.filter(b => b.status === 'completed').length}</div>
                            <div className="text-xs text-muted-foreground">Jogos Totais</div>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="text-xl font-bold">{new Set(recentBookings.map(b => b.court)).size}</div>
                            <div className="text-xs text-muted-foreground">Quadras Diferentes</div>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="text-xl font-bold">{achievements.length}</div>
                            <div className="text-xs text-muted-foreground">Badges Conquistadas</div>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="text-xl font-bold">{recognitions.length}</div>
                            <div className="text-xs text-muted-foreground">Avaliações Recebidas</div>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="text-xl font-bold">{userSportsDetails.length}</div>
                            <div className="text-xs text-muted-foreground">Modalidades Praticadas</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Bookings Tab */}
                  <TabsContent value="bookings">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-md font-semibold mb-3">Próximas Reservas</h4>
                        <div className="space-y-3">
                          {recentBookings.filter(b => b.status === 'upcoming').map((booking) => (
                            <div key={booking.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                              <div>
                                <div className="font-medium">{booking.court}</div>
                                <div className="text-sm text-muted-foreground">
                                  {booking.date}, {booking.time}
                                </div>
                              </div>
                              {getBookingStatusBadge(booking.status)}
                            </div>
                          ))}
                          {recentBookings.filter(b => b.status === 'upcoming').length === 0 && (
                            <div className="text-sm text-muted-foreground text-center p-4">
                              Não há reservas futuras.
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-md font-semibold">Histórico de Reservas</h4>
                          <Button variant="ghost" size="sm">
                            Ver todas
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {recentBookings.filter(b => b.status !== 'upcoming').map((booking) => (
                            <div key={booking.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                              <div>
                                <div className="font-medium">{booking.court}</div>
                                <div className="text-sm text-muted-foreground">
                                  {booking.date}, {booking.time}
                                </div>
                              </div>
                              {getBookingStatusBadge(booking.status)}
                            </div>
                          ))}
                          {recentBookings.filter(b => b.status !== 'upcoming').length === 0 && (
                            <div className="text-sm text-muted-foreground text-center p-4">
                              Nenhuma reserva passada encontrada.
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-md font-semibold mb-3">Resumo de Atividade</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="text-xl font-bold">{recentBookings.length}</div>
                            <div className="text-xs text-muted-foreground">Total de Reservas</div>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="text-xl font-bold">{recentBookings.filter(b => b.status === 'upcoming').length}</div>
                            <div className="text-xs text-muted-foreground">Agendadas</div>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="text-xl font-bold">{recentBookings.filter(b => b.status === 'cancelled').length}</div>
                            <div className="text-xs text-muted-foreground">Cancelamentos</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Recognition Tab */}
                  <TabsContent value="recognition">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-md font-semibold mb-3 flex items-center gap-1">
                          <Heart className="h-4 w-4" /> Avaliações Recebidas
                        </h4>
                        {recognitions.length > 0 ? (
                          <div className="space-y-3">
                            {recognitions.map((recognition) => (
                              <div key={recognition.id} className="p-3 bg-muted/30 rounded-md">
                                <div className="flex justify-between mb-2">
                                  <div className="font-medium text-sm flex items-center gap-1">
                                    <Award className="h-3 w-3" />
                                    {getRecognitionTypeLabel(recognition.type)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(recognition.date)}
                                  </div>
                                </div>
                                <div className="text-sm">De: <span className="font-medium">{recognition.fromUser}</span></div>
                                {recognition.comment && (
                                  <div className="text-sm text-muted-foreground mt-1 italic">
                                    "{recognition.comment}"
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma avaliação recebida
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-md font-semibold mb-3">Resumo de Feedback</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="text-xl font-bold text-green-600">
                              {recognitions.length > 0 ? '100%' : '-'}
                            </div>
                            <div className="text-xs text-muted-foreground">Taxa de Aprovação</div>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="text-xl font-bold">{recognitions.length}</div>
                            <div className="text-xs text-muted-foreground">Avaliações Recebidas</div>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="text-xl font-bold">-</div>
                            <div className="text-xs text-muted-foreground">Avaliações Enviadas</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t bg-muted/50 flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditMode(!isEditMode)}>
              <Edit className="mr-2 h-4 w-4" /> {isEditMode ? 'Salvar Alterações' : 'Editar Usuário'}
            </Button>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Enviar Mensagem
            </Button>
          </div>

          <div className="flex gap-2">
            {userData.status === 'blocked' ? (
              <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                <Shield className="mr-2 h-4 w-4" /> Desbloquear
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="text-destructive border-red-200 hover:bg-red-50"
                onClick={() => setIsBlockDialogOpen(true)}
              >
                <ShieldAlert className="mr-2 h-4 w-4" /> Bloquear
              </Button>
            )}
            
            {userData.isAdmin ? (
              <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                <UserCog className="mr-2 h-4 w-4" /> Remover Admin
              </Button>
            ) : (
              <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <UserCog className="mr-2 h-4 w-4" /> Promover a Admin
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </>
  );
};
