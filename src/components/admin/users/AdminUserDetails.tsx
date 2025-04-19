
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { formatDate, formatDateTime, formatSportName, getDayName } from '@/lib/utils';
import { toast } from 'sonner';

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

// Adicionar uma interface explícita para UserData com propriedades opcionais
export interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;  // Tornar telefone opcional
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
  
  // Estados para dados carregados do banco
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [recentBookings, setRecentBookings] = useState<UserBooking[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [recognitions, setRecognitions] = useState<UserRecognition[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [userSportsDetails, setUserSportsDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Carregar dados do usuário do banco
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Buscar esportes do usuário
        const { data: userSports, error: sportsError } = await supabase
          .from('user_sports')
          .select(`
            id,
            notes,
            is_verified,
            verified_at,
            sport_type_id(id, name, icon),
            skill_level_id(id, name, description)
          `)
          .eq('user_id', userId);
          
        if (sportsError) throw sportsError;
        
        if (userSports) {
          setUserSportsDetails(userSports.map(sport => ({
            id: sport.id,
            name: sport.sport_type_id?.name || '',
            icon: sport.sport_type_id?.icon || '',
            skillLevel: sport.skill_level_id?.name || 'Iniciante',
            skillDescription: sport.skill_level_id?.description,
            isVerified: sport.is_verified,
            verifiedAt: sport.verified_at,
            notes: sport.notes
          })));
        }
          
        // Buscar preferências do usuário
        const { data: preferences, error: preferencesError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (preferencesError && preferencesError.code !== 'PGRST116') {
          throw preferencesError;
        }
          
        if (preferences) {
          setUserPreferences(preferences);
        }
        
        // Buscar conquistas do usuário
        const { data: userAchievements, error: achievementsError } = await supabase
          .from('user_achievements')
          .select(`
            id,
            earned_at,
            is_featured,
            achievement_type_id(id, name, description, icon, points)
          `)
          .eq('user_id', userId);
          
        if (achievementsError) throw achievementsError;
        
        if (userAchievements) {
          setAchievements(userAchievements.map(achievement => ({
            id: achievement.id,
            name: achievement.achievement_type_id?.name || '',
            description: achievement.achievement_type_id?.description || '',
            date: achievement.earned_at,
            icon: achievement.achievement_type_id?.icon || '🏆'
          })));
          
          setUserBadges(userAchievements.map(achievement => ({
            id: achievement.id,
            name: achievement.achievement_type_id?.name || '',
            description: achievement.achievement_type_id?.description || '',
            icon: achievement.achievement_type_id?.icon || '🏆',
            earnedAt: achievement.earned_at
          })));
        }
        
        // Buscar reservas do usuário
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            start_time,
            end_time,
            status,
            court_id(id, name)
          `)
          .eq('user_id', userId)
          .order('booking_date', { ascending: false })
          .limit(10);
          
        if (bookingsError) throw bookingsError;
        
        if (bookings) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          setRecentBookings(bookings.map(booking => {
            const bookingDate = new Date(booking.booking_date);
            bookingDate.setHours(0, 0, 0, 0);
            
            let bookingStatus: 'completed' | 'upcoming' | 'cancelled' = 'completed';
            
            if (booking.status === 'cancelled') {
              bookingStatus = 'cancelled';
            } else if (bookingDate >= today) {
              bookingStatus = 'upcoming';
            }
            
            return {
              id: booking.id,
              date: formatDate(booking.booking_date),
              time: `${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)}`,
              court: booking.court_id?.name || 'Quadra sem nome',
              status: bookingStatus
            };
          }));
        }
        
        // Buscar avaliações recebidas pelo usuário
        const { data: userRecognitions, error: recognitionsError } = await supabase
          .from('user_recognitions')
          .select(`
            id,
            comment,
            created_at,
            from_user_id(id, first_name, last_name),
            recognition_type_id(id, name, icon)
          `)
          .eq('to_user_id', userId);
          
        if (recognitionsError) throw recognitionsError;
        
        if (userRecognitions) {
          setRecognitions(userRecognitions.map(recognition => ({
            id: recognition.id,
            fromUser: `${recognition.from_user_id?.first_name || ''} ${recognition.from_user_id?.last_name || ''}`.trim(),
            type: recognition.recognition_type_id?.name || '',
            comment: recognition.comment,
            date: recognition.created_at
          })));
        }
        
      } catch (error: any) {
        console.error('Erro ao carregar dados do usuário:', error);
        toast.error('Falha ao carregar dados completos do usuário');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

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
  
  const getPreferredGameTypes = () => {
    if (!userPreferences?.preferred_game_types || userPreferences.preferred_game_types.length === 0) {
      return 'Não informado';
    }
    
    return userPreferences.preferred_game_types.map((type: string) => {
      switch (type) {
        case 'singles':
          return 'Individual';
        case 'doubles':
          return 'Duplas';
        case 'group':
          return 'Grupo';
        default:
          return type;
      }
    }).join(', ');
  };
  
  const getPreferredDays = () => {
    if (!userPreferences?.preferred_days || userPreferences.preferred_days.length === 0) {
      return 'Não informado';
    }
    
    return userPreferences.preferred_days
      .map((day: number) => getDayName(day))
      .join(', ');
  };
  
  const getPreferredTimes = () => {
    if (!userPreferences?.preferred_times) {
      return 'Não informado';
    }
    
    const times: string[] = [];
    
    if (userPreferences.preferred_times.morning) {
      times.push('Manhã');
    }
    
    if (userPreferences.preferred_times.afternoon) {
      times.push('Tarde');
    }
    
    if (userPreferences.preferred_times.evening) {
      times.push('Noite');
    }
    
    return times.length > 0 ? times.join(', ') : 'Não informado';
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
                      <div className="text-sm">{userData.phone || 'Não informado'}</div>
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
                        {userData.city && userData.neighborhood ? `${userData.city}/${userData.neighborhood}` : 'Não informado'}
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
                      <h4 className="text-md font-semibold mb-3">Badges e Conquistas</h4>
                      {userBadges.length > 0 ? (
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
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma conquista registrada
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-md font-semibold mb-3">Preferências</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-muted/30 rounded-md">
                          <div className="font-medium text-sm mb-2">Preferências de Jogo</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Tipos de Jogo Preferidos</div>
                              <div className="text-sm">{getPreferredGameTypes()}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Dias Preferidos</div>
                              <div className="text-sm">{getPreferredDays()}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Horários Preferidos</div>
                              <div className="text-sm">{getPreferredTimes()}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Receber notificações por e-mail</div>
                          <Switch checked={userPreferences?.wants_notifications || false} disabled />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Status do onboarding</div>
                          <Badge variant={userPreferences?.onboarding_completed ? "success" : "secondary"}>
                            {userPreferences?.onboarding_completed ? "Completo" : "Pendente"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Termos aceitos</div>
                          <Badge variant={userPreferences?.terms_accepted ? "success" : "secondary"}>
                            {userPreferences?.terms_accepted ? "Sim" : "Não"}
                          </Badge>
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
                          <div className="text-xl font-bold">{userBadges.length}</div>
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
