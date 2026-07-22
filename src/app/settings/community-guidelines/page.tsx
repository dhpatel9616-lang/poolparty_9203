'use client';
import React from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ALLOWED = [
  'Friendly predictions', 'Private group pools', 'Sports predictions',
  'Entertainment predictions', 'Personal challenge pools', 'Pop culture predictions',
  'Community-based agreements', 'Transparent group competitions',
];

const NOT_ALLOWED = [
  'Harassment', 'Threats', 'Hate speech', 'Fraud', 'Scams', 'Impersonation',
  'Spam', 'Illegal gambling activity', 'Payment collection through PoolParty',
  'Manipulated or misleading pools', 'Fake accounts', 'Abuse of disputes',
  'Posting private information without permission',
];

export default function CommunityGuidelinesPage() {
  const router = useRouter();

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b"
          style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => router?.push('/settings')}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <h1 className="text-xl font-bold text-foreground">Community Guidelines</h1>
        </div>

        <div className="px-4 py-6 pb-24 overflow-y-auto space-y-5">
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
              {ALLOWED?.map((item) => (
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
              {NOT_ALLOWED?.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--social)' }} />
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pool Rules */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-bold text-foreground mb-3">Pool Rules</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>Every pool should include:</p>
            <div className="space-y-1.5">
              {['Clear question', 'Clear outcome options', 'Deadline', 'Resolution method', 'Participation rules', 'Any group-specific expectations']?.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{r}</p>
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
      </div>
    </MobileLayout>
  );
}
