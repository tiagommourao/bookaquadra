
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethodConfig } from '@/types/payment';
import { SiteSettings } from '@/types';
import { Loader2 } from 'lucide-react';

// Interface para corresponder exatamente ao formato do banco de dados
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
  payment_method: PaymentMethodConfig;
  created_at: string;
  updated_at: string;
}

const PaymentMethodSettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .single();

        if (error) throw error;

        if (data) {
          // Converter os nomes das colunas para camelCase e garantir tipagem correta
          const dbData = data as unknown as SiteSettingsRow;
          
          // Converter do formato do banco para o formato da aplicação
          const appSettings: SiteSettings = {
            id: dbData.id,
            companyName: dbData.company_name,
            logo: dbData.logo,
            primaryColor: dbData.primary_color,
            secondaryColor: dbData.secondary_color,
            contactEmail: dbData.contact_email,
            contactPhone: dbData.contact_phone,
            cancellationPolicy: dbData.cancellation_policy,
            mercadoPagoKey: dbData.mercado_pago_key,
            googleCalendarIntegration: dbData.google_calendar_integration,
            paymentMethod: dbData.payment_method || {
              default: 'manual',
              mercadopago: { enabled: false },
              stripe: { enabled: false },
              manual: { enabled: true }
            }
          };
          
          setSettings(appSettings);
        } else {
          // Configurações padrão se não houver nenhum registro
          setSettings({
            companyName: 'BookaQuadra',
            logo: '',
            primaryColor: '#06b6d4',
            secondaryColor: '#0891b2',
            contactEmail: '',
            contactPhone: '',
            cancellationPolicy: '',
            mercadoPagoKey: '',
            googleCalendarIntegration: false,
            paymentMethod: {
              default: 'manual',
              mercadopago: { enabled: false },
              stripe: { enabled: false },
              manual: { enabled: true }
            }
          });
        }
      } catch (error: any) {
        console.error('Erro ao buscar configurações:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as configurações',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      // Converter de volta para o formato do banco de dados
      const dbSettings = {
        company_name: settings.companyName,
        logo: settings.logo,
        primary_color: settings.primaryColor,
        secondary_color: settings.secondaryColor,
        contact_email: settings.contactEmail,
        contact_phone: settings.contactPhone,
        cancellation_policy: settings.cancellationPolicy,
        mercado_pago_key: settings.mercadoPagoKey,
        google_calendar_integration: settings.googleCalendarIntegration,
        payment_method: settings.paymentMethod
      };
      
      let query;
      if (settings.id) {
        // Atualizar configurações existentes
        query = supabase
          .from('site_settings')
          .update(dbSettings)
          .eq('id', settings.id);
      } else {
        // Inserir novas configurações
        query = supabase
          .from('site_settings')
          .insert([dbSettings]);
      }
      
      const { error } = await query;
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaymentMethodChange = (key: string, enabled: boolean) => {
    if (!settings || !settings.paymentMethod) return;
    
    // Criar uma cópia profunda do objeto
    const updatedPaymentMethod = {
      ...settings.paymentMethod,
      [key]: { 
        ...settings.paymentMethod[key as keyof typeof settings.paymentMethod],
        enabled 
      }
    };
    
    // Se a opção estiver sendo habilitada, definir como padrão
    if (enabled) {
      updatedPaymentMethod.default = key;
    } 
    // Se a opção estiver sendo desabilitada e era padrão, definir outro método como padrão
    else if (settings.paymentMethod.default === key) {
      const enabledMethods = ['manual', 'mercadopago', 'stripe'].filter(
        method => method !== key && !!updatedPaymentMethod[method as keyof typeof updatedPaymentMethod]?.enabled
      );
      if (enabledMethods.length > 0) {
        updatedPaymentMethod.default = enabledMethods[0];
      }
    }
    
    setSettings({
      ...settings,
      paymentMethod: updatedPaymentMethod as PaymentMethodConfig
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Métodos de Pagamento</h1>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>

      <Tabs defaultValue="payment-methods">
        <TabsList>
          <TabsTrigger value="payment-methods">Métodos de Pagamento</TabsTrigger>
          <TabsTrigger value="providers">Integrações</TabsTrigger>
        </TabsList>
        <TabsContent value="payment-methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento Aceitos</CardTitle>
              <CardDescription>
                Configure os métodos de pagamento que serão aceitos na plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings && settings.paymentMethod && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="payment-manual" 
                      checked={!!settings.paymentMethod.manual?.enabled}
                      onCheckedChange={(checked) => handlePaymentMethodChange('manual', checked === true)}
                    />
                    <Label htmlFor="payment-manual" className="font-medium">
                      Pagamento Manual / Presencial
                    </Label>
                    {settings.paymentMethod.default === 'manual' && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Padrão</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="payment-mercadopago" 
                      checked={!!settings.paymentMethod.mercadopago?.enabled}
                      onCheckedChange={(checked) => handlePaymentMethodChange('mercadopago', checked === true)}
                    />
                    <Label htmlFor="payment-mercadopago" className="font-medium">
                      Mercado Pago
                    </Label>
                    {settings.paymentMethod.default === 'mercadopago' && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Padrão</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="payment-stripe" 
                      checked={!!settings.paymentMethod.stripe?.enabled}
                      onCheckedChange={(checked) => handlePaymentMethodChange('stripe', checked === true)}
                    />
                    <Label htmlFor="payment-stripe" className="font-medium">
                      Stripe
                    </Label>
                    {settings.paymentMethod.default === 'stripe' && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Padrão</span>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Método de pagamento padrão</h3>
                    <p className="text-sm text-muted-foreground">
                      O método marcado como padrão será selecionado automaticamente durante o processo de reserva.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provedores de Pagamento</CardTitle>
              <CardDescription>
                Gerencie a configuração de integração com os provedores de pagamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Mercado Pago</h3>
                    <p className="text-sm text-muted-foreground">
                      Gerencie as chaves e configurações do Mercado Pago.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => window.location.href = '/admin/integracoes/mercadopago'}>
                    Configurar
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Stripe</h3>
                    <p className="text-sm text-muted-foreground">
                      Gerencie as chaves e configurações do Stripe.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => window.location.href = '/admin/integracoes/stripe'}>
                    Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentMethodSettings;
