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

    const { group_id, invite_code, inviter_name, group_name, recipient_phone } = await req.json();

    if (!group_id || !invite_code || !recipient_phone) {
      return new Response(
        JSON.stringify({ error: 'group_id, invite_code, and recipient_phone are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const inviteLink = `${Deno.env.get('NEXT_PUBLIC_SITE_URL') ?? 'https://poolparty3501.builtwithrocket.new'}/invite/${invite_code}`;
    const senderName = inviter_name ?? 'Someone';
    const poolGroupName = group_name ?? 'a PoolParty group';

    // Message content stays identical — only provider changes
    const messageText = `${senderName} challenged you to join ${poolGroupName} on PoolParty. You need an invite to join: ${inviteLink}`;

    // Send via Plivo
    await sendSMS(recipient_phone, messageText);

    // Create group_invites record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase.from('group_invites').upsert(
      {
        group_id,
        invite_code,
        phone: toE164(recipient_phone),
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      },
      { onConflict: 'invite_code' }
    );

    return new Response(
      JSON.stringify({ success: true, to: toE164(recipient_phone), invite_code }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
