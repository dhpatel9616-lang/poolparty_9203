'use client';
import React from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchUserContracts, type UserContractSummary } from '@/lib/supabase/services';
import { useAuth } from '@/contexts/AuthContext';
import StatusBadge from '@/components/ui/StatusBadge';
import Link from 'next/link';

export default function ContractsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'all' | 'open' | 'locked' | 'resolved'>('all');
  const [contracts, setContracts] = React.useState<UserContractSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    fetchUserContracts(user.id)
      .then((data) => { if (!cancelled) setContracts(data); })
      .catch((err) => console.error('Failed to load contracts', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const filtered = contracts.filter((c) => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  const tabs = [
    { id: 'all' as const, label: 'All' },
    { id: 'open' as const, label: 'Open' },
    { id: 'locked' as const, label: 'Locked' },
    { id: 'resolved' as const, label: 'Resolved' },
  ];

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-24">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <h1 className="text-xl font-bold text-foreground">All Contracts</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--primary)' : 'var(--surface)',
                color: activeTab === tab.id ? '#fff' : 'var(--muted-foreground)',
                border: activeTab === tab.id ? 'none' : '1px solid var(--border)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading contracts...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((contract) => (
              <Link key={contract.id} href={`/contract-detail-screen?id=${contract.id}`}>
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs">{contract.group_emoji}</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          {contract.group_name}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                        {contract.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={contract.status as 'open' | 'locked' | 'resolved'} />
                      <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {contract.participant_count} participants{contract.stake_note ? ` · ${contract.stake_note}` : ''}
                  </p>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm font-semibold text-foreground">No contracts</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>No {activeTab} contracts found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
