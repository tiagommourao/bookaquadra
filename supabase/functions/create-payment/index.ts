
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Função auxiliar para verificar se um valor de status é válido
function isValidPaymentStatus(status: string): boolean {
  const validStatuses = ['pending', 'paid', 'rejected', 'expired', 'refunded', 'cancelled', 'failed'];
  return validStatuses.includes(status);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Configurações do Supabase ausentes");
      return new Response(
        JSON.stringify({ error: "Erro de configuração do servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("Erro ao analisar o corpo da requisição:", error);
      return new Response(
        JSON.stringify({ error: "Formato de requisição inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { booking_id } = requestBody;
    
    if (!booking_id) {
      console.error("ID da reserva não fornecido");
      return new Response(
        JSON.stringify({ error: "ID da reserva não fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Processando pagamento para reserva ID: ${booking_id}`);
    
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, court:courts(name)")
      .eq("id", booking_id)
      .single();
    
    if (bookingError || !booking) {
      console.error("Erro ao buscar reserva:", bookingError);
      return new Response(
        JSON.stringify({ error: "Reserva não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { data: existingPayment, error: paymentCheckError } = await supabase
      .from("payments")
      .select("id, status")
      .eq("booking_id", booking_id)
      .maybeSingle();

    if (paymentCheckError) {
      console.error("Erro ao verificar pagamento existente:", paymentCheckError);
    } else if (existingPayment && existingPayment.status === 'paid') {
      console.error("Esta reserva já possui um pagamento confirmado");
      return new Response(
        JSON.stringify({ error: "Esta reserva já possui um pagamento confirmado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { data: integration, error: integrationError } = await supabase
      .from("integrations_mercadopago")
      .select("access_token, environment")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .maybeSingle();
    
    if (integrationError) {
      console.error("Erro ao buscar integração:", integrationError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar integração com MercadoPago" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!integration || !integration.access_token) {
      console.error("Integração não configurada ou inativa");
      return new Response(
        JSON.stringify({ 
          error: "Integração com MercadoPago não configurada ou ativada", 
          setup_required: true 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const courtName = booking.court?.name || "Quadra";
    
    const bookingDate = new Date(booking.booking_date);
    const formattedDate = `${bookingDate.getDate()}/${bookingDate.getMonth() + 1}/${bookingDate.getFullYear()}`;
    
    const preference = {
      items: [
        {
          title: `Reserva de ${courtName}`,
          description: `${formattedDate} ${booking.start_time.substring(0, 5)} - ${booking.end_time.substring(0, 5)}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(booking.amount)
        }
      ],
      external_reference: booking.id,
      back_urls: {
        success: `${req.headers.get("origin") || "https://bookaquadra.lovable.app"}/minhas-reservas`,
        failure: `${req.headers.get("origin") || "https://bookaquadra.lovable.app"}/minhas-reservas`,
        pending: `${req.headers.get("origin") || "https://bookaquadra.lovable.app"}/minhas-reservas`
      },
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`
    };
    
    console.log("Enviando preferência para Mercado Pago:", JSON.stringify(preference));
    
    try {
      const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${integration.access_token}`
        },
        body: JSON.stringify(preference)
      });
      
      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        console.error("Erro na resposta do Mercado Pago:", errorText, "Status:", mpResponse.status);
        
        return new Response(
          JSON.stringify({ 
            error: `Erro ao gerar pagamento no Mercado Pago: ${mpResponse.statusText}`,
            details: errorText
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const mpData = await mpResponse.json();
      console.log("Resposta do Mercado Pago:", JSON.stringify(mpData));
      
      if (existingPayment) {
        await supabase
          .from("payments")
          .update({ status: "cancelled" })
          .eq("booking_id", booking_id)
          .eq("status", "pending");
      }
      
      const statusToUse = "pending";
      console.log(`Usando status de pagamento: ${statusToUse}`);
      
      if (!isValidPaymentStatus(statusToUse)) {
        console.error(`Valor de status '${statusToUse}' não é válido para o esquema atual`);
        return new Response(
          JSON.stringify({ 
            error: `Erro interno: valor de status inválido para o banco de dados`
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const paymentData = {
        booking_id: booking.id,
        user_id: booking.user_id,
        mercadopago_payment_id: null,
        status: statusToUse,
        amount: booking.amount,
        payment_method: null,
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        raw_response: mpData
      };
      
      console.log("Inserindo pagamento com dados:", JSON.stringify(paymentData));
      
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert([paymentData])
        .select()
        .single();
      
      if (paymentError) {
        console.error("Erro ao registrar pagamento:", paymentError);
        return new Response(
          JSON.stringify({ 
            error: "Erro ao registrar pagamento", 
            details: paymentError.message 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const paymentUrl = integration.environment === 'production' 
        ? mpData.init_point 
        : mpData.sandbox_init_point;
      
      return new Response(
        JSON.stringify({
          success: true,
          payment_id: payment?.id,
          payment_url: paymentUrl,
          sandbox_url: mpData.sandbox_init_point,
          prod_url: mpData.init_point,
          environment: integration.environment
        }),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          } 
        }
      );
    } catch (mpError) {
      console.error("Erro ao se comunicar com o Mercado Pago:", mpError);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao se comunicar com o gateway de pagamento",
          details: mpError.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Erro interno no servidor"
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
