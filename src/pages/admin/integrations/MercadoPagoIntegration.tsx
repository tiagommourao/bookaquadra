
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle, Clock, History, RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MercadoPagoIntegrationForm } from '@/components/admin/integrations/MercadoPagoIntegrationForm';
import { MercadoPagoLogs } from '@/components/admin/integrations/MercadoPagoLogs';
import { MercadoPagoDocumentation } from '@/components/admin/integrations/MercadoPagoDocumentation';

// Tipos para integração com o Mercado Pago
interface MercadoPagoIntegration {
  id: string;
  name: string;
  environment: 'sandbox' | 'production';
  client_id: string | null;
  client_secret: string | null;
  access_token: string | null;
  public_key: string | null;
  webhook_url: string | null;
  status: 'active' | 'inactive';
  last_tested_at: string | null;
  last_test_success: boolean | null;
  test_result_message: string | null;
  created_at: string;
  updated_at: string;
}

const MercadoPagoIntegration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('settings');

  // Buscar integrações existentes
  const { data: integration, isLoading, error } = useQuery({
    queryKey: ['mercadopago-integration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations_mercadopago')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as MercadoPagoIntegration | null;
    }
  });

  // Mutação para testar a conexão
  const testConnectionMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase
        .rpc('test_mercadopago_integration', { integration_id: integrationId });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mercadopago-integration'] });
      
      if (data.success) {
        toast({
          title: "Conexão testada com sucesso",
          description: "As credenciais do Mercado Pago estão funcionando corretamente.",
          variant: "default",
        });
      } else {
        toast({
          title: "Falha no teste de conexão",
          description: data.message || "Verifique suas credenciais e tente novamente.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao testar conexão",
        description: error.message || "Ocorreu um erro ao testar a conexão com o Mercado Pago.",
        variant: "destructive",
      });
    },
  });

  // Função para testar a conexão
  const handleTestConnection = () => {
    if (integration?.id) {
      testConnectionMutation.mutate(integration.id);
    }
  };

  // Função para formatar data
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Renderizar status da integração
  const renderStatus = () => {
    if (!integration) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-500">
          Não configurada
        </Badge>
      );
    }

    if (integration.status === 'active' && integration.last_test_success) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Ativa
        </Badge>
      );
    }

    if (integration.status === 'inactive' || !integration.last_test_success) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertCircle className="w-3.5 h-3.5 mr-1" /> Inativa
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-500">
        <Clock className="w-3.5 h-3.5 mr-1" /> Pendente
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-64">
                <p>Carregando configurações do Mercado Pago...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-lg font-medium">Erro ao carregar dados</p>
                <p className="text-sm text-gray-500">
                  {(error as any).message || "Ocorreu um erro ao carregar as configurações do Mercado Pago."}
                </p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['mercadopago-integration'] })}
                  variant="outline" 
                  className="mt-4"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" /> Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">Integração Mercado Pago</h1>
          <p className="text-gray-500">
            Configure e gerencie as credenciais para integração com o Mercado Pago
          </p>
        </div>

        {/* Status da integração */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Status da integração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Estado atual:</p>
                {renderStatus()}
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Ambiente:</p>
                <Badge variant={integration?.environment === 'production' ? 'default' : 'outline'}>
                  {integration?.environment === 'production' ? 'Produção' : 'Sandbox'}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Último teste:</p>
                <span className="text-sm font-medium flex items-center">
                  {integration?.last_tested_at ? (
                    <>
                      {integration.last_test_success ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      {formatDate(integration.last_tested_at)}
                    </>
                  ) : (
                    'Nunca testado'
                  )}
                </span>
              </div>
              
              {integration?.id && (
                <div className="ml-auto">
                  <Button 
                    onClick={handleTestConnection} 
                    variant="outline"
                    disabled={testConnectionMutation.isPending}
                  >
                    {testConnectionMutation.isPending ? (
                      <>Testando...</>
                    ) : (
                      <>
                        <RefreshCcw className="w-4 h-4 mr-2" /> Testar conexão
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            {integration?.test_result_message && (
              <div className={`mt-4 p-3 rounded-md text-sm ${
                integration.last_test_success 
                  ? 'bg-green-50 text-green-700 border border-green-100' 
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                <p className="font-medium">
                  {integration.last_test_success ? 'Sucesso:' : 'Erro:'} {integration.test_result_message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="mb-2">
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="logs">
              <History className="w-4 h-4 mr-1" /> Histórico de alterações
            </TabsTrigger>
            <TabsTrigger value="docs">
              Documentação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 mt-2">
            <MercadoPagoIntegrationForm 
              existingIntegration={integration} 
            />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4 mt-2">
            <MercadoPagoLogs integrationId={integration?.id} />
          </TabsContent>

          <TabsContent value="docs" className="space-y-4 mt-2">
            <MercadoPagoDocumentation />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default MercadoPagoIntegration;
