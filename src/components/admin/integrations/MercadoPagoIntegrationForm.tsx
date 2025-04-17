
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Copy, Eye, EyeOff, HelpCircle, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Schema para validação do formulário
const mercadoPagoIntegrationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  environment: z.enum(['sandbox', 'production']),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  access_token: z.string().optional(),
  public_key: z.string().optional(),
  webhook_url: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type MercadoPagoIntegrationFormValues = z.infer<typeof mercadoPagoIntegrationSchema>;

interface MercadoPagoIntegrationFormProps {
  existingIntegration: any | null;
}

export const MercadoPagoIntegrationForm: React.FC<MercadoPagoIntegrationFormProps> = ({
  existingIntegration,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  // Configurar react-hook-form
  const form = useForm<MercadoPagoIntegrationFormValues>({
    resolver: zodResolver(mercadoPagoIntegrationSchema),
    defaultValues: existingIntegration ? {
      name: existingIntegration.name || 'Principal',
      environment: existingIntegration.environment || 'sandbox',
      client_id: existingIntegration.client_id || '',
      client_secret: existingIntegration.client_secret || '',
      access_token: existingIntegration.access_token || '',
      public_key: existingIntegration.public_key || '',
      webhook_url: existingIntegration.webhook_url || '',
      status: existingIntegration.status || 'inactive',
    } : {
      name: 'Principal',
      environment: 'sandbox',
      client_id: '',
      client_secret: '',
      access_token: '',
      public_key: '',
      webhook_url: '',
      status: 'inactive',
    },
  });

  // Toggle para mostrar/ocultar campos sensíveis
  const toggleShowSecret = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Copiar texto para a área de transferência
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado com sucesso",
      description: `${fieldName} foi copiado para a área de transferência.`,
      variant: "default",
    });
  };

  // Mutação para salvar a integração
  const saveMutation = useMutation({
    mutationFn: async (values: MercadoPagoIntegrationFormValues) => {
      if (existingIntegration?.id) {
        // Atualizar integração existente
        const { data, error } = await supabase
          .from('integrations_mercadopago')
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingIntegration.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        // Criar nova integração
        const { data, error } = await supabase
          .from('integrations_mercadopago')
          .insert([values])
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mercadopago-integration'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações do Mercado Pago foram salvas com sucesso.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações do Mercado Pago.",
        variant: "destructive",
      });
    },
  });

  // Função para submeter o formulário
  const onSubmit = (values: MercadoPagoIntegrationFormValues) => {
    saveMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Mercado Pago</CardTitle>
            <CardDescription>
              Configure as credenciais e parâmetros para integração com o Mercado Pago.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nome da integração */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da integração</FormLabel>
                  <FormControl>
                    <Input placeholder="Principal" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome para identificar esta configuração (ex: "Mercado Pago - Principal")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ambiente */}
            <FormField
              control={form.control}
              name="environment"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Ambiente</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="sandbox" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Sandbox (Teste)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="production" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Produção
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Selecione "Sandbox" para testes ou "Produção" para transações reais
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client ID */}
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Client ID
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground ml-2 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-80">
                            O Client ID é fornecido no painel do Mercado Pago e é usado para identificar sua aplicação.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showSecrets.client_id ? "text" : "password"}
                        placeholder="Client ID do Mercado Pago"
                        {...field}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                          type="button"
                          onClick={() => toggleShowSecret('client_id')}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showSecrets.client_id ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Disponível no painel de aplicações do Mercado Pago
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client Secret */}
            <FormField
              control={form.control}
              name="client_secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Client Secret
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground ml-2 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-80">
                            O Client Secret é usado em conjunto com o Client ID para autenticar sua aplicação.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showSecrets.client_secret ? "text" : "password"}
                        placeholder="Client Secret do Mercado Pago"
                        {...field}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                          type="button"
                          onClick={() => toggleShowSecret('client_secret')}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showSecrets.client_secret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Disponível no painel de aplicações do Mercado Pago
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Access Token */}
            <FormField
              control={form.control}
              name="access_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Access Token
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground ml-2 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-80">
                            O Access Token é usado para autenticar chamadas à API do Mercado Pago. Mantenha este token seguro.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showSecrets.access_token ? "text" : "password"}
                        placeholder="Access Token do Mercado Pago"
                        {...field}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                          type="button"
                          onClick={() => toggleShowSecret('access_token')}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none mr-2"
                        >
                          {showSecrets.access_token ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Token de acesso para a API do Mercado Pago (escolha o token correspondente ao ambiente selecionado)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Public Key */}
            <FormField
              control={form.control}
              name="public_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Public Key
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground ml-2 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-80">
                            A Public Key é usada para inicializar o SDK do Mercado Pago no frontend.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showSecrets.public_key ? "text" : "password"}
                        placeholder="Public Key do Mercado Pago"
                        {...field}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                          type="button"
                          onClick={() => toggleShowSecret('public_key')}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showSecrets.public_key ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Chave pública para uso no frontend (escolha a chave correspondente ao ambiente selecionado)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Webhook URL */}
            <FormField
              control={form.control}
              name="webhook_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    URL para Webhook
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground ml-2 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-80">
                            URL para onde o Mercado Pago enviará notificações sobre pagamentos.
                            Você precisa configurar esta URL no painel do Mercado Pago.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="https://seu-site.com/webhook/mercadopago"
                        {...field}
                      />
                      {field.value && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(field.value, 'URL do Webhook')}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Configure esta URL no painel do Mercado Pago para receber notificações de pagamento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Status da integração</FormLabel>
                      <FormDescription>
                        Ative ou desative esta integração
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'active'}
                        onCheckedChange={(checked) => {
                          field.onChange(checked ? 'active' : 'inactive');
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Alerta de segurança */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Informações importantes de segurança
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      As credenciais do Mercado Pago são informações sensíveis. Mantenha-as seguras e não compartilhe com terceiros.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              disabled={saveMutation.isPending}
              className="w-full sm:w-auto"
            >
              {saveMutation.isPending ? (
                "Salvando..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar configurações
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};
