
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CourtFormDrawer } from './CourtFormDrawer';
import { CourtDetailsDialog } from './CourtDetailsDialog';

interface Court {
  id: string;
  name: string;
  type: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

const CourtsPage = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const fetchCourts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }

      setCourts(data || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast({
        title: 'Erro ao buscar quadras',
        description: 'Não foi possível carregar a lista de quadras.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleCreate = () => {
    setSelectedCourt(null);
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const handleEdit = (court: Court) => {
    setSelectedCourt(court);
    setIsEditing(true);
    setIsDrawerOpen(true);
  };

  const handleView = (court: Court) => {
    setSelectedCourt(court);
    setIsDetailsOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('courts').delete().eq('id', id);

      if (error) {
        throw error;
      }

      setCourts(courts.filter(court => court.id !== id));
      toast({
        title: 'Quadra excluída',
        description: 'A quadra foi excluída com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting court:', error);
      toast({
        title: 'Erro ao excluir quadra',
        description: 'Não foi possível excluir a quadra. Verifique se não há horários ou reservas associados a ela.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = () => {
    setIsDrawerOpen(false);
    fetchCourts();
  };

  const getCourtTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'beach-tennis': 'Beach Tennis',
      'padel': 'Padel',
      'tennis': 'Tênis',
      'volleyball': 'Vôlei',
      'other': 'Outro'
    };
    
    return typeMap[type] || type;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quadras & Áreas</h1>
            <p className="text-muted-foreground">
              Gerencie as quadras e áreas disponíveis para reserva
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Quadra
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="opacity-70 animate-pulse">
                <CardHeader className="h-20 bg-muted" />
                <CardContent className="p-4">
                  <div className="h-4 w-2/3 bg-muted rounded mb-2" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </CardContent>
              </Card>
            ))
          ) : courts.length === 0 ? (
            <div className="col-span-full text-center p-8">
              <p className="text-muted-foreground mb-4">Nenhuma quadra cadastrada</p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Quadra
              </Button>
            </div>
          ) : (
            courts.map((court) => (
              <Card key={court.id} className={`overflow-hidden ${!court.is_active ? 'opacity-60' : ''}`}>
                <div 
                  className="h-32 bg-muted flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundImage: court.image_url ? `url(${court.image_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!court.image_url && (
                    <span className="text-muted-foreground">Sem imagem</span>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{court.name}</CardTitle>
                      <CardDescription>{getCourtTypeLabel(court.type)}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(court)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(court)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(court.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className={court.is_active ? "text-green-600 font-medium" : "text-muted-foreground"}>
                      {court.is_active ? "Ativa" : "Inativa"}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(court)}>
                      Gerenciar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {selectedCourt && (
          <CourtDetailsDialog 
            court={selectedCourt} 
            isOpen={isDetailsOpen} 
            onClose={() => setIsDetailsOpen(false)} 
          />
        )}

        <CourtFormDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
          court={isEditing ? selectedCourt : null} 
          onSubmitSuccess={handleFormSubmit}
        />
      </div>
    </AdminLayout>
  );
};

export default CourtsPage;
