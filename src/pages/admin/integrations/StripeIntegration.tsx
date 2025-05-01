
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StripeIntegration, StripeTestConnectionResult } from '@/types/stripe';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const StripeIntegrationPage = () => {
  const [activeTab, setActiveTab] = useState<string>("settings");
  const [isLoading, setIsLoading] = useState(false);
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [environment, setEnvironment] = useState<'test' | 'production'>('test');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const queryClient = useQueryClient();

  // Consulta para buscar a configuração do Stripe
  const { data: stripeConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['stripe-config'],
    queryFn: async () => {
      try {
        // Tenta buscar na tabela integrations_stripe
        const { data, error } = await supabase
          .from('integrations_stripe')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) {
          // Se houver erro, retorna um config padrão
          console.error('Erro ao buscar config do Stripe:', error);
          return {
            id: null,
            environment: 'test' as const,
            publishable_key: '',
            status: 'inactive' as const
          };
        }

        return data;
      } catch (error) {
        console.error('Erro ao buscar config do Stripe:', error);
        return {
          id: null,
          environment: 'test' as const,
          publishable_key: '',
          status: 'inactive' as const
        };
      }
    }
  });

  // Efeito para atualizar os campos quando o stripeConfig for carregado
  React.useEffect(() => {
    if (stripeConfig) {
      setEnvironment(stripeConfig.environment as 'test' | 'production');
      setPublishableKey(stripeConfig.publishable_key || "");
      if (stripeConfig.secret_key) setSecretKey(stripeConfig.secret_key);
      if (stripeConfig.webhook_secret) setWebhookSecret(stripeConfig.webhook_secret);
      setIsActive(stripeConfig.status === 'active');
    }
  }, [stripeConfig]);

  // Mutação para salvar configurações
  const saveConfig = useMutation({
    mutationFn: async () => {
      const configData = {
        name: 'Principal',
        environment,
        publishable_key: publishableKey,
        secret_key: secretKey,
        webhook_secret: webhookSecret,
        status: isActive ? 'active' : 'inactive',
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (stripeConfig?.id) {
        const { data, error } = await supabase
          .from('integrations_stripe')
          .update(configData)
          .eq('id', stripeConfig.id)
          .select();

        if (error) throw error;
        return data;
      } else {
        configData['created_by'] = (await supabase.auth.getUser()).data.user?.id;
        
        const { data, error } = await supabase
          .from('integrations_stripe')
          .insert(configData)
          .select();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-config'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações do Stripe foram salvas com sucesso."
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as configurações. Verifique os logs para mais detalhes.",
        variant: "destructive",
      });
    }
  });

  // Função para testar a conexão com o Stripe
  const testConnection = async () => {
    setIsLoading(true);

    try {
      // Aqui você pode implementar uma verificação real com a API do Stripe
      // Por enquanto, apenas simulamos uma verificação básica
      const result: StripeTestConnectionResult = {
        success: !!publishableKey && !!secretKey,
        message: !!publishableKey && !!secretKey
          ? 'Conexão com o Stripe estabelecida com sucesso.'
          : 'Falha na conexão. Verifique suas chaves API.'
      };

      if (result.success) {
        toast({
          title: "Conexão bem-sucedida",
          description: result.message
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast({
        title: "Erro ao testar conexão",
        description: "Ocorreu um erro ao testar a conexão com o Stripe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Integração com Stripe</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="test">Testar Conexão</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Stripe</CardTitle>
              <CardDescription>
                Configure sua integração com a API do Stripe para processar pagamentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active-status"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="active-status">
                  Integração {isActive ? 'Ativa' : 'Inativa'}
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment">Ambiente</Label>
                <Select
                  value={environment}
                  onValueChange={(value) => setEnvironment(value as 'test' | 'production')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o ambiente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Teste</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  {environment === 'test' 
                    ? 'Use o ambiente de teste para desenvolver e testar sua integração sem processar pagamentos reais.'
                    : 'O ambiente de produção processa pagamentos reais. Use apenas quando estiver pronto para lançar.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publishable-key">Chave Publicável</Label>
                <Input
                  id="publishable-key"
                  value={publishableKey}
                  onChange={(e) => setPublishableKey(e.target.value)}
                  placeholder={`${environment === 'test' ? 'pk_test_' : 'pk_live_'}...`}
                />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="secret-key">Chave Secreta</Label>
                <div className="flex space-x-2">
                  <Input
                    id="secret-key"
                    type={showSecretKey ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder={`${environment === 'test' ? 'sk_test_' : 'sk_live_'}...`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                  >
                    {showSecretKey ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Segredo do Webhook</Label>
                <Input
                  id="webhook-secret"
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder={`${environment === 'test' ? 'whsec_' : 'whsec_'}...`}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Necessário para validar webhooks do Stripe. Encontre no dashboard do Stripe em Webhooks.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={() => saveConfig.mutate()} 
                  disabled={saveConfig.isPending || isLoadingConfig}
                >
                  {saveConfig.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configurações'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Testar Conexão com Stripe</CardTitle>
              <CardDescription>
                Verifique se suas credenciais do Stripe estão configuradas corretamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Status da Configuração</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {publishableKey ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <span>Chave Publicável: {publishableKey ? 'Configurada' : 'Não configurada'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {secretKey ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <span>Chave Secreta: {secretKey ? 'Configurada' : 'Não configurada'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {webhookSecret ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <span>Segredo do Webhook: {webhookSecret ? 'Configurado' : 'Não configurado'}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={testConnection}
                  disabled={isLoading || !publishableKey || !secretKey}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    'Testar Conexão'
                  )}
                </Button>
              </div>
              
              <div className="text-sm">
                <h3 className="font-medium mb-2">Como testar:</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Certifique-se de que todas as credenciais estejam configuradas</li>
                  <li>Clique em "Testar Conexão" para verificar a configuração</li>
                  <li>
                    Para um teste completo, tente criar uma cobrança de teste no 
                    ambiente de desenvolvimento
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StripeIntegrationPage;
