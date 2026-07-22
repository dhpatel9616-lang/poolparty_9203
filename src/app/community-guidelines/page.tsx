'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PublicPageLayout from '@/components/PublicPageLayout';
import { CheckCircle, XCircle } from 'lucide-react';

interface CmsPage {
  title: string;
  body: string | null;
  meta_description: string | null;
  published_at: string | null;
}

const ALLOWED = [
  'Friendly predictions', 'Private group pools', 'Sports predictions',
  'Entertainment predictions', 'Personal challenge pools', 'Pop culture predictions',
  'Community-based agreements', 'Transparent group competitions',
];

const NOT_ALLOWED = [
  'Harassment', 'Threats', 'Hate speech', 'Fraud', 'Scams', 'Impersonation',
  'Spam', 'Illegal gambling activity', 'Payment collection through PoolParty',
  'Manipulated or misleading pools', 'Fake accounts', 'Abuse of disputes',
];

export default function PublicCommunityGuidelinesPage() {
  const supabase = createClient();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('cms_pages')
        .select('title,body,meta_description,published_at')
        .eq('slug', 'community-guidelines')
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
      title={page?.title ?? 'Community Guidelines'}
      subtitle={publishedDate ? `Last updated: ${publishedDate}` : 'How we keep PoolParty safe and fun for everyone'}
      accentColor="#EC4899"
    >
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--elevated)' }} />
          ))}
        </div>
      ) : page?.body ? (
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
            {page.body}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            PoolParty is for friendly, private, and transparent prediction-based engagement. Every user is expected to participate honestly and respectfully.
          </p>

          {/* Allowed */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} style={{ color: '#00C9A7' }} />
              <h3 className="text-base font-bold text-foreground">Allowed</h3>
            </div>
            <div className="space-y-2">
              {ALLOWED.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00C9A7' }} />
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Not Allowed */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={18} style={{ color: 'var(--social)' }} />
              <h3 className="text-base font-bold text-foreground">Not Allowed</h3>
            </div>
            <div className="space-y-2">
              {NOT_ALLOWED.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--social)' }} />
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Violations */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,77,141,0.06)', border: '1px solid rgba(255,77,141,0.2)' }}>
            <h4 className="text-sm font-bold text-foreground mb-1">Violations</h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              PoolParty may remove pools, hide content, limit account access, suspend users, or permanently ban users who violate these guidelines.
            </p>
          </div>
        </div>
      )}
    </PublicPageLayout>
  );
}
