import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { Court, CourtType } from '@/types';

const CourtsList = () => {
  const { data: courts, isLoading } = useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select(`
          *,
          court_types (id, name, description)
        `)
        .order('name');

      if (error) throw error;
    
      // Converter explicitamente para o tipo correto
      return data as unknown as (Court & { court_types: CourtType })[];
    }
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold">Lista de Quadras</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Quadra
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ativa</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : (
              courts?.map((court) => (
                <TableRow key={court.id}>
                  <TableCell className="font-medium">{court.id}</TableCell>
                  <TableCell>{court.name}</TableCell>
                  <TableCell>{court.court_types?.name || 'N/A'}</TableCell>
                  <TableCell>{court.is_active ? 'Sim' : 'Não'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CourtsList;
