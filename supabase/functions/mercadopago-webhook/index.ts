
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuração do CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função principal para processar as notificações do Mercado Pago
serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Registrar todos os webhooks recebidos para fins de depuração
    const payload = await req.json();
    console.log("Webhook recebido:", JSON.stringify(payload));

    // Obter a integração ativa do Mercado Pago
    const { data: integration, error: integrationError } = await supabase
      .from("integrations_mercadopago")
      .select("id, access_token")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (integrationError || !integration) {
      console.error("Erro ao buscar integração:", integrationError);
      return new Response(
        JSON.stringify({ error: "Configuração não encontrada" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extrair informações relevantes do webhook
    const notificationType = payload.type;
    
    // Log da notificação
    await supabase.from("integrations_mercadopago_logs").insert({
      integration_id: integration.id,
      action: "webhook_received",
      details: {
        type: notificationType,
        data: payload,
      },
    });

    // Verificar o tipo de notificação
    if (notificationType === "payment") {
      // Buscar detalhes do pagamento usando o Access Token
      const paymentId = payload.data?.id;
      if (paymentId) {
        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              "Authorization": `Bearer ${integration.access_token}`,
            },
          }
        );

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          console.log("Detalhes do pagamento:", JSON.stringify(paymentData));
          
          // Registrar os detalhes do pagamento
          await supabase.from("integrations_mercadopago_logs").insert({
            integration_id: integration.id,
            action: "payment_details_retrieved",
            details: {
              payment_id: paymentId,
              status: paymentData.status,
              payment_data: paymentData,
            },
          });

          // Aqui seria implementada a lógica para atualizar reservas com base no pagamento
          // Esta é apenas uma implementação básica que será expandida posteriormente
        } else {
          console.error("Erro ao buscar detalhes do pagamento:", await paymentResponse.text());
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
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
