
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stripeSecretKey } = await req.json();

    if (!stripeSecretKey) {
      throw new Error("Chave secreta do Stripe não fornecida");
    }

    // Inicializa o Stripe com a chave fornecida
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Tenta fazer uma chamada simples para verificar se a chave é válida
    const balance = await stripe.balance.retrieve();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conexão com o Stripe estabelecida com sucesso",
        data: {
          available: balance.available.map(obj => ({
            amount: obj.amount,
            currency: obj.currency,
          })),
          pending: balance.pending.map(obj => ({
            amount: obj.amount,
            currency: obj.currency,
          })),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro ao testar a conexão com o Stripe:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao conectar ao Stripe: ${error.message}`,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
