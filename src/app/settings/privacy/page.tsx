'use client';
import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function PrivacyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [effectiveDate, setEffectiveDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase?.from('legal_documents')?.select('effective_date')?.eq('document_type', 'privacy')?.eq('status', 'published')?.order('created_at', { ascending: false })?.limit(1)?.single();
      if (data) setEffectiveDate(data?.effective_date || '');
      setLoading(false);
    };
    load();
  }, []);

  const SECTIONS = [
    { title: '1. Information We Collect', body: 'Account Information: Name, username, email, phone number, profile photo, login credentials, authentication provider.\n\nApp Activity: Groups joined, pools created, entries locked, outcomes, disputes, trust score activity, reports, invitations, profile interactions.\n\nDevice and Technical Information: Device type, browser, IP address, app version, operating system, error logs, analytics events.\n\nContacts: If users grant permission, PoolParty may access contacts to help invite friends or group members.\n\nUser Content: PoolParty collects content users submit, including pool titles, descriptions, comments, messages, reports, and dispute information.' },
    { title: '2. How We Use Information', body: 'PoolParty uses information to create and manage accounts, operate groups and pools, track entries and outcomes, calculate reputation indicators, improve safety, handle disputes, provide support, send notifications, improve app performance, prevent fraud and abuse, and comply with legal obligations.' },
    { title: '3. How We Share Information', body: 'PoolParty may share limited information with other users based on app activity, with service providers helping operate the app, when required by law, to protect users or the platform, or during a business transfer or acquisition. PoolParty does not sell personal information.' },
    { title: '4. User Controls', body: 'Users may edit profile information, manage notifications, request account deletion, contact support, and request privacy assistance.' },
    { title: '5. Data Retention', body: 'PoolParty retains information as needed to operate the app, maintain safety, resolve disputes, comply with law, and protect legitimate business interests.' },
    { title: '6. Security', body: 'PoolParty uses reasonable technical and organizational measures to protect user information. No system can guarantee complete security.' },
    { title: '7. Children', body: 'PoolParty is not intended for children under 13. If future versions support younger users, additional parental consent and child privacy protections must be implemented.' },
    { title: '8. Changes to Policy', body: 'PoolParty may update this Privacy Policy. Users may be notified of material changes.' },
    { title: '9. Contact', body: 'Privacy questions may be sent to: privacy@poolpartyapp.com' },
  ];

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b"
          style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => router?.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <h1 className="text-xl font-bold text-foreground">Privacy Policy</h1>
        </div>

        <div className="px-4 py-6 pb-24 overflow-y-auto space-y-5">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3]?.map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--elevated)' }} />)}
            </div>
          ) : (
            <>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.2)' }}>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <span className="font-semibold text-foreground">Effective Date:</span>{' '}
                  {effectiveDate ? new Date(effectiveDate)?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'See current version'}
                </p>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                PoolParty respects user privacy. This Privacy Policy explains what information we collect, how we use it, and the choices users have.
              </p>

              {SECTIONS?.map((s) => (
                <div key={s?.title} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <h3 className="text-sm font-bold text-foreground mb-2">{s?.title}</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--muted-foreground)' }}>{s?.body}</p>
                </div>
              ))}

              <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Also see our{' '}
                  <Link href="/settings/terms" className="underline font-semibold" style={{ color: 'var(--primary)' }}>Terms of Service</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
