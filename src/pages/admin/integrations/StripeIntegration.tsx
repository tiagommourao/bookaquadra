
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
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { TestConnectionResult } from '@/types/payment';
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  publishable_key: z.string().min(1, {
    message: "Chave publicável é obrigatória.",
  }),
  secret_key: z.string().min(1, {
    message: "Chave secreta é obrigatória.",
  }),
  environment: z.enum(["test", "production"], {
    message: "Ambiente é obrigatório.",
  }),
  webhook_url: z.string().optional(),
  status: z.enum(["active", "inactive"], {
    message: "Status é obrigatório.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const StripeIntegration: React.FC = () => {
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publishable_key: "",
      secret_key: "",
      environment: "test",
      webhook_url: "",
      status: "inactive",
    },
  });

  const { data: integrationData, isLoading: isIntegrationLoading } = useQuery({
    queryKey: ['stripe-integration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations_stripe')
        .select('id, publishable_key, secret_key, environment, webhook_url, status')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar integração Stripe:', error);
        throw new Error("Erro ao carregar dados da integração Stripe");
      }

      return data;
    },
  });

  useEffect(() => {
    if (integrationData) {
      setIntegrationId(integrationData.id);
      form.setValue("publishable_key", integrationData.publishable_key || "");
      form.setValue("secret_key", integrationData.secret_key || "");
      
      const environmentValue = integrationData.environment === "production" ? "production" : "test";
      form.setValue("environment", environmentValue);
      
      form.setValue("webhook_url", integrationData.webhook_url || "");
      
      const statusValue = integrationData.status === "active" ? "active" : "inactive";
      form.setValue("status", statusValue);
    }
  }, [integrationData, form]);

  const updateIntegration = useMutation({
    mutationFn: async (values: FormValues) => {
      console.log("Salvando integração Stripe:", values);
      
      if (!integrationId) {
        const { data, error } = await supabase
          .from('integrations_stripe')
          .insert({
            publishable_key: values.publishable_key,
            secret_key: values.secret_key,
            environment: values.environment,
            webhook_url: values.webhook_url,
            status: values.status,
            name: 'Principal',
          })
          .select();

        if (error) {
          console.error('Erro ao criar integração Stripe:', error);
          throw new Error("Erro ao criar a integração Stripe");
        }

        return { success: true, message: "Integração Stripe criada com sucesso!", data };
      } else {
        const { error } = await supabase
          .from('integrations_stripe')
          .update({
            publishable_key: values.publishable_key,
            secret_key: values.secret_key,
            environment: values.environment,
            webhook_url: values.webhook_url,
            status: values.status,
          })
          .eq('id', integrationId);

        if (error) {
          console.error('Erro ao atualizar integração Stripe:', error);
          throw new Error("Erro ao atualizar a integração Stripe");
        }

        return { success: true, message: "Integração Stripe atualizada com sucesso!" };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-integration'] });
      toast({
        title: "Sucesso",
        description: "Integração Stripe atualizada com sucesso!",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a integração Stripe. Por favor, tente novamente.",
        variant: "destructive",
      })
    },
  });

  const testConnection = useMutation({
    mutationFn: async () => {
      if (!integrationId) {
        throw new Error("É necessário salvar a integração antes de testar a conexão.");
      }

      console.log("Testando conexão Stripe para integrationId:", integrationId);
      
      const { data, error } = await supabase.functions.invoke('test-stripe', {
        body: { integration_id: integrationId }
      });

      if (error) {
        console.error("Erro na chamada da função test-stripe:", error);
        throw error;
      }
      
      console.log("Resposta da função test-stripe:", data);
      
      return data as unknown as TestConnectionResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stripe-integration'] });
      
      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message || "Conexão bem-sucedida com Stripe!",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro na conexão",
          description: data.message || "Erro ao testar a conexão Stripe",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Erro ao testar conexão Stripe:', error);
      toast({
        title: "Erro",
        description: "Erro ao testar conexão com Stripe. Verifique os dados informados.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: FormValues) => {
    updateIntegration.mutate(values);
  }

  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin;
    const webhookUrl = `${baseUrl}/api/stripe-webhook`;
    form.setValue("webhook_url", webhookUrl);
  };

  const handleCancel = () => {
    if (integrationData) {
      const environmentValue = integrationData.environment === "production" ? "production" : "test";
      const statusValue = integrationData.status === "active" ? "active" : "inactive";
      
      form.reset({
        publishable_key: integrationData.publishable_key || "",
        secret_key: integrationData.secret_key || "",
        environment: environmentValue,
        webhook_url: integrationData.webhook_url || "",
        status: statusValue,
      });
    }
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
          <h1 className="text-2xl font-bold">Integração com Stripe</h1>
          <a 
            href="https://stripe.com/docs/api" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-primary hover:underline"
          >
            Documentação API <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>
        <p className="mb-6">
          Configure sua integração com o Stripe para receber pagamentos. Certifique-se de selecionar o ambiente correto e inserir as credenciais apropriadas.
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
                      Utilize as credenciais do ambiente de <b>Teste</b> para testes e as de <b>Produção</b> para transações reais.
                      As credenciais podem ser obtidas no <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">painel do Stripe</a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">
                          Ativar integração
                        </FormLabel>
                        <FormDescription>
                          {field.value === "active" 
                            ? "A integração está ativa e processando pagamentos" 
                            : "Ative para começar a receber pagamentos via Stripe"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === "active"}
                          onCheckedChange={(checked) => {
                            field.onChange(checked ? "active" : "inactive");
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
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
                              <RadioGroupItem value="test" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Teste
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
                        Selecione "Teste" para testes ou "Produção" para transações reais
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="publishable_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave Publicável</FormLabel>
                      <FormControl>
                        <Input placeholder="Sua chave publicável do Stripe" {...field} />
                      </FormControl>
                      <FormDescription>
                        {form.watch("environment") === "test" 
                          ? "Utilize a Publishable Key para ambiente de testes" 
                          : "Utilize a Publishable Key para ambiente de produção"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="secret_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave Secreta</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Sua chave secreta do Stripe" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch("environment") === "test" 
                          ? "Utilize a Secret Key para ambiente de testes" 
                          : "Utilize a Secret Key para ambiente de produção"}
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
                          <Input placeholder="URL para receber notificações do Stripe" {...field} />
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
                        Configure esta URL no painel do Stripe para receber notificações de pagamentos.
                        Vá para Desenvolvedores {">"} Webhooks no painel do Stripe e adicione esta URL.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateIntegration.isPending}>
                    {updateIntegration.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
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
          <Button onClick={() => testConnection.mutate()} disabled={testConnection.isPending || !integrationId}>
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

export default StripeIntegration;
