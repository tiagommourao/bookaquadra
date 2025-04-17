
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type MercadoPagoIntegrationResult = {
  success: boolean;
  message: string;
};

type MercadoPagoIntegration = {
  id?: string;
  name: string;
  environment: string;
  client_id?: string;
  client_secret?: string;
  access_token?: string;
  public_key?: string;
  created_by?: string;
};

const MercadoPagoIntegration: React.FC = () => {
  const [integration, setIntegration] = useState<MercadoPagoIntegration>({
    name: 'Principal',
    environment: 'sandbox',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<MercadoPagoIntegrationResult | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchLatestIntegration();
  }, []);

  const fetchLatestIntegration = async () => {
    const { data, error } = await supabase
      .from('integrations_mercadopago')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setIntegration(data);
    }
  };

  const handleInputChange = (key: keyof MercadoPagoIntegration, value: string) => {
    setIntegration(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveIntegration = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('integrations_mercadopago')
        .upsert({
          ...integration,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Integração salva com sucesso');
      setIntegration(data);
    } catch (error) {
      toast.error('Erro ao salvar integração');
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      // Substituir por chamada real de teste de conexão
      const { data, error } = await supabase.rpc('test_mercadopago_integration', { 
        integration_id: integration.id 
      });

      if (error) throw error;

      const result = data as MercadoPagoIntegrationResult;
      setLastTestResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao testar conexão');
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Integração Mercado Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome da Integração</Label>
              <Input 
                value={integration.name || ''} 
                onChange={(e) => handleInputChange('name', e.target.value)} 
                placeholder="Nome da integração"
              />
            </div>
            <div>
              <Label>Ambiente</Label>
              <Select 
                value={integration.environment || 'sandbox'}
                onValueChange={(value) => handleInputChange('environment', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campos de credenciais sensíveis */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client ID</Label>
              <Input 
                type="password" 
                value={integration.client_id || ''} 
                onChange={(e) => handleInputChange('client_id', e.target.value)} 
                placeholder="Client ID"
              />
            </div>
            <div>
              <Label>Client Secret</Label>
              <Input 
                type="password" 
                value={integration.client_secret || ''} 
                onChange={(e) => handleInputChange('client_secret', e.target.value)} 
                placeholder="Client Secret"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Access Token</Label>
              <Input 
                type="password" 
                value={integration.access_token || ''} 
                onChange={(e) => handleInputChange('access_token', e.target.value)} 
                placeholder="Access Token"
              />
            </div>
            <div>
              <Label>Public Key</Label>
              <Input 
                type="password" 
                value={integration.public_key || ''} 
                onChange={(e) => handleInputChange('public_key', e.target.value)} 
                placeholder="Public Key"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button 
              onClick={handleSaveIntegration} 
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Integração'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleTestConnection} 
              disabled={isLoading || !integration.id}
            >
              {isLoading ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>

          {lastTestResult && (
            <div className={`p-4 rounded ${lastTestResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <p>{lastTestResult.message}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MercadoPagoIntegration;
