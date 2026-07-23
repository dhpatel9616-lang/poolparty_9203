'use client';
import React, { useState, useEffect } from 'react';
import { Users, Clock, AlertCircle, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import type { HomeFilter } from './QuickStatsStrip';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { fetchUserDisputes, updateSettlementStatus } from '@/lib/supabase/services';
import { useSettlementsRealtime } from '@/lib/supabase/realtime';
import BottomSheet from '@/components/ui/BottomSheet';

interface FilteredContentProps {
  filter: HomeFilter;
  searchQuery?: string;
}

// ---- Owed to You panel ----
function OwedToYouPanel() {
  const { user } = useAuth();
  const { items } = useSettlementsRealtime();
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const myItems = items.filter(
    (p) => p.recipient_id === user?.id && (p.settlement_status === 'pending' || p.settlement_status === 'claimed_paid')
  );

  const handleConfirm = async (id: string) => {
    setConfirmedIds((prev) => new Set([...prev, id]));
    try {
      await updateSettlementStatus(id, 'confirmed_received');
    } catch {}
  };

  if (myItems.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm font-semibold text-foreground">Nothing owed to you</p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>All payments received!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3 px-1">
        <AlertCircle size={12} style={{ color: 'var(--warning)' }} />
        <p className="text-xs" style={{ color: 'var(--warning)' }}>
          PoolParty does not process payments or hold funds
        </p>
      </div>
      {myItems.map((p) => {
        const isConfirmed = confirmedIds.has(p.id);
        return (
          <div
            key={p.id}
            className="rounded-xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(0,230,118,0.15)', color: 'var(--success)' }}
                >
                  P
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Payer</p>
                  {p.due_date && (
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Due {new Date(p.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
                +${p.amount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="pill-badge text-xs"
                style={{
                  background: p.settlement_status === 'claimed_paid' ? 'rgba(0,230,118,0.12)' : 'rgba(255,77,141,0.12)',
                  color: p.settlement_status === 'claimed_paid' ? 'var(--success)' : 'var(--social)',
                }}
              >
                {p.settlement_status === 'claimed_paid' ? 'Awaiting confirm' : 'Unpaid'}
              </span>
              {p.settlement_status === 'claimed_paid' && !isConfirmed && (
                <button
                  onClick={() => handleConfirm(p.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                  style={{ background: 'rgba(0,230,118,0.15)', color: 'var(--success)' }}
                >
                  <Check size={10} />
                  Confirm Received
                </button>
              )}
              {isConfirmed && (
                <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>✓ Confirmed</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- You Owe panel ----
function YouOwePanel() {
  const { user } = useAuth();
  const { items } = useSettlementsRealtime();
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState<string | null>(null);
  const [methodNote, setMethodNote] = useState('');

  const myItems = items.filter(
    (p) => p.payer_id === user?.id && p.settlement_status === 'pending'
  );

  const handleMarkPaid = async (id: string) => {
    setPaidIds((prev) => new Set([...prev, id]));
    setShowModal(null);
    setMethodNote('');
    try {
      await updateSettlementStatus(id, 'claimed_paid');
    } catch {}
  };

  const currentPayment = items.find((p) => p.id === showModal);

  if (myItems.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm font-semibold text-foreground">You&apos;re all settled up!</p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>No outstanding payments</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3 px-1">
          <AlertCircle size={12} style={{ color: 'var(--warning)' }} />
          <p className="text-xs" style={{ color: 'var(--warning)' }}>
            PoolParty does not process payments or hold funds
          </p>
        </div>
        {myItems.map((p) => {
          const isPaid = paidIds.has(p.id);
          return (
            <div
              key={p.id}
              className="rounded-xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(255,77,141,0.15)', color: 'var(--social)' }}
                  >
                    R
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Receiver</p>
                    {p.due_date && (
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        Due {new Date(p.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--social)', fontVariantNumeric: 'tabular-nums' }}>
                  -${p.amount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="pill-badge text-xs cursor-default select-none"
                    style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)' }}
                  >
                    See Settlement tab for payment details
                  </span>
                </div>
                {isPaid ? (
                  <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>✓ Marked Paid</span>
                ) : (
                  <button
                    onClick={() => setShowModal(p.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(124,92,255,0.15)', color: 'var(--primary)' }}
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BottomSheet isOpen={!!(showModal && currentPayment)} onClose={() => setShowModal(null)} title="Mark as Paid" maxHeightVh={70}>
        {currentPayment && (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Confirm you&apos;ve sent <span className="font-semibold text-foreground">${currentPayment.amount}</span> outside of PoolParty.
              PoolParty does not process or verify this payment.
            </p>
            <input
              type="text"
              value={methodNote}
              onChange={(e) => setMethodNote(e.target.value)}
              placeholder="e.g. Sent via Venmo (optional)"
              className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none"
              style={{
                background: 'var(--elevated)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkPaid(showModal!)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                Confirm
              </button>
            </div>
          </>
        )}
      </BottomSheet>
    </>
  );
}

// ---- Disputes panel ----
function DisputesPanel() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchUserDisputes(user.id).then((data) => {
      setDisputes(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return <div className="text-center py-8"><p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading disputes...</p></div>;
  }

  if (disputes.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm font-semibold text-foreground">No active disputes</p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>All clear!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {disputes.map((d) => (
        <Link
          key={d.id}
          href="/dispute-center"
          className="block rounded-xl p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-foreground">{d.title}</p>
            <span
              className="pill-badge text-xs"
              style={{
                background: d.dispute_status === 'open' ? 'rgba(255,200,87,0.12)' : 'rgba(124,92,255,0.12)',
                color: d.dispute_status === 'open' ? 'var(--warning)' : 'var(--primary)',
              }}
            >
              {d.dispute_status}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{d.description?.slice(0, 80)}...</p>
        </Link>
      ))}
    </div>
  );
}

// ---- Active Contracts panel ----
function ActiveContractsPanel({ searchQuery }: { searchQuery?: string }) {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const supabase = createClient();
    supabase
      .from('pools')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setContracts(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const filtered = contracts.filter((c) =>
    !searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8"><p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</p></div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm font-semibold text-foreground">No active contracts</p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((c) => (
        <Link
          key={c.id}
          href={`/contract-detail-screen?id=${c.id}`}
          className="block rounded-xl p-4 card-interactive"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{c.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Users size={11} style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {c.participant_count ?? 0} joined
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={11} style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {c.entry_deadline ? new Date(c.entry_deadline).toLocaleDateString() : 'Open'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={c.status} />
              <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function FilteredContent({ filter, searchQuery }: FilteredContentProps) {
  if (!filter) {
    return <ActiveContractsPanel searchQuery={searchQuery} />;
  }

  return (
    <div className="mt-2">
      {filter === 'active' && <ActiveContractsPanel searchQuery={searchQuery} />}
      {filter === 'owed' && <OwedToYouPanel />}
      {filter === 'you-owe' && <YouOwePanel />}
      {filter === 'disputes' && <DisputesPanel />}
    </div>
  );
}
