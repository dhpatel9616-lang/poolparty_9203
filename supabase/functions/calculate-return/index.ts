import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, weight } = await req.json();

    if (typeof amount !== 'number' || typeof weight !== 'number') {
      return new Response(
        JSON.stringify({ error: 'amount and weight must be numbers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let profit: number;
    if (weight > 0) {
      profit = amount * (weight / 100);
    } else if (weight < 0) {
      profit = amount * (100 / Math.abs(weight));
    } else {
      profit = amount;
    }

    const totalReturn = amount + profit;

    return new Response(
      JSON.stringify({
        amount,
        weight,
        profit: Math.round(profit * 100) / 100,
        totalReturn: Math.round(totalReturn * 100) / 100,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
