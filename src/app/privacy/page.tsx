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
  { title: '1. Information We Collect', content: 'We collect information you provide directly: name, email address, phone number (optional), and profile information. We also collect usage data such as prediction history, trust scores, and group activity.' },
  { title: '2. How We Use Your Information', content: 'We use your information to provide and improve the PoolParty service, calculate your Trust Score, send notifications about pool activity, resolve disputes, and communicate important updates.' },
  { title: '3. Information Sharing', content: 'We do not sell your personal information. We share information only with other users as part of the normal service, service providers who help us operate PoolParty, and when required by law.' },
  { title: '4. Data Security', content: 'We use industry-standard security measures to protect your data. Your password is encrypted and never stored in plain text.' },
  { title: '5. Your Rights', content: 'You have the right to access your personal data, correct inaccurate data, request deletion of your data, export your data, and opt out of marketing communications.' },
  { title: '6. Contact Us', content: 'For privacy-related questions, contact us at privacy@poolparty.app' },
];

export default function PublicPrivacyPage() {
  const supabase = createClient();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('cms_pages')
        .select('title,body,meta_description,published_at')
        .eq('slug', 'privacy')
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
      title={page?.title ?? 'Privacy Policy'}
      subtitle={`Last updated: ${publishedDate}`}
      accentColor="#3B82F6"
    >
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--elevated)' }} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(0,201,167,0.08)', border: '1px solid rgba(0,201,167,0.2)' }}>
            <p className="text-sm font-bold text-foreground mb-1">🔒 Your Privacy Matters</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              PoolParty is committed to protecting your personal information. We collect only what is necessary to provide our service.
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
