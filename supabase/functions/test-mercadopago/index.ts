
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuração do CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para testar a conexão com o Mercado Pago
async function testMercadoPagoConnection(
  accessToken: string,
  publicKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Teste simples: verificar se o access token é válido
    // Na implementação real, poderia ser feita uma chamada à API do Mercado Pago
    const response = await fetch("https://api.mercadopago.com/users/me", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (response.status === 200 && data.id) {
      return {
        success: true,
        message: `Conexão bem-sucedida! Usuário: ${data.first_name || data.email || data.id}`,
      };
    } else {
      return {
        success: false,
        message: data.message || "Access Token inválido ou expirado.",
      };
    }
  } catch (error) {
    console.error("Erro ao testar conexão com Mercado Pago:", error);
    return {
      success: false,
      message: error.message || "Erro ao conectar com a API do Mercado Pago.",
    };
  }
}

serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const integrationId = url.searchParams.get("integration_id");

    if (!integrationId) {
      return new Response(
        JSON.stringify({ error: "ID da integração não fornecido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Cria o cliente do Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar a integração
    const { data: integration, error } = await supabase
      .from("integrations_mercadopago")
      .select("id, access_token, public_key")
      .eq("id", integrationId)
      .single();

    if (error || !integration) {
      console.error("Erro ao buscar integração:", error);
      return new Response(
        JSON.stringify({ error: "Integração não encontrada" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se os tokens estão presentes
    if (!integration.access_token || !integration.public_key) {
      const result = {
        success: false,
        message: "Access Token e Public Key são obrigatórios",
      };

      // Atualizar o resultado do teste na tabela
      await supabase
        .from("integrations_mercadopago")
        .update({
          last_tested_at: new Date().toISOString(),
          last_test_success: result.success,
          test_result_message: result.message,
        })
        .eq("id", integrationId);

      // Registrar o teste no log
      await supabase.from("integrations_mercadopago_logs").insert({
        integration_id: integrationId,
        action: "test_connection",
        details: result,
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Testar a conexão
    const result = await testMercadoPagoConnection(
      integration.access_token,
      integration.public_key
    );

    // Atualizar o resultado do teste na tabela
    await supabase
      .from("integrations_mercadopago")
      .update({
        last_tested_at: new Date().toISOString(),
        last_test_success: result.success,
        test_result_message: result.message,
      })
      .eq("id", integrationId);

    // Registrar o teste no log
    await supabase.from("integrations_mercadopago_logs").insert({
      integration_id: integrationId,
      action: "test_connection",
      details: result,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Erro interno no servidor",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
