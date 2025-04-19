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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AvatarFrame } from '@/components/gamification/AvatarFrame';
import { UserLevel } from '@/components/gamification/UserLevel';
import { 
  X, 
  Edit, 
  Mail, 
  UserCog, 
  Key, 
  ShieldAlert, 
  Shield, 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Pencil,
  Star,
  Trophy,
  PanelRight,
  Heart,
  Award,
} from 'lucide-react';

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
  status: string;
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

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  neighborhood: string;
  level: string;
  points: number;
  sports: string[];
  status: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
  avatarUrl: string | null;
  badges: string[];
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
  const { setAsAdmin, removeAdminRole, blockUser, unblockUser } = useAdminUsersData();

  const userBadges: UserBadge[] = [
    {
      id: '1',
      name: 'Fair Play',
      description: 'Reconhecido por 5 outros jogadores pelo seu fair play',
      icon: '🤝',
      earnedAt: '2024-03-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Maratonista',
      description: 'Jogou 10 partidas em um período de 30 dias',
      icon: '🏃',
      earnedAt: '2024-02-20T14:30:00Z',
    },
    {
      id: '3',
      name: 'Explorador',
      description: 'Jogou em 5 quadras diferentes',
      icon: '🧭',
      earnedAt: '2024-01-05T16:45:00Z',
    },
    {
      id: '4',
      name: 'Sazonalista',
      description: 'Edição Especial de Verão 2024',
      icon: '🏝️',
      earnedAt: '2024-01-15T11:20:00Z',
    },
  ];

  const recentBookings: UserBooking[] = [
    {
      id: '1',
      date: '15/04/2024',
      time: '09:00 - 10:00',
      court: 'Quadra de Padel 02',
      status: 'completed',
    },
    {
      id: '2',
      date: '10/04/2024',
      time: '16:00 - 17:00',
      court: 'Beach Tennis 01',
      status: 'completed',
    },
    {
      id: '3',
      date: '25/04/2024',
      time: '14:00 - 15:30',
      court: 'Tênis 03',
      status: 'upcoming',
    },
  ];

  const achievements: UserAchievement[] = [
    {
      id: '1',
      name: 'Subiu para Gold',
      description: 'Alcançou o nível Gold com 970 pontos',
      date: '2024-03-10T09:30:00Z',
      icon: '🏆',
    },
    {
      id: '2',
      name: '50 Jogos',
      description: 'Completou 50 jogos na plataforma',
      date: '2024-02-25T14:15:00Z',
      icon: '🎮',
    },
  ];

  const recognitions: UserRecognition[] = [
    {
      id: '1',
      fromUser: 'Carlos Oliveira',
      type: 'fairplay',
      comment: 'Excelente atitude durante o jogo, muito respeito!',
      date: '2024-04-10T16:30:00Z',
    },
    {
      id: '2',
      fromUser: 'Ana Ferreira',
      type: 'skills',
      comment: 'Técnica impressionante!',
      date: '2024-03-20T10:15:00Z',
    },
    {
      id: '3',
      fromUser: 'João Costa',
      type: 'teamwork',
      date: '2024-03-05T18:45:00Z',
    },
  ];

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

  const getSportLabel = (sport: string) => {
    switch (sport) {
      case 'tennis':
        return '🎾 Tênis';
      case 'padel':
        return '🏓 Padel';
      case 'beach':
        return '🏝️ Beach Tennis';
      default:
        return sport;
    }
  };

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

  const handleSetAdmin = async () => {
    await setAsAdmin.mutateAsync(userId);
  };

  const handleRemoveAdmin = async () => {
    await removeAdminRole.mutateAsync(userId);
  };

  const handleBlockUser = async () => {
    await blockUser.mutateAsync({ userId, reason: blockReason });
    setIsBlockDialogOpen(false);
    setBlockReason('');
  };

  const handleUnblockUser = async () => {
    await unblockUser.mutateAsync(userId);
  };

  return (
    <>
      {/* Block User Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Usuário</DialogTitle>
            <DialogDescription>
              Informe o motivo pelo qual você está bloqueando este usuário. Esta informação será registrada para fins administrativos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="block-reason">Motivo do Bloqueio</Label>
              <Textarea
                id="block-reason"
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

      {/* Main User Details Card */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column - Basic Info */}
            <div className="space-y-6">
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
                    {userData.status !== 'active' && (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                        {getStatusLabel(userData.status)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-semibold flex items-center gap-1">
                  <Mail className="h-4 w-4" /> Informações de Contato
                </h4>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">E-mail</Label>
                    {isEditMode ? (
                      <Input defaultValue={userData.email} />
                    ) : (
                      <div className="text-sm">{userData.email}</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                    {isEditMode ? (
                      <Input defaultValue={userData.phone} />
                    ) : (
                      <div className="text-sm">{userData.phone}</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Localização</Label>
                    {isEditMode ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Input defaultValue={userData.city} placeholder="Cidade" />
                        <Input defaultValue={userData.neighborhood} placeholder="Bairro" />
                      </div>
                    ) : (
                      <div className="text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> 
                        {userData.city}/{userData.neighborhood}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-semibold flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Informações do Sistema
                </h4>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Data de Cadastro</Label>
                    <div className="text-sm">{formatDateTime(userData.createdAt)}</div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Último Acesso</Label>
                    <div className="text-sm">{formatDateTime(userData.lastLogin)}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-md font-semibold mb-3 flex items-center gap-1">
                  <PanelRight className="h-4 w-4" /> Observação Administrativa
                </h4>
                
                <div className="space-y-2">
                  {isAdminNoteVisible ? (
                    <>
                      <Textarea
                        placeholder="Adicione uma observação sobre este usuário (visível apenas para administradores)..."
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
                      {adminNote ? adminNote : "Clique para adicionar uma observação sobre este usuário..."}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Esta observação é visível apenas para administradores.
                  </div>
                </div>
              </div>
            </div>

            {/* Center & Right columns - Tabs with more details */}
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
                        {userData.sports.map((sport) => (
                          <div key={sport} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-accent/50">{getSportLabel(sport)}</Badge>
                              <span className="text-sm">Nível Intermediário</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Desde {formatDate("2023-10-15")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-semibold mb-3">Badges e Conquistas</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {userBadges.map((badge) => (
                          <div key={badge.id} className="p-3 bg-muted/30 rounded-md">
                            <div className="flex items-center gap-2">
                              <div className="text-2xl">{badge.icon}</div>
                              <div>
                                <div className="font-medium text-sm">{badge.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(badge.earnedAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-semibold mb-3">Preferências</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Receber notificações por e-mail</div>
                          <Switch checked={true} />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Aparecer em rankings públicos</div>
                          <Switch checked={true} />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Disponível para jogo em grupo</div>
                          <Switch checked={false} />
                        </div>
                      </div>
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
                    </div>

                    <div>
                      <h4 className="text-md font-semibold mb-3">Estatísticas</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold">52</div>
                          <div className="text-xs text-muted-foreground">Jogos Totais</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold">7</div>
                          <div className="text-xs text-muted-foreground">Quadras Diferentes</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold">12</div>
                          <div className="text-xs text-muted-foreground">Badges Conquistadas</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold">8</div>
                          <div className="text-xs text-muted-foreground">Avaliações Positivas</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold">14</div>
                          <div className="text-xs text-muted-foreground">Parceiros Diferentes</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold">5</div>
                          <div className="text-xs text-muted-foreground">Meses de Atividade</div>
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
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-semibold mb-3">Resumo de Atividade</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold">12</div>
                          <div className="text-xs text-muted-foreground">Reservas no Último Mês</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold">R$ 580</div>
                          <div className="text-xs text-muted-foreground">Valor Total</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold">1</div>
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
                    </div>

                    <div>
                      <h4 className="text-md font-semibold mb-3">Resumo de Feedback</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold text-green-600">92%</div>
                          <div className="text-xs text-muted-foreground">Taxa de Aprovação</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold">8</div>
                          <div className="text-xs text-muted-foreground">Avaliações Recebidas</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-md text-center">
                          <div className="text-xl font-bold">2</div>
                          <div className="text-xs text-muted-foreground">Avaliações Enviadas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
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
