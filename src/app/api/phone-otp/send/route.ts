import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/client';

function toE164(phone: string, defaultCountry = '1'): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return '+' + digits;
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  return `+${digits}`;
}

const RESEND_COOLDOWN_MS = 60 * 1000; // must wait 60s between requests for the same number
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const e164 = toE164(phone);
    const supabase = createServiceRoleClient();

    // Rate limit: block resending if a code was requested for this number very recently.
    const { data: recent } = await supabase
      .from('otp_codes')
      .select('created_at')
      .eq('phone', e164)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const elapsed = Date.now() - new Date(recent.created_at).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSeconds}s before requesting another code.` },
          { status: 429 }
        );
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    // Clear any old codes for this number before issuing a new one.
    await supabase.from('otp_codes').delete().eq('phone', e164);

    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({ phone: e164, code, expires_at: expiresAt });

    if (insertError) {
      console.error('Failed to store OTP code:', insertError);
      return NextResponse.json({ error: 'Could not generate code. Please try again.' }, { status: 500 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 });
    }

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const body = new URLSearchParams({
      To: e164,
      From: fromNumber,
      Body: `Your PoolParty Easy Login code is: ${code}. Valid for 10 minutes.`,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Twilio error:', err);
      return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
    }

    return NextResponse.json({ success: true, e164 });
  } catch (err: any) {
    console.error('send-otp error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}