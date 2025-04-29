
import React from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PaymentMethodSettings = () => {
  const { settings, updateSettings, isLoading: isSettingsLoading } = useSiteSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [defaultMethod, setDefaultMethod] = React.useState<'mercadopago' | 'stripe'>(
    settings.paymentMethod?.default || 'mercadopago'
  );

  // Consultar integrações disponíveis
  const { data: mercadoPagoData, isLoading: isMPLoading } = useQuery({
    queryKey: ['mercadopago-integration'],
    queryFn: async () => {
      const { data } = await supabase
        .from('integrations_mercadopago')
        .select('status')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    }
  });

  const { data: stripeData, isLoading: isStripeLoading } = useQuery({
    queryKey: ['stripe-integration'],
    queryFn: async () => {
      const { data } = await supabase
        .from('integrations_stripe')
        .select('status')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    }
  });

  const mercadoPagoEnabled = mercadoPagoData?.status === 'active';
  const stripeEnabled = stripeData?.status === 'active';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateSettings({
        paymentMethod: {
          ...settings.paymentMethod,
          default: defaultMethod,
        }
      });
      toast({
        title: "Configurações salvas",
        description: "Método de pagamento padrão atualizado com sucesso."
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSettingsLoading || isMPLoading || isStripeLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10 flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Configurações de Pagamento</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-4">Método de Pagamento Padrão</h2>
                <p className="text-gray-500 mb-4">
                  Selecione o método de pagamento que será utilizado como padrão para os usuários.
                  Certifique-se de que o método selecionado esteja configurado e ativado.
                </p>

                <RadioGroup 
                  value={defaultMethod} 
                  onValueChange={(value) => setDefaultMethod(value as 'mercadopago' | 'stripe')}
                  className="space-y-4"
                >
                  <div 
                    className={`flex items-start space-x-4 rounded-lg border p-4 ${
                      !mercadoPagoEnabled ? 'opacity-50' : ''
                    }`}
                  >
                    <RadioGroupItem value="mercadopago" id="mercadopago" disabled={!mercadoPagoEnabled} />
                    <div className="flex-1">
                      <Label 
                        htmlFor="mercadopago" 
                        className="font-medium cursor-pointer flex items-center"
                      >
                        MercadoPago
                        {!mercadoPagoEnabled && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Desativado
                          </span>
                        )}
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Integração com MercadoPago para transações em Reais (BRL).
                      </p>
                      <div className="mt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate('/admin/integracoes/mercadopago')}
                          className="text-xs"
                        >
                          Configurar MercadoPago
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`flex items-start space-x-4 rounded-lg border p-4 ${
                      !stripeEnabled ? 'opacity-50' : ''
                    }`}
                  >
                    <RadioGroupItem value="stripe" id="stripe" disabled={!stripeEnabled} />
                    <div className="flex-1">
                      <Label 
                        htmlFor="stripe" 
                        className="font-medium cursor-pointer flex items-center"
                      >
                        Stripe
                        {!stripeEnabled && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Desativado
                          </span>
                        )}
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Integração com Stripe para transações internacionais e múltiplas moedas.
                      </p>
                      <div className="mt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate('/admin/integracoes/stripe')}
                          className="text-xs"
                        >
                          Configurar Stripe
                        </Button>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {!mercadoPagoEnabled && !stripeEnabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Atenção
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Nenhum método de pagamento está ativado. Por favor, configure pelo menos um dos métodos 
                          disponíveis antes de prosseguir.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || (!mercadoPagoEnabled && !stripeEnabled)}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Configurações"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">Recursos Adicionais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <CreditCard className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-medium">Documentação de Pagamentos</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Acesse a documentação completa sobre integrações de pagamento.
                </p>
                <div className="flex space-x-2">
                  <a 
                    href="https://www.mercadopago.com.br/developers/pt" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary text-sm flex items-center hover:underline"
                  >
                    Docs MercadoPago <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                  <a 
                    href="https://stripe.com/docs" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary text-sm flex items-center hover:underline"
                  >
                    Docs Stripe <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PaymentMethodSettings;
