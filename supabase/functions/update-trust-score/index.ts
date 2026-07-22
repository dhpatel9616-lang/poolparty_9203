import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIER_THRESHOLDS = {
  Excellent: 800,
  Good: 600,
  Risky: 400,
};

function getTier(score: number): string {
  if (score >= TIER_THRESHOLDS.Excellent) return 'Excellent';
  if (score >= TIER_THRESHOLDS.Good) return 'Good';
  if (score >= TIER_THRESHOLDS.Risky) return 'Risky';
  return 'Unreliable';
}

const BADGE_RULES: { badge: string; check: (stats: any) => boolean }[] = [
  { badge: 'Perfect Payer', check: (s) => s.paid_on_time_percent >= 100 && s.total_confirmed >= 5 },
  { badge: 'Excellent Tier', check: (s) => s.score >= 800 },
  { badge: 'Zero Disputes', check: (s) => s.dispute_count === 0 && s.total_contracts >= 5 },
  { badge: '5-Win Streak', check: (s) => s.win_streak >= 5 },
  { badge: 'Top Predictor', check: (s) => s.win_rate >= 70 && s.total_contracts >= 10 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      (globalThis as any).Deno.env.get('SUPABASE_URL') ?? '',
      (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, delta, reason, pool_id } = await req.json();

    if (!user_id || typeof delta !== 'number' || !reason) {
      return new Response(
        JSON.stringify({ error: 'user_id, delta, and reason are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Fetch current reputation score
    const { data: repScore } = await supabase
      .from('reputation_scores')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    const currentScore = repScore?.score ?? 500;
    const newScore = Math.max(0, Math.min(1000, currentScore + delta));
    const newTier = getTier(newScore);

    // 2. Upsert reputation score
    await supabase.from('reputation_scores').upsert(
      {
        user_id,
        score: newScore,
        tier: newTier,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    // 3. Log accuracy/settlement history
    await supabase.from('settlement_reputation').insert({
      user_id,
      delta,
      reason,
      pool_id: pool_id ?? null,
      score_before: currentScore,
      score_after: newScore,
      created_at: new Date().toISOString(),
    });

    // 4. Check and award badges
    const { data: userStats } = await supabase
      .from('user_behavior_profiles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    const stats = {
      score: newScore,
      paid_on_time_percent: userStats?.settlement_reliability ?? 0,
      total_confirmed: 0,
      dispute_count: 0,
      total_contracts: 0,
      win_streak: 0,
      win_rate: 0,
    };

    const { data: existingBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', user_id);

    const existingBadgeIds = new Set((existingBadges ?? []).map((b: any) => b.badge_id));

    for (const rule of BADGE_RULES) {
      if (rule.check(stats) && !existingBadgeIds.has(rule.badge)) {
        const { data: badge } = await supabase
          .from('badges')
          .select('id')
          .eq('name', rule.badge)
          .maybeSingle();

        if (badge) {
          await supabase.from('user_badges').insert({
            user_id,
            badge_id: badge.id,
            earned_at: new Date().toISOString(),
          });

          await supabase.from('activities').insert({
            activity_type: 'badge_earned',
            actor_id: user_id,
            metadata: { badge: rule.badge },
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id,
        score_before: currentScore,
        score_after: newScore,
        delta,
        tier: newTier,
        reason,
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
