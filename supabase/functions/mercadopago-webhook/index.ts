
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuração do CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Definição de tipos para MercadoPago
interface MercadoPagoNotification {
  type: string;
  data: {
    id: string;
  };
  date_created: string;
  application_id: string;
  user_id: string;
  version: number;
  api_version: string;
  action: string;
  live_mode: boolean;
}

interface PaymentResponse {
  id: number;
  date_created: string;
  date_approved: string;
  date_last_updated: string;
  money_release_date: string;
  payment_method_id: string;
  payment_type_id: string;
  status: string;
  status_detail: string;
  currency_id: string;
  description: string;
  transaction_amount: number;
  external_reference?: string;
  additional_info?: any;
  [key: string]: any; // Para outros campos que possam existir
}

// Função para validar status de pagamento
function isValidPaymentStatus(status: string): boolean {
  const validStatuses = ['pending', 'paid', 'rejected', 'expired', 'refunded', 'cancelled', 'failed'];
  return validStatuses.includes(status);
}

// Map de status do Mercado Pago para o nosso sistema
const statusMap: Record<string, string> = {
  pending: "pending",
  approved: "paid",
  authorized: "pending",
  in_process: "pending",
  in_mediation: "pending",
  rejected: "rejected",
  cancelled: "cancelled",
  refunded: "refunded",
  charged_back: "cancelled",
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

    // Registrar o webhook recebido
    await supabase.from("integrations_mercadopago_logs").insert({
      integration_id: integration.id,
      action: "webhook_received",
      details: {
        data: payload,
      },
    });

    // Verificar o tipo de notificação
    if (payload.type === "payment") {
      const paymentId = payload.data?.id;
      
      if (!paymentId) {
        throw new Error("ID de pagamento não encontrado na notificação");
      }
      
      console.log(`Processando notificação de pagamento ID: ${paymentId}`);
      
      // Buscar detalhes do pagamento usando o Access Token
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            "Authorization": `Bearer ${integration.access_token}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        console.error(`Erro ao buscar pagamento ${paymentId}: ${errorText}`);
        throw new Error(`Erro ao buscar detalhes do pagamento: ${paymentResponse.status}`);
      }

      const paymentData = await paymentResponse.json() as PaymentResponse;
      console.log("Detalhes do pagamento:", JSON.stringify(paymentData));
      
      // Registrar os detalhes completos do pagamento
      await supabase.from("integrations_mercadopago_logs").insert({
        integration_id: integration.id,
        action: "payment_details_retrieved",
        details: {
          payment_id: paymentId,
          status: paymentData.status,
          payment_data: paymentData,
        },
      });
      
      // Mapear o status do Mercado Pago para o nosso sistema
      const mpStatus = paymentData.status || "pending";
      const mappedStatus = statusMap[mpStatus] || "pending";
      console.log(`Status mapeado: ${mpStatus} -> ${mappedStatus}`);

      // Verificar se o status mapeado é válido
      if (!isValidPaymentStatus(mappedStatus)) {
        console.error(`Status mapeado '${mappedStatus}' não é um valor válido para o banco de dados`);
        await supabase.from("integrations_mercadopago_logs").insert({
          integration_id: integration.id,
          action: "payment_status_invalid",
          details: {
            original_status: mpStatus,
            mapped_status: mappedStatus,
            payment_id: paymentId,
          },
        });
        throw new Error(`Status de pagamento inválido: ${mappedStatus}`);
      }
      
      // Buscar o pagamento correspondente pelo mercadopago_payment_id
      const { data: existingPayment, error: paymentError } = await supabase
        .from("payments")
        .select("id, status")
        .eq("mercadopago_payment_id", paymentId.toString())
        .maybeSingle();
      
      if (paymentError) {
        console.error("Erro ao buscar pagamento:", paymentError);
      }
      
      if (existingPayment) {
        console.log(`Atualizando pagamento existente ID: ${existingPayment.id} para status: ${mappedStatus}`);
        
        // Se o status mudou, atualizar o pagamento
        if (existingPayment.status !== mappedStatus) {
          try {
            // Atualizar usando RPC para evitar problemas com tipos
            const { error: updateError } = await supabase
              .rpc('update_payment_status', {
                p_payment_id: existingPayment.id,
                p_status: mappedStatus,
                p_raw_response: paymentData
              });
            
            if (updateError) {
              console.error("Erro ao chamar RPC update_payment_status:", updateError);
              // Tentar atualização direta como fallback
              const { error: directUpdateError } = await supabase
                .from("payments")
                .update({
                  status: mappedStatus,
                  updated_at: new Date().toISOString(),
                  raw_response: paymentData,
                })
                .eq("id", existingPayment.id);
              
              if (directUpdateError) {
                console.error("Erro ao atualizar pagamento:", directUpdateError);
                throw new Error(`Erro ao atualizar status do pagamento: ${directUpdateError.message}`);
              }
            }
          } catch (updateError) {
            console.error("Erro ao atualizar pagamento:", updateError);
            
            // Tentar uma abordagem alternativa registrando um log para análise
            await supabase.from("integrations_mercadopago_logs").insert({
              integration_id: integration.id,
              action: "payment_update_error",
              details: {
                payment_id: existingPayment.id,
                error: updateError.message,
                new_status: mappedStatus,
              },
            });
          }
          
          // Se o pagamento foi aprovado, atualizar o status da reserva se existir
          if (mappedStatus === "paid" && paymentData.external_reference) {
            // Verificar se external_reference é um ID de booking
            const { data: booking, error: bookingError } = await supabase
              .from("bookings")
              .select("id, payment_status")
              .eq("id", paymentData.external_reference)
              .maybeSingle();
            
            if (!bookingError && booking) {
              console.log(`Atualizando reserva ID: ${booking.id} para status: paid`);
              
              await supabase
                .from("bookings")
                .update({
                  payment_status: "paid",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", booking.id);
            }
          }
        }
      } else {
        // O pagamento ainda não existe no nosso sistema
        // Isso pode acontecer se o pagamento foi criado diretamente no Mercado Pago
        console.log(`Pagamento ID: ${paymentId} não encontrado no sistema`);
        
        // Se tiver external_reference, podemos tentar associar a um booking
        if (paymentData.external_reference) {
          const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select("id, user_id, amount")
            .eq("id", paymentData.external_reference)
            .maybeSingle();
          
          if (!bookingError && booking) {
            // Criar um novo registro de pagamento
            console.log(`Criando pagamento para reserva ID: ${booking.id}`);
            
            try {
              // Usar RPC para criar pagamento evitando problemas de tipos
              const { error: insertError } = await supabase
                .rpc('create_payment', {
                  booking_id: booking.id,
                  user_id: booking.user_id,
                  mercadopago_payment_id: paymentId.toString(),
                  status: mappedStatus,
                  amount: paymentData.transaction_amount,
                  payment_method: paymentData.payment_method_id,
                  expiration_date: null,
                  raw_response: paymentData
                });
              
              if (insertError) {
                console.error("Erro ao chamar RPC create_payment:", insertError);
                
                // Tentar inserção direta como fallback
                const { error: directInsertError } = await supabase
                  .from("payments")
                  .insert({
                    booking_id: booking.id,
                    user_id: booking.user_id,
                    amount: paymentData.transaction_amount,
                    status: mappedStatus,
                    payment_method: paymentData.payment_method_id,
                    mercadopago_payment_id: paymentId.toString(),
                    raw_response: paymentData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                
                if (directInsertError) {
                  console.error("Erro ao inserir pagamento:", directInsertError);
                  throw new Error(`Erro ao criar registro de pagamento: ${directInsertError.message}`);
                }
              }
            } catch (insertError) {
              console.error("Erro ao inserir pagamento:", insertError);
              
              // Registrar erro para análise
              await supabase.from("integrations_mercadopago_logs").insert({
                integration_id: integration.id,
                action: "payment_creation_error",
                details: {
                  booking_id: booking.id,
                  error: insertError.message,
                  mercadopago_payment_id: paymentId,
                  status: mappedStatus,
                },
              });
            }
            
            // Atualizar o status da reserva
            if (mappedStatus === "paid") {
              await supabase
                .from("bookings")
                .update({
                  payment_status: "paid",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", booking.id);
            }
          }
        }
      }
    } else {
      // Lidar com outros tipos de notificação
      console.log(`Notificação tipo: ${payload.type} - não requer processamento especial`);
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
