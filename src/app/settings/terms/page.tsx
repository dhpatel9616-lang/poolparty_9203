'use client';
import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function TermsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [body, setBody] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase?.from('legal_documents')?.select('body, effective_date, version_number')?.eq('document_type', 'terms')?.eq('status', 'published')?.order('created_at', { ascending: false })?.limit(1)?.single();
      if (data) {
        setBody(data?.body || '');
        setEffectiveDate(data?.effective_date || '');
      }
      setLoading(false);
    };
    load();
  }, []);

  const SECTIONS = [
    { title: '1. Description of Service', body: 'PoolParty is a private group prediction, agreement-tracking, and reputation platform. Users may create groups, create pools, make predictions, lock entries, track outcomes, and build reputation through app activity.' },
    { title: '2. No Gambling, Sportsbook, Escrow, or Payment Services', body: 'PoolParty is not a gambling platform, sportsbook, casino, betting exchange, broker, bank, escrow provider, money transmitter, payment processor, or financial institution. PoolParty does not accept wagers, process bets, hold user funds, transfer money between users, guarantee payment, enforce outside financial arrangements, provide odds as a sportsbook, or provide financial advice. Any outside arrangement between users occurs outside of PoolParty and is solely the responsibility of those users.' },
    { title: '3. User Responsibility', body: 'Users are responsible for their account activity, the pools they create, the accuracy of information they submit, their interactions with other users, following applicable laws, following group rules, and following PoolParty guidelines.' },
    { title: '4. Pools and Outcomes', body: 'Pool creators and group admins are responsible for creating clear pool rules, deadlines, outcomes, and resolution methods. PoolParty may review, remove, or restrict pools that violate platform rules.' },
    { title: '5. Disputes', body: 'PoolParty may provide tools to report and review disputes. PoolParty is not required to resolve every dispute and does not guarantee any particular outcome.' },
    { title: '6. Trust Scores and Reputation', body: 'Trust scores are informational reputation indicators. They are not guarantees of identity, honesty, payment ability, future behavior, or reliability.' },
    { title: '7. User Content', body: 'Users are responsible for content they submit. PoolParty may remove content that violates these Terms, Community Guidelines, or applicable law.' },
    { title: '8. Prohibited Conduct', body: 'Users may not harass others, threaten others, commit fraud, create misleading pools, use PoolParty for illegal gambling, impersonate others, abuse dispute tools, spam users, upload harmful content, or attempt to hack or disrupt the platform.' },
    { title: '9. Account Suspension or Termination', body: 'PoolParty may suspend, restrict, or terminate accounts that violate these Terms or create risk for the platform or users.' },
    { title: '10. Privacy', body: 'Use of PoolParty is also governed by the Privacy Policy.' },
    { title: '11. Changes to Terms', body: 'PoolParty may update these Terms. Continued use of the app after updates means you accept the revised Terms.' },
    { title: '12. Contact', body: 'Questions about these Terms may be sent to: legal@poolpartyapp.com' },
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
          <h1 className="text-xl font-bold text-foreground">Terms of Service</h1>
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
                Welcome to PoolParty. These Terms of Service govern your access to and use of the PoolParty application, website, services, features, and related tools. By using PoolParty, you agree to these Terms.
              </p>

              {SECTIONS?.map((s) => (
                <div key={s?.title} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <h3 className="text-sm font-bold text-foreground mb-2">{s?.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{s?.body}</p>
                </div>
              ))}

              <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Also see our{' '}
                  <Link href="/settings/privacy" className="underline font-semibold" style={{ color: 'var(--primary)' }}>Privacy Policy</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
