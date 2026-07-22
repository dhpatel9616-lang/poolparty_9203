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

// ─── Phone normalization helper ───────────────────────────────────────────────

function toE164(phone: string, defaultCountry = '1'): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return '+' + digits;
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  return `+${digits}`;
}

// ─── Plivo SMS send ───────────────────────────────────────────────────────────

async function sendSMS(to: string, messageText: string): Promise<void> {
  const authId = Deno.env.get('PLIVO_AUTH_ID') ?? '';
  const authToken = Deno.env.get('PLIVO_AUTH_TOKEN') ?? '';
  const fromNumber = Deno.env.get('PLIVO_PHONE_NUMBER') ?? '';

  const credentials = btoa(`${authId}:${authToken}`);
  const recipientPhone = toE164(to);

  const response = await fetch(
    `https://api.plivo.com/v1/Account/${authId}/Message/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        src: fromNumber,
        dst: recipientPhone,
        text: messageText,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Plivo SMS failed: ${response.status} — ${errorBody}`);
  }
}

// ─── Edge Function Handler ────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { settlement_item_id, nudge_type = 'payment_reminder' } = await req.json();

    if (!settlement_item_id) {
      return new Response(
        JSON.stringify({ error: 'settlement_item_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch settlement item with payer and receiver info
    const { data: item, error: itemError } = await supabase
      .from('settlement_items')
      .select(`
        *,
        payer:payer_id(id, display_name, phone),
        receiver:receiver_id(id, display_name, phone)
      `)
      .eq('id', settlement_item_id)
      .single();

    if (itemError || !item) {
      return new Response(
        JSON.stringify({ error: 'Settlement item not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (item.status !== 'unpaid') {
      return new Response(
        JSON.stringify({ error: 'Settlement item is not unpaid — nudge skipped' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payerPhone = item.payer?.phone;
    const payerName = item.payer?.display_name ?? 'Someone';
    const receiverName = item.receiver?.display_name ?? 'your friend';
    const amountNote = item.amount_note ?? 'the agreed amount';

    if (!payerPhone) {
      return new Response(
        JSON.stringify({ error: 'Payer has no phone number on file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build message text (same content as before, only provider changes)
    const messageText = nudge_type === 'payment_reminder'
      ? `PoolParty reminder: You owe ${receiverName} ${amountNote}. Mark as paid in the app when done. PoolParty does not process payments.`
      : `PoolParty: ${receiverName} has marked a payment to you as paid. Please confirm in the app.`;

    // Send via Plivo
    await sendSMS(payerPhone, messageText);

    // Log notification record
    await supabase.from('notifications').insert({
      user_id: item.payer_id,
      title: 'Payment Reminder',
      body: messageText,
      type: 'nudge_sent',
      created_at: new Date().toISOString(),
    });

    // Log activity
    await supabase.from('activities').insert({
      activity_type: 'nudge_sent',
      actor_id: item.receiver_id,
      pool_id: item.pool_id,
      metadata: { settlement_item_id, nudge_type },
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, to: toE164(payerPhone), nudge_type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
