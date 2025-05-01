
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.4.0?target=deno';

interface StripeConfig {
  id: string;
  environment: 'test' | 'production';
  publishable_key: string;
  secret_key: string;
}

serve(async (req) => {
  try {
    // Criar cliente Supabase usando as credenciais de serviço
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Obter informações do usuário a partir do token JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: 'Não autorizado. Token ausente.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Usuário não encontrado ou token inválido.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar se o usuário é administrador
    const { data: isAdmin, error: adminError } = await supabaseClient.rpc('is_admin');
    
    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ success: false, message: 'Acesso negado. Permissões insuficientes.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse body request
    const { id } = await req.json();
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: 'ID da configuração não fornecido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get Stripe integration
    const { data: stripeConfig, error: stripeError } = await supabaseClient
      .from('integrations_stripe')
      .select('*')
      .eq('id', id)
      .single();
      
    if (stripeError || !stripeConfig) {
      return new Response(
        JSON.stringify({ success: false, message: 'Configuração do Stripe não encontrada.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Test Stripe connection
    let testResult = {
      success: false,
      message: 'Configuração incompleta.'
    };
    
    if (stripeConfig.secret_key) {
      try {
        // Inicializa o cliente Stripe com a chave secreta
        const stripe = new Stripe(stripeConfig.secret_key, {
          apiVersion: '2023-10-16',
        });
        
        // Tenta obter o account balance para testar a conexão
        await stripe.balance.retrieve();
        
        testResult = {
          success: true,
          message: 'Conexão com o Stripe estabelecida com sucesso!'
        };
      } catch (error) {
        console.error('Erro ao conectar com o Stripe:', error);
        testResult = {
          success: false,
          message: `Erro ao conectar com o Stripe: ${error.message}`
        };
      }
    }
    
    // Atualiza o status do teste na base de dados
    await supabaseClient
      .from('integrations_stripe')
      .update({
        last_tested_at: new Date().toISOString(),
        last_test_success: testResult.success,
        test_result_message: testResult.message,
        updated_by: user.id
      })
      .eq('id', id);
      
    return new Response(
      JSON.stringify(testResult),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro na função test-stripe:', error);
    return new Response(
      JSON.stringify({ success: false, message: `Erro interno: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
