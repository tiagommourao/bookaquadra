
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Court, CourtType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { CourtModal } from '@/components/admin/courts/CourtModal';

const CourtsList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  const { data: courts, isLoading, error, refetch } = useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data: courts, error } = await supabase
        .from('courts')
        .select('*, court_types(id, name, description)');
      
      if (error) throw error;
      
      return courts as (Court & { court_types: CourtType })[];
    }
  });

  const handleAddCourt = () => {
    setSelectedCourt(null);
    setIsModalOpen(true);
  };

  const handleEditCourt = (court: Court) => {
    setSelectedCourt(court);
    setIsModalOpen(true);
  };

  const handleDeleteCourt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('courts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Quadra excluída",
        description: "A quadra foi excluída com sucesso",
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao excluir quadra:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a quadra",
        variant: "destructive"
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    refetch();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Carregando quadras...</h1>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Erro ao carregar quadras</h1>
          </div>
          <p className="text-red-500">Erro: {(error as Error).message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quadras & Áreas</h1>
          <Button onClick={handleAddCourt}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Quadra
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quadras Cadastradas</CardTitle>
            <CardDescription>Gerencie as quadras e áreas disponíveis para reserva.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Superfície</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cobertura</TableHead>
                  <TableHead>Iluminação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courts && courts.length > 0 ? (
                  courts.map((court) => (
                    <TableRow key={court.id}>
                      <TableCell className="font-medium">{court.name}</TableCell>
                      <TableCell>{court.court_types?.name || 'Não especificado'}</TableCell>
                      <TableCell>{court.surface_type || 'Não especificado'}</TableCell>
                      <TableCell>
                        <Badge variant={court.is_active ? "default" : "outline"}>
                          {court.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={court.has_cover ? "default" : "outline"}>
                          {court.has_cover ? 'Sim' : 'Não'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={court.has_lighting ? "default" : "outline"}>
                          {court.has_lighting ? 'Sim' : 'Não'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCourt(court)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCourt(court.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Nenhuma quadra cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {isModalOpen && (
        <CourtModal
          court={selectedCourt}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </AdminLayout>
  );
};

export default CourtsList;
