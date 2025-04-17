
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, RefreshCcw, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MercadoPagoLogsProps {
  integrationId: string | undefined;
}

export const MercadoPagoLogs: React.FC<MercadoPagoLogsProps> = ({ integrationId }) => {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['mercadopago-logs', integrationId],
    queryFn: async () => {
      if (!integrationId) return [];

      const { data, error } = await supabase
        .from('integrations_mercadopago_logs')
        .select(`
          id,
          action,
          details,
          created_at
        `)
        .eq('integration_id', integrationId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!integrationId,
  });

  // Função para formatar data
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  // Função para obter ícone e cor da ação
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return { icon: <PlusCircle className="h-3.5 w-3.5 mr-1" />, color: 'bg-green-50 text-green-700 border-green-200' };
      case 'update':
        return { icon: <Edit className="h-3.5 w-3.5 mr-1" />, color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'test_connection':
        return { icon: <RefreshCcw className="h-3.5 w-3.5 mr-1" />, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'delete':
        return { icon: <Trash2 className="h-3.5 w-3.5 mr-1" />, color: 'bg-red-50 text-red-700 border-red-200' };
      default:
        return { icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />, color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  // Função para mapear ações para texto em português
  const getActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      'create': 'Criação',
      'update': 'Atualização',
      'test_connection': 'Teste de conexão',
      'delete': 'Exclusão',
    };

    return actionMap[action] || action;
  };

  // Função para formatar os detalhes
  const formatDetails = (details: any) => {
    if (!details) return '-';

    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch (e) {
        return details;
      }
    }

    if (details.success !== undefined) {
      // Caso de teste de conexão
      return details.message || (details.success ? 'Sucesso' : 'Falha');
    }

    // Para outros tipos de detalhes, mostrar como lista de chave: valor
    return Object.entries(details)
      .filter(([_, value]) => value !== null)
      .map(([key, value]) => {
        if (key === 'name') return `Nome: ${value}`;
        if (key === 'environment') return `Ambiente: ${value === 'production' ? 'Produção' : 'Sandbox'}`;
        if (key === 'status') return `Status: ${value === 'active' ? 'Ativo' : 'Inativo'}`;
        if (key === 'webhook_url') return `URL Webhook atualizada`;
        return `${key}: ${value}`;
      })
      .join(', ') || '-';
  };

  if (!integrationId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <p className="text-muted-foreground">Salve uma configuração para visualizar o histórico de alterações</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <p>Carregando histórico...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Erro ao carregar o histórico</p>
            <p className="text-sm text-muted-foreground mt-2">
              {(error as any).message || "Ocorreu um erro ao carregar o histórico de alterações."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!logs?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <p className="text-muted-foreground">Nenhum registro de alteração encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de alterações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const { icon, color } = getActionBadge(log.action);
                
                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={color}>
                        {icon}
                        {getActionText(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {formatDetails(log.details)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
