
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Edit, Mail, UserCog, Key, ShieldAlert, Shield, Calendar, Clock, X, Trophy, Heart } from 'lucide-react';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { UserProfileSection } from './details/UserProfileSection';
import { UserContactInfo } from './details/UserContactInfo';
import { AdminNoteSection } from './details/AdminNoteSection';
import { AdminUserData } from '@/types/admin';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserLevel } from '@/components/gamification/UserLevel';

interface AdminUserDetailsProps {
  userId: string;
  onClose: () => void;
  userData: AdminUserData;
}

export const AdminUserDetails = ({ userId, onClose, userData }: AdminUserDetailsProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isAdminNoteVisible, setIsAdminNoteVisible] = useState(false);
  const { setAsAdmin, removeAdminRole, blockUser, unblockUser } = useAdminUsers();

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

  const handleSetAdmin = async () => {
    await setAsAdmin(userId);
  };

  const handleRemoveAdmin = async () => {
    await removeAdminRole(userId);
  };

  const handleBlockUser = async () => {
    await blockUser({ userId, reason: blockReason });
    setIsBlockDialogOpen(false);
    setBlockReason('');
  };

  return (
    <>
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
            <div className="space-y-6">
              <UserProfileSection userData={userData} />
              <UserContactInfo userData={userData} isEditMode={isEditMode} />
              <AdminNoteSection
                adminNote={adminNote}
                isAdminNoteVisible={isAdminNoteVisible}
                onAdminNoteChange={setAdminNote}
                onAdminNoteVisibilityChange={setIsAdminNoteVisible}
              />
            </div>

            <div className="col-span-2">
              <Tabs defaultValue="profile">
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Perfil</TabsTrigger>
                  <TabsTrigger value="achievements">Conquistas</TabsTrigger>
                  <TabsTrigger value="bookings">Reservas</TabsTrigger>
                  <TabsTrigger value="recognition">Avaliações</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-semibold mb-3">Modalidades Esportivas</h4>
                      <div className="space-y-3">
                        {/*{userData.sports.map((sport) => (
                          <div key={sport} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-accent/50">{getSportLabel(sport)}</Badge>
                              <span className="text-sm">Nível Intermediário</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Desde {formatDate("2023-10-15")}
                            </div>
                          </div>
                        ))}*/}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-semibold mb-3">Badges e Conquistas</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {userData.badges.map((badge) => (
                          <div key={badge.name} className="p-3 bg-muted/30 rounded-md">
                            <div className="flex items-center gap-2">
                              <div className="text-2xl">{badge.icon}</div>
                              <div>
                                <div className="font-medium text-sm">{badge.name}</div>
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
                
                <TabsContent value="bookings">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-semibold mb-3">Próximas Reservas</h4>
                      <div className="space-y-3">
                        
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
                
                <TabsContent value="recognition">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-semibold mb-3 flex items-center gap-1">
                        <Heart className="h-4 w-4" /> Avaliações Recebidas
                      </h4>
                      <div className="space-y-3">
                        
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

