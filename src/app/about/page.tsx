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

export default function PublicAboutPage() {
  const supabase = createClient();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('cms_pages')
        .select('title,body,meta_description,published_at')
        .eq('slug', 'about')
        .eq('status', 'published')
        .maybeSingle();
      setPage(data ?? null);
      setLoading(false);
    };
    load();
  }, []);

  const publishedDate = page?.published_at
    ? new Date(page.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  return (
    <PublicPageLayout
      title={page?.title ?? 'About PoolParty'}
      subtitle={publishedDate ? `Last updated: ${publishedDate}` : undefined}
      accentColor="#7C5CFF"
    >
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--elevated)' }} />
          ))}
        </div>
      ) : page?.body ? (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--foreground)' }}
          >
            {page.body}
          </div>
        </div>
      ) : (
        /* Fallback static content */
        <div className="space-y-5">
          <div className="flex flex-col items-center py-6">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mb-4"
              style={{ background: 'linear-gradient(135deg, #0052FF, #7C5CFF, #00C9A7)' }}
            >
              🎱
            </div>
            <h2 className="text-2xl font-bold text-foreground">PoolParty</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Version 1.0.0</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
              PoolParty is a private group prediction and agreement-tracking app built for friends, communities, teams, and groups that want to make predictions, track outcomes, and build trust through reputation.
            </p>
            <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--muted-foreground)' }}>
              PoolParty is not a gambling platform, sportsbook, casino, trading platform, escrow service, or payment processor. The app does not process wagers, hold funds, move money, or guarantee payment between users.
            </p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.2)' }}>
            <p className="text-xs leading-relaxed text-center" style={{ color: 'var(--muted-foreground)' }}>
              PoolParty does not process payments, hold funds, or enforce outside agreements.
            </p>
          </div>
        </div>
      )}
    </PublicPageLayout>
  );
}
