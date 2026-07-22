'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PublicPageLayout from '@/components/PublicPageLayout';

interface CmsPage {
  title: string;
  body: string | null;
  meta_description: string | null;
  published_at: string | null;
}

const FALLBACK_SECTIONS = [
  { title: '1. Acceptance of Terms', content: 'By accessing or using PoolParty, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.' },
  { title: '2. Description of Service', content: 'PoolParty is a social platform that allows users to create and participate in prediction contracts with friends and groups. PoolParty does not process payments, hold funds, or facilitate gambling of any kind.' },
  { title: '3. User Accounts', content: 'You must create an account to use PoolParty. You are responsible for maintaining the security of your account. You must be at least 18 years old to use this service.' },
  { title: '4. Acceptable Use', content: 'You agree not to use PoolParty for any unlawful purpose, to harass other users, to post false information, or to engage in any activity that violates applicable laws.' },
  { title: '5. Limitation of Liability', content: 'PoolParty is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including any financial losses resulting from prediction contracts.' },
  { title: '6. Contact', content: 'For questions about these terms, contact us at legal@poolparty.app' },
];

export default function PublicTermsPage() {
  const supabase = createClient();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('cms_pages')
        .select('title,body,meta_description,published_at')
        .eq('slug', 'terms')
        .eq('status', 'published')
        .maybeSingle();
      setPage(data ?? null);
      setLoading(false);
    };
    load();
  }, []);

  const publishedDate = page?.published_at
    ? new Date(page.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'May 2026';

  return (
    <PublicPageLayout
      title={page?.title ?? 'Terms of Service'}
      subtitle={`Last updated: ${publishedDate}`}
      accentColor="#F59E0B"
    >
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--elevated)' }} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.2)' }}>
            <p className="text-sm font-bold text-foreground mb-1">⚠️ Important Notice</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              PoolParty is a social prediction tracking platform. We do not process payments, hold funds, or facilitate gambling.
            </p>
          </div>

          {page?.body ? (
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                {page.body}
              </div>
            </div>
          ) : (
            FALLBACK_SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-sm font-bold text-foreground mb-2">{section.title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{section.content}</p>
              </div>
            ))
          )}
        </div>
      )}
    </PublicPageLayout>
  );
}
