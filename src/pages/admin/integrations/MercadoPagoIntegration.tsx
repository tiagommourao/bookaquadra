
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ExternalLink } from 'lucide-react';
import { TestConnectionResult } from '@/types/payment';
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';

const formSchema = z.object({
  public_key: z.string().min(1, {
    message: "Chave pública é obrigatória.",
  }),
  access_token: z.string().min(1, {
    message: "Access Token é obrigatório.",
  }),
  environment: z.enum(["sandbox", "production"], {
    message: "Ambiente é obrigatório.",
  }),
  webhook_url: z.string().optional(),
});

const MercadoPagoIntegration: React.FC = () => {
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      public_key: "",
      access_token: "",
      environment: "sandbox",
      webhook_url: "",
    },
  });

  const { data: integrationData, isLoading: isIntegrationLoading } = useQuery({
    queryKey: ['mercadopago-integration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations_mercadopago')
        .select('id, public_key, access_token, environment, webhook_url')
        .single();

      if (error) {
        console.error('Erro ao buscar integração:', error);
        throw new Error("Erro ao carregar dados da integração");
      }

      return data;
    },
  });

  useEffect(() => {
    if (integrationData) {
      setIntegrationId(integrationData.id);
      form.setValue("public_key", integrationData.public_key || "");
      form.setValue("access_token", integrationData.access_token || "");
      form.setValue("environment", integrationData.environment || "sandbox");
      form.setValue("webhook_url", integrationData.webhook_url || "");
    }
  }, [integrationData, form]);

  const updateIntegration = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!integrationId) {
        throw new Error("ID de integração não encontrado.");
      }

      const { error } = await supabase
        .from('integrations_mercadopago')
        .update({
          public_key: values.public_key,
          access_token: values.access_token,
          environment: values.environment,
          webhook_url: values.webhook_url,
        })
        .eq('id', integrationId);

      if (error) {
        console.error('Erro ao atualizar integração:', error);
        throw new Error("Erro ao atualizar a integração");
      }

      return { success: true, message: "Integração atualizada com sucesso!" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mercadopago-integration'] });
      toast({
        title: "Sucesso",
        description: "Integração atualizada com sucesso!",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a integração. Por favor, tente novamente.",
        variant: "destructive",
      })
    },
  });

  const testConnection = useMutation({
    mutationFn: async () => {
      const { data: responseData, error } = await supabase
        .rpc('test_mercadopago_integration', { integration_id: integrationId });

      if (error) throw error;
      
      // Cast the response to the correct type
      return responseData as unknown as TestConnectionResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mercadopago-integration'] });
      
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Conexão bem-sucedida com MercadoPago!",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro na conexão",
          description: data.message || "Erro ao testar a conexão",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Erro ao testar conexão:', error);
      toast({
        title: "Erro",
        description: "Erro ao testar conexão com MercadoPago",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateIntegration.mutate(values);
  }

  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin;
    const webhookUrl = `${baseUrl}/api/webhook/mercadopago`;
    form.setValue("webhook_url", webhookUrl);
  };

  if (isIntegrationLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Integração com MercadoPago</h1>
          <a 
            href="https://www.mercadopago.com.br/developers/pt/reference" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-primary hover:underline"
          >
            Documentação API <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>
        <p className="mb-6">
          Configure sua integração com o MercadoPago para receber pagamentos. Certifique-se de selecionar o ambiente correto e inserir as credenciais apropriadas.
        </p>

        <Card>
          <CardContent className="pt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Informações importantes
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Utilize as credenciais do ambiente de <b>Sandbox</b> para testes e as de <b>Produção</b> para transações reais.
                      As credenciais podem ser obtidas no <a href="https://www.mercadopago.com.br/settings/account/credentials" target="_blank" rel="noopener noreferrer" className="underline">painel do Mercado Pago</a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Ambiente</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
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
                
                <FormField
                  control={form.control}
                  name="public_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave Pública</FormLabel>
                      <FormControl>
                        <Input placeholder="Sua chave pública do MercadoPago" {...field} />
                      </FormControl>
                      <FormDescription>
                        {form.watch("environment") === "sandbox" 
                          ? "Utilize a Test Public Key para ambiente de testes" 
                          : "Utilize a Production Public Key para ambiente de produção"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="access_token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Token</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu access token do MercadoPago" {...field} />
                      </FormControl>
                      <FormDescription>
                        {form.watch("environment") === "sandbox" 
                          ? "Utilize o Test Access Token para ambiente de testes" 
                          : "Utilize o Production Access Token para ambiente de produção"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="webhook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL para Webhook</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="URL para receber notificações do MercadoPago" {...field} />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={generateWebhookUrl}
                          className="flex-shrink-0"
                        >
                          Gerar URL
                        </Button>
                      </div>
                      <FormDescription>
                        Configure esta URL no painel do MercadoPago para receber notificações de pagamentos.
                        Vá para Configurações {">"} Webhooks no painel do MercadoPago e adicione esta URL.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="outline" type="button">Cancelar</Button>
                  <Button type="submit" disabled={updateIntegration.isPending}>
                    {updateIntegration.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button onClick={() => testConnection.mutate()} disabled={testConnection.isPending}>
            {testConnection.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando Conexão...
              </>
            ) : (
              "Testar Conexão"
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MercadoPagoIntegration;
