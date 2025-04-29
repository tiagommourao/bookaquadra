
// Supabase Edge Function para testar a integração com o Stripe
// supabase/functions/test-stripe/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Lidar com solicitação de OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extrair token de autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Autorização ausente");
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verificar token e obter usuário
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Obter os dados da requisição
    const { integration_id } = await req.json();
    if (!integration_id) {
      throw new Error("ID da integração não fornecido");
    }

    // Obter configuração da integração do Stripe
    const { data: stripeConfig, error: configError } = await supabase
      .from("integrations_stripe")
      .select("*")
      .eq("id", integration_id)
      .single();

    if (configError || !stripeConfig) {
      throw new Error("Configuração do Stripe não encontrada");
    }

    // Inicializar Stripe com a chave API
    const stripe = new Stripe(stripeConfig.secret_key, {
      apiVersion: "2023-10-16",
    });

    // Testar a conexão obtendo informações da conta
    const account = await stripe.balance.retrieve();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conexão com o Stripe estabelecida com sucesso!",
        data: {
          available: account.available,
          pending: account.pending,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro no teste de conexão do Stripe:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao testar conexão com o Stripe: ${error.message}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
