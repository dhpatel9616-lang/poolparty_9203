import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/client';

function toE164(phone: string, defaultCountry = '1'): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return '+' + digits;
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  return `+${digits}`;
}

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
    }

    const e164 = toE164(phone);
    const supabase = createServiceRoleClient();

    const { data: entry, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', e164)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !entry) {
      return NextResponse.json({ error: 'No OTP found for this number. Please request a new code.' }, { status: 400 });
    }

    if (new Date(entry.expires_at).getTime() < Date.now()) {
      await supabase.from('otp_codes').delete().eq('id', entry.id);
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      await supabase.from('otp_codes').delete().eq('id', entry.id);
      return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new code.' }, { status: 429 });
    }

    if (entry.code !== String(code).trim()) {
      await supabase.from('otp_codes').update({ attempts: entry.attempts + 1 }).eq('id', entry.id);
      const remaining = MAX_ATTEMPTS - (entry.attempts + 1);
      return NextResponse.json(
        { error: remaining > 0 ? `Incorrect code. ${remaining} attempt(s) remaining.` : 'Incorrect code. Please request a new one.' },
        { status: 400 }
      );
    }

    // Code is valid — clean up so it can't be reused.
    await supabase.from('otp_codes').delete().eq('id', entry.id);

    return NextResponse.json({ success: true, e164 });
  } catch (err: any) {
    console.error('verify-otp error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}