
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuração do CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Função para testar a conexão com o Mercado Pago
async function testMercadoPagoConnection(
  accessToken: string,
  publicKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Testando conexão com MercadoPago usando access token:", accessToken.substring(0, 10) + "...");
    
    // Teste simples: verificar se o access token é válido com a API do Mercado Pago
    const response = await fetch("https://api.mercadopago.com/users/me", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    console.log("Resposta da API do MercadoPago:", JSON.stringify(data));

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
  console.log("Iniciando função test-mercadopago");
  
  // Lidar com requisições OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    console.log("Tratando requisição OPTIONS para CORS");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log("Recebendo requisição:", req.method);
    
    // Extrair corpo da requisição
    let body;
    try {
      body = await req.json();
      console.log("Corpo da requisição:", body);
    } catch (error) {
      console.error("Erro ao processar corpo da requisição:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Formato de requisição inválido" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const integrationId = body.integration_id;

    if (!integrationId) {
      console.error("ID da integração não fornecido");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "ID da integração não fornecido" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Cria o cliente do Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Configurações do Supabase ausentes");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Erro de configuração do servidor" 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("Conectando ao Supabase:", supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar a integração
    console.log("Buscando integração com ID:", integrationId);
    const { data: integration, error } = await supabase
      .from("integrations_mercadopago")
      .select("id, access_token, public_key")
      .eq("id", integrationId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar integração:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Erro ao buscar integração" 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!integration) {
      console.error("Integração não encontrada");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Integração não encontrada" 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se os tokens estão presentes
    if (!integration.access_token || !integration.public_key) {
      console.log("Tokens ausentes na integração");
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

      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Testar a conexão
    console.log("Iniciando teste de conexão com MercadoPago");
    const result = await testMercadoPagoConnection(
      integration.access_token,
      integration.public_key
    );

    console.log("Resultado do teste:", result);

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

    console.log("Teste finalizado e registrado com sucesso");
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
