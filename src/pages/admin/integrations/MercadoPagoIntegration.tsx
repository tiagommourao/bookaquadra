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
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { TestConnectionResult } from '@/types/payment';

const formSchema = z.object({
  public_key: z.string().min(1, {
    message: "Chave pública é obrigatória.",
  }),
  access_token: z.string().min(1, {
    message: "Access Token é obrigatório.",
  }),
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
    },
  });

  useEffect(() => {
    const fetchIntegration = async () => {
      const { data, error } = await supabase
        .from('mercadopago_integrations')
        .select('id, public_key, access_token')
        .single();

      if (error) {
        console.error('Erro ao buscar integração:', error);
        toast({
          title: "Erro ao carregar integração",
          description: "Ocorreu um erro ao carregar os dados da integração. Por favor, tente novamente.",
          variant: "destructive",
        })
        return;
      }

      if (data) {
        setIntegrationId(data.id);
        form.setValue("public_key", data.public_key || "");
        form.setValue("access_token", data.access_token || "");
      }
    };

    fetchIntegration();
  }, [form, toast]);

  const { data: integrationData, isLoading: isIntegrationLoading } = useQuery({
    queryKey: ['mercadopago-integration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mercadopago_integrations')
        .select('id, public_key, access_token')
        .single();

      if (error) {
        console.error('Erro ao buscar integração:', error);
        throw new Error("Erro ao carregar dados da integração");
      }

      return data;
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!integrationId) {
        throw new Error("ID de integração não encontrado.");
      }

      const { error } = await supabase
        .from('mercadopago_integrations')
        .update({
          public_key: values.public_key,
          access_token: values.access_token,
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

  // Only updating the test connection function to use our interface properly
  const testConnection = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .rpc('test_mercadopago_integration', { integration_id: integrationId });

      if (error) throw error;
      return data as unknown as TestConnectionResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mercadopago-integration'] });
      
      if (data.success) {
        toast.success('Conexão bem-sucedida com MercadoPago!');
      } else {
        toast.error(`Erro na conexão: ${data.message}`);
      }
    },
    onError: (error) => {
      console.error('Erro ao testar conexão:', error);
      toast.error('Erro ao testar conexão com MercadoPago');
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateIntegration.mutate(values);
  }

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
        <h1 className="text-2xl font-bold mb-4">Integração com MercadoPago</h1>
        <p className="mb-4">
          Configure sua integração com o MercadoPago para receber pagamentos.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="public_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave Pública</FormLabel>
                  <FormControl>
                    <Input placeholder="Sua chave pública do MercadoPago" {...field} />
                  </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline">Cancelar</Button>
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
