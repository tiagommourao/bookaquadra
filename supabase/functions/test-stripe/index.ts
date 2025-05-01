
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secretKey } = await req.json();
    
    if (!secretKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Chave secreta não fornecida'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Try to fetch balance to test if the API key is valid
    try {
      await stripe.balance.retrieve();
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Conexão com o Stripe estabelecida com sucesso',
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Erro ao testar a conexão com o Stripe:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: `Falha na conexão com o Stripe: ${error.message}`,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    console.error('Erro interno:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro interno do servidor: ${error.message}`,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
