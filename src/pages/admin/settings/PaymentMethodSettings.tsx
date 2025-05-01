
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PaymentMethodConfig, SiteSettings } from '@/types';

// Interface para representar os dados que buscamos da tabela site_settings
interface SiteSettingsRow {
  id: string;
  company_name: string;
  logo: string;
  primary_color: string;
  secondary_color: string;
  contact_email: string;
  contact_phone: string;
  cancellation_policy: string;
  mercado_pago_key: string;
  google_calendar_integration: boolean;
  payment_method: PaymentMethodConfig | null;
  created_at: string;
  updated_at: string;
}

export const PaymentMethodSettings = () => {
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState<'mercadopago' | 'stripe'>('mercadopago');

  // Buscar a configuração atual
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .maybeSingle();
        
        if (error) {
          console.error('Erro ao carregar configurações:', error);
          return null;
        }
        
        return data as SiteSettingsRow | null;
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        return null;
      }
    },
  });

  // Buscar configurações do Mercado Pago
  const { data: mercadoPagoConfig, isLoading: isLoadingMercadoPago } = useQuery({
    queryKey: ['mercado-pago-config'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('integrations_mercadopago')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (error) {
          // Se não encontrar, retorna objeto vazio
          if (error.code === 'PGRST116') {
            return { status: 'inactive' } as const;
          }
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error('Erro ao buscar configuração do Mercado Pago:', error);
        return { status: 'inactive' } as const;
      }
    },
  });

  // Buscar configurações do Stripe
  const { data: stripeConfig, isLoading: isLoadingStripe } = useQuery({
    queryKey: ['stripe-config'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('integrations_stripe')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (error) {
          // Se não encontrar, retorna objeto vazio
          if (error.code === 'PGRST116') {
            return { status: 'inactive' } as const;
          }
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error('Erro ao buscar configuração do Stripe:', error);
        return { status: 'inactive' } as const;
      }
    },
  });

  // Mutação para salvar as configurações
  const updateSettings = useMutation({
    mutationFn: async () => {
      // Verifica se o mercadoPagoConfig e stripeConfig estão disponíveis
      const mercadoPagoEnvironment = typeof mercadoPagoConfig === 'object' && mercadoPagoConfig && 
                                     'environment' in mercadoPagoConfig ? 
                                     mercadoPagoConfig.environment : 'sandbox';
      
      const stripeEnvironment = typeof stripeConfig === 'object' && stripeConfig && 
                               'environment' in stripeConfig ? 
                               stripeConfig.environment : 'test';

      const paymentMethod: PaymentMethodConfig = {
        default: selectedMethod,
        mercadopago: {
          enabled: typeof mercadoPagoConfig === 'object' && mercadoPagoConfig && mercadoPagoConfig.status === 'active',
          environment: mercadoPagoEnvironment as 'sandbox' | 'production'
        },
        stripe: {
          enabled: typeof stripeConfig === 'object' && stripeConfig && stripeConfig.status === 'active',
          environment: stripeEnvironment as 'test' | 'production'
        }
      };

      // Verifica se settings existe para decidir entre atualizar ou inserir
      if (settings && settings.id) {
        const { data, error } = await supabase
          .from('site_settings')
          .update({
            payment_method: paymentMethod
          })
          .eq('id', settings.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        // Se não existir, cria um novo registro
        const { data, error } = await supabase
          .from('site_settings')
          .insert([{
            company_name: 'BookaQuadra',
            logo: '',
            primary_color: '#06b6d4',
            secondary_color: '#0891b2',
            contact_email: '',
            contact_phone: '',
            cancellation_policy: '',
            mercado_pago_key: '',
            google_calendar_integration: false,
            payment_method: paymentMethod
          }])
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Configurações salvas',
        description: 'Método de pagamento atualizado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro ao salvar configurações',
        description: 'Não foi possível atualizar o método de pagamento.',
        variant: 'destructive',
      });
    },
  });

  // Configurar o método inicial assim que os dados forem carregados
  useEffect(() => {
    if (settings?.payment_method?.default) {
      setSelectedMethod(settings.payment_method.default);
    }
  }, [settings]);

  const isLoading = isLoadingSettings || isLoadingMercadoPago || isLoadingStripe;
  const isMercadoPagoAvailable = typeof mercadoPagoConfig === 'object' && mercadoPagoConfig && mercadoPagoConfig.status === 'active';
  const isStripeAvailable = typeof stripeConfig === 'object' && stripeConfig && stripeConfig.status === 'active';

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Configurações de Pagamento</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Método de Pagamento Padrão</CardTitle>
          <CardDescription>
            Selecione qual método de pagamento será usado por padrão no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando configurações...</span>
            </div>
          ) : (
            <>
              <RadioGroup 
                value={selectedMethod}
                onValueChange={(value) => setSelectedMethod(value as 'mercadopago' | 'stripe')}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="mercadopago" 
                    id="mercadopago" 
                    disabled={!isMercadoPagoAvailable} 
                  />
                  <Label 
                    htmlFor="mercadopago" 
                    className={!isMercadoPagoAvailable ? "text-gray-400" : ""}
                  >
                    Mercado Pago
                  </Label>
                  {!isMercadoPagoAvailable && (
                    <span className="text-sm text-red-500 ml-2">
                      (Não configurado)
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="stripe" 
                    id="stripe" 
                    disabled={!isStripeAvailable}
                  />
                  <Label 
                    htmlFor="stripe" 
                    className={!isStripeAvailable ? "text-gray-400" : ""}
                  >
                    Stripe
                  </Label>
                  {!isStripeAvailable && (
                    <span className="text-sm text-red-500 ml-2">
                      (Não configurado)
                    </span>
                  )}
                </div>
              </RadioGroup>

              <div className="pt-4">
                <Button 
                  onClick={() => updateSettings.mutate()}
                  disabled={updateSettings.isPending || (!isMercadoPagoAvailable && !isStripeAvailable)}
                >
                  {updateSettings.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configurações'
                  )}
                </Button>
              </div>

              {!isMercadoPagoAvailable && !isStripeAvailable && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
                  <p className="text-amber-800">
                    Nenhum método de pagamento está configurado. 
                    Por favor, configure pelo menos um método de pagamento 
                    em Integrações &gt; Mercado Pago ou Integrações &gt; Stripe.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethodSettings;
