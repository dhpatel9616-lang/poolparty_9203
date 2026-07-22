import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { pool_id, winning_outcome_id, evidence, resolved_by } = await req.json();

    if (!pool_id || !winning_outcome_id) {
      return new Response(
        JSON.stringify({ error: 'pool_id and winning_outcome_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Fetch pool and entries
    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .select('*, pool_outcomes(*), pool_entries(*)')
      .eq('id', pool_id)
      .single();

    if (poolError || !pool) {
      return new Response(
        JSON.stringify({ error: 'Pool not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Mark pool as resolved
    await supabase
      .from('pools')
      .update({ status: 'resolved', winning_outcome_id, resolved_at: new Date().toISOString() })
      .eq('id', pool_id);

    // 3. Create pool_resolutions record
    await supabase.from('pool_resolutions').insert({
      pool_id,
      winning_outcome_id,
      resolved_by,
      evidence_text: evidence?.text ?? null,
      evidence_url: evidence?.url ?? null,
      created_at: new Date().toISOString(),
    });

    // 4. Create settlement_items for each entry
    const entries = pool.pool_entries ?? [];
    const winningOutcome = pool.pool_outcomes?.find((o: any) => o.id === winning_outcome_id);
    const settlementItems = [];

    for (const entry of entries) {
      const isWinner = entry.outcome_id === winning_outcome_id;
      const weight = winningOutcome?.weight ?? 0;
      let profit = 0;
      if (isWinner) {
        if (weight > 0) profit = entry.amount * (weight / 100);
        else if (weight < 0) profit = entry.amount * (100 / Math.abs(weight));
        else profit = entry.amount;
      }

      settlementItems.push({
        pool_id,
        payer_id: isWinner ? null : entry.user_id,
        receiver_id: isWinner ? entry.user_id : null,
        amount_note: `${entry.stake_note ?? pool.stake_note ?? 'Settlement'}`,
        return_amount: isWinner ? entry.amount + profit : 0,
        status: 'unpaid',
        created_at: new Date().toISOString(),
      });
    }

    if (settlementItems.length > 0) {
      await supabase.from('settlement_items').insert(settlementItems);
    }

    // 5. Log activity
    await supabase.from('activities').insert({
      activity_type: 'contract_resolved',
      pool_id,
      actor_id: resolved_by,
      metadata: { winning_outcome_id },
      created_at: new Date().toISOString(),
    });

    // 6. Update trust scores for winners (+15)
    for (const entry of entries) {
      if (entry.outcome_id === winning_outcome_id) {
        await supabase.functions.invoke('update-trust-score', {
          body: { user_id: entry.user_id, delta: 15, reason: 'win_contract', pool_id },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, pool_id, winning_outcome_id, settlements_created: settlementItems.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
