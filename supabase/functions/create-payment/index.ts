
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuração CORS - elemento crítico para resolver o problema
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Aceita requisições de qualquer origem
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // É CRUCIAL tratar a requisição OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    // Configuração do cliente Supabase
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
    
    // Obter o ID da reserva do corpo da requisição
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
    
    // Buscar detalhes da reserva
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
    
    // Verificar se já existe um pagamento para esta reserva
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
    
    // Obter a integração ativa do Mercado Pago
    // Usamos .maybeSingle() para evitar erros quando não há registros
    const { data: integration, error: integrationError } = await supabase
      .from("integrations_mercadopago")
      .select("access_token, environment")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .maybeSingle();
    
    // Verificar se há uma integração ativa configurada
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
          error: "Integração com MercadoPago não configurada ou inativa", 
          setup_required: true 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Nome da quadra e descrição para o pagamento
    const courtName = booking.court?.name || "Quadra";
    
    // Data e hora formatadas para exibição
    const bookingDate = new Date(booking.booking_date);
    const formattedDate = `${bookingDate.getDate()}/${bookingDate.getMonth() + 1}/${bookingDate.getFullYear()}`;
    
    // Criar preferência de pagamento no Mercado Pago
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
    
    // Fazer requisição para API do Mercado Pago
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
      
      // Verificar se a resposta do MercadoPago é bem-sucedida
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
      
      // Limpar pagamentos antigos (pendentes/expirados) para esta reserva
      if (existingPayment) {
        await supabase
          .from("payments")
          .update({ status: "cancelled" })
          .eq("booking_id", booking_id)
          .eq("status", "pending");
      }
      
      // Registrar o pagamento no banco de dados
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          booking_id: booking.id,
          user_id: booking.user_id,
          mercadopago_payment_id: null, // Será atualizado pelo webhook quando houver pagamento
          status: "pending",
          amount: booking.amount,
          payment_method: null, // Será atualizado pelo webhook
          expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h para expirar
          raw_response: mpData
        })
        .select()
        .single();
      
      if (paymentError) {
        console.error("Erro ao registrar pagamento:", paymentError);
        return new Response(
          JSON.stringify({ error: "Erro ao registrar pagamento" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Determinar qual URL usar com base no ambiente
      const paymentUrl = integration.environment === 'production' 
        ? mpData.init_point 
        : mpData.sandbox_init_point;
      
      // Retornar URL de pagamento
      return new Response(
        JSON.stringify({
          success: true,
          payment_id: payment.id,
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
