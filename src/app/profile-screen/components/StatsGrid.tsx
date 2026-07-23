'use client';
import React, { useState, useEffect } from 'react';
import type { User } from '@/lib/mockData';
import { X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import { createClient } from '@/lib/supabase/client';

interface StatsGridProps {
  user: User;
}

type StatSheet = 'wins' | 'losses' | 'total' | 'disputes' | 'unpaid' | 'blacklists' | null;

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

interface ContractRow {
  id: string;
  title: string;
  status: string;
  groupName: string;
  isWin: boolean;
  isLoss: boolean;
}

interface DisputeRow {
  id: string;
  title: string;
  counterparty: string;
  status: string;
}

interface UnpaidRow {
  id: string;
  toUserName: string;
  poolTitle: string;
  amount: number;
  status: string;
}

function BottomSheet({ title, onClose, children }: BottomSheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '80dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
            <X size={14} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function StatsGrid({ user }: StatsGridProps) {
  const [openSheet, setOpenSheet] = useState<StatSheet>(null);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [unpaid, setUnpaid] = useState<UnpaidRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const supabase = createClient();

      const [entriesRes, disputesRes, unpaidRes] = await Promise.all([
        supabase
          .from('pool_entries')
          .select('id, pool:pool_id(id, title, status, winning_outcome_id, group_ids), outcome_id')
          .eq('user_id', user.id),
        supabase
          .from('disputes')
          .select('id, title, dispute_status, opened_by, against_user_id, opener:opened_by(full_name), against:against_user_id(full_name)')
          .or(`opened_by.eq.${user.id},against_user_id.eq.${user.id}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('settlements')
          .select('id, amount, settlement_status, pool:pool_id(title), recipient:recipient_id(full_name)')
          .eq('payer_id', user.id)
          .eq('settlement_status', 'pending'),
      ]);

      if (entriesRes.data) {
        const rows: ContractRow[] = entriesRes.data.map((e: any) => {
          const pool = Array.isArray(e.pool) ? e.pool[0] : e.pool;
          const isResolved = pool?.status === 'resolved';
          const isWin = isResolved && pool?.winning_outcome_id === e.outcome_id;
          const isLoss = isResolved && pool?.winning_outcome_id !== e.outcome_id;
          return {
            id: e.id,
            title: pool?.title || 'Untitled contract',
            status: pool?.status || 'open',
            groupName: '',
            isWin,
            isLoss,
          };
        });
        setContracts(rows);
      }

      if (disputesRes.data) {
        setDisputes(
          disputesRes.data.map((d: any) => {
            const opener = Array.isArray(d.opener) ? d.opener[0] : d.opener;
            const against = Array.isArray(d.against) ? d.against[0] : d.against;
            const counterparty = d.opened_by === user.id ? against?.full_name : opener?.full_name;
            return {
              id: d.id,
              title: d.title,
              counterparty: counterparty || 'Unknown',
              status: d.dispute_status,
            };
          })
        );
      }

      if (unpaidRes.data) {
        setUnpaid(
          unpaidRes.data.map((p: any) => {
            const pool = Array.isArray(p.pool) ? p.pool[0] : p.pool;
            const recipient = Array.isArray(p.recipient) ? p.recipient[0] : p.recipient;
            return {
              id: p.id,
              toUserName: recipient?.full_name || 'Unknown',
              poolTitle: pool?.title || 'Contract',
              amount: p.amount,
              status: p.settlement_status,
            };
          })
        );
      }

      setLoaded(true);
    };
    load();
  }, [user?.id]);

  const wins = contracts.filter((c) => c.isWin);
  const losses = contracts.filter((c) => c.isLoss);

  const STATS = [
    { id: 'wins' as StatSheet, label: 'Wins', value: user.wins, color: 'var(--success)' },
    { id: 'losses' as StatSheet, label: 'Losses', value: user.losses, color: 'var(--social)' },
    { id: 'total' as StatSheet, label: 'Total Played', value: user.totalContracts, color: 'var(--primary)' },
    { id: 'disputes' as StatSheet, label: 'Disputes', value: disputes.length, color: 'var(--warning)' },
    { id: 'unpaid' as StatSheet, label: 'Unpaid', value: unpaid.length, color: 'var(--social)' },
    { id: 'blacklists' as StatSheet, label: 'Blacklists', value: 0, color: 'var(--muted-foreground)' },
  ];

  return (
    <>
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Stats</h2>
        <div className="grid grid-cols-3 gap-2">
          {STATS.map((stat) => (
            <button
              key={stat.id}
              onClick={() => setOpenSheet(stat.id)}
              className="rounded-xl p-3 flex flex-col items-center gap-1 transition-all active:scale-95 card-interactive"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <span className="text-xl font-bold" style={{ color: stat.color, fontVariantNumeric: 'tabular-nums' }}>
                {loaded || stat.id === 'wins' || stat.id === 'losses' || stat.id === 'total' ? stat.value : '—'}
              </span>
              <span className="text-2xs font-medium text-center leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                {stat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Win rate bar */}
        <div className="mt-3 rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Win rate</span>
            <span className="text-xs font-bold" style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
              {user.winRate}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--elevated)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${user.winRate}%`,
                background: 'linear-gradient(90deg, var(--primary), #00C9A7)',
                transition: 'width 800ms ease',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
              {user.wins}W / {user.losses}L
            </span>
            <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
              {user.pending} pending
            </span>
          </div>
        </div>
      </div>

      {/* Wins Sheet */}
      {openSheet === 'wins' && (
        <BottomSheet title="Wins" onClose={() => setOpenSheet(null)}>
          {wins.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>No wins yet</p>
          ) : wins.map((c) => (
            <Link key={c.id} href={`/contract-detail-screen?id=${c.id}`} onClick={() => setOpenSheet(null)}>
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{c.title}</p>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
              </div>
            </Link>
          ))}
        </BottomSheet>
      )}

      {/* Losses Sheet */}
      {openSheet === 'losses' && (
        <BottomSheet title="Losses" onClose={() => setOpenSheet(null)}>
          {losses.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>No losses</p>
          ) : losses.map((c) => (
            <Link key={c.id} href={`/contract-detail-screen?id=${c.id}`} onClick={() => setOpenSheet(null)}>
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{c.title}</p>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
              </div>
            </Link>
          ))}
        </BottomSheet>
      )}

      {/* Total Played Sheet */}
      {openSheet === 'total' && (
        <BottomSheet title="All Contracts" onClose={() => setOpenSheet(null)}>
          {contracts.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>No contracts yet</p>
          ) : contracts.map((c) => (
            <Link key={c.id} href={`/contract-detail-screen?id=${c.id}`} onClick={() => setOpenSheet(null)}>
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <div className="flex-1 pr-2">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{c.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  {c.status === 'resolved' ? (
                    <span
                      className="pill-badge text-xs"
                      style={{
                        background: c.isWin ? 'rgba(0,230,118,0.12)' : 'rgba(255,77,141,0.12)',
                        color: c.isWin ? 'var(--success)' : 'var(--social)',
                      }}
                    >
                      {c.isWin ? 'Won' : 'Lost'}
                    </span>
                  ) : (
                    <StatusBadge status={c.status as any} />
                  )}
                  <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                </div>
              </div>
            </Link>
          ))}
        </BottomSheet>
      )}

      {/* Disputes Sheet */}
      {openSheet === 'disputes' && (
        <BottomSheet title="Disputes" onClose={() => setOpenSheet(null)}>
          {disputes.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>No disputes</p>
          ) : disputes.map((d) => (
            <Link key={d.id} href="/dispute-center" onClick={() => setOpenSheet(null)}>
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-semibold text-foreground">{d.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>vs {d.counterparty}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pill-badge text-xs" style={{ background: 'rgba(255,200,87,0.12)', color: 'var(--warning)' }}>
                    {d.status}
                  </span>
                  <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                </div>
              </div>
            </Link>
          ))}
        </BottomSheet>
      )}

      {/* Unpaid Sheet */}
      {openSheet === 'unpaid' && (
        <BottomSheet title="Unpaid" onClose={() => setOpenSheet(null)}>
          {unpaid.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>All paid up!</p>
          ) : unpaid.map((p) => (
            <div key={p.id} className="rounded-xl p-3" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.toUserName}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{p.poolTitle}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--social)', fontVariantNumeric: 'tabular-nums' }}>
                  -{p.amount}
                </span>
              </div>
              <span
                className="pill-badge text-xs"
                style={{ background: 'rgba(255,77,141,0.12)', color: 'var(--social)' }}
              >
                {p.status}
              </span>
            </div>
          ))}
        </BottomSheet>
      )}

      {/* Blacklists Sheet */}
      {openSheet === 'blacklists' && (
        <BottomSheet title="Blacklists" onClose={() => setOpenSheet(null)}>
          <div className="text-center py-8">
            <p className="text-sm font-semibold text-foreground">Not blacklisted anywhere</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Groups that blacklist you will appear here
            </p>
          </div>
        </BottomSheet>
      )}
    </>
  );
}