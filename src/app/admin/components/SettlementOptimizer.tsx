'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,  } from 'recharts';
import { CheckCircle, Clock, AlertTriangle, Flag, Shield, Users, DollarSign, RefreshCw, ChevronDown, ChevronUp, Gavel, Ban,  } from 'lucide-react';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';


interface SettlementRow {
  id: string;
  payer_id: string;
  recipient_id: string;
  amount: number;
  settlement_status: string;
  due_date: string | null;
  created_at: string;
  payer?: { full_name: string; username: string };
  recipient?: { full_name: string; username: string };
  pool?: { title: string };
}

interface DisputeRow {
  id: string;
  settlement_id: string;
  opened_by: string;
  reason: string;
  dispute_status: string;
  created_at: string;
  opener?: { full_name: string };
  settlement?: { amount: number; payer?: { full_name: string }; recipient?: { full_name: string } };
}

interface ReputationRow {
  user_id: string;
  trust_score: number;
  reliability_score: number;
  unpaid_count: number;
  dispute_count: number;
  total_paid: number;
  total_received: number;
  on_time_percentage: number;
  user?: { full_name: string; username: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFC857',
  claimed_paid: '#7C5CFF',
  confirmed_received: '#00E676',
  disputed: '#FF4D8D',
  overdue: '#FF9632',
  cancelled: '#6B7280',
};

function StatCard({ label, value, icon: Icon, color, bg, trend, trendUp }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; bg: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"
            style={{ background: trendUp ? 'rgba(0,230,118,0.12)' : 'rgba(255,77,141,0.12)', color: trendUp ? '#00E676' : '#FF4D8D' }}>
            {trendUp ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      </div>
    </div>
  );
}

export default function SettlementOptimizer() {
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [reputations, setReputations] = useState<ReputationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'settlements' | 'disputes' | 'reputation'>('overview');
  const supabase = createClient();

  const fetchAll = async () => {
    setLoading(true);
    const [sRes, dRes, rRes] = await Promise.all([
      supabase
        .from('settlements')
        .select('*, payer:payer_id(full_name, username), recipient:recipient_id(full_name, username), pool:pool_id(title)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('settlement_disputes')
        .select('*, opener:opened_by(full_name), settlement:settlement_id(amount, payer:payer_id(full_name), recipient:recipient_id(full_name))')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('user_reputation')
        .select('*, user:user_id(full_name, username)')
        .order('trust_score', { ascending: true })
        .limit(50),
    ]);
    setSettlements(sRes.data ?? []);
    setDisputes(dRes.data ?? []);
    setReputations(rRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleResolveDispute = async (disputeId: string, resolution: string) => {
    const { error } = await supabase
      .from('settlement_disputes')
      .update({ dispute_status: 'resolved', resolution, resolved_at: new Date().toISOString() })
      .eq('id', disputeId);
    if (error) toast.error('Failed to resolve dispute');
    else { toast.success('Dispute resolved'); fetchAll(); }
  };

  const handleUpdateSettlementStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('settlements')
      .update({ settlement_status: status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('Failed to update');
    else { toast.success('Status updated'); fetchAll(); }
  };

  const handleAdjustTrustScore = async (userId: string, delta: number) => {
    const current = reputations.find(r => r.user_id === userId);
    if (!current) return;
    const newScore = Math.max(0, Math.min(100, Number(current.trust_score) + delta));
    const { error } = await supabase
      .from('user_reputation')
      .update({ trust_score: newScore, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) toast.error('Failed to adjust score');
    else { toast.success(`Trust score ${delta > 0 ? '+' : ''}${delta}`); fetchAll(); }
  };

  // Compute stats
  const statusCounts = settlements.reduce((acc: Record<string, number>, s) => {
    acc[s.settlement_status] = (acc[s.settlement_status] ?? 0) + 1;
    return acc;
  }, {});

  const totalAmount = settlements.reduce((sum, s) => sum + Number(s.amount), 0);
  const confirmedAmount = settlements
    .filter(s => s.settlement_status === 'confirmed_received')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.replace('_', ' '),
    count,
    fill: STATUS_COLORS[status] ?? '#7C5CFF',
  }));

  const openDisputes = disputes.filter(d => d.dispute_status === 'open');
  const usersWithUnpaid = reputations.filter(r => r.unpaid_count > 0).sort((a, b) => b.unpaid_count - a.unpaid_count);

  const SECTIONS = [
    { key: 'overview', label: 'Overview' },
    { key: 'settlements', label: 'Settlements' },
    { key: 'disputes', label: `Disputes (${openDisputes.length})` },
    { key: 'reputation', label: 'Reputation' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settlement Optimizer</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Debt-matching engine, payment tracking, and reputation management
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key as any)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeSection === s.key ? 'var(--primary)' : 'var(--surface)',
              color: activeSection === s.key ? '#fff' : 'var(--muted-foreground)',
              border: `1px solid ${activeSection === s.key ? 'var(--primary)' : 'var(--border)'}`,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="animate-pulse rounded-2xl h-28" style={{ background: 'var(--surface)' }} />)}
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Total Settlements" value={settlements.length} icon={DollarSign} color="#7C5CFF" bg="rgba(124,92,255,0.12)" />
                <StatCard label="Confirmed" value={statusCounts.confirmed_received ?? 0} icon={CheckCircle} color="#00E676" bg="rgba(0,230,118,0.12)" trend={`${Math.round(((statusCounts.confirmed_received ?? 0) / Math.max(settlements.length, 1)) * 100)}%`} trendUp />
                <StatCard label="Open Disputes" value={openDisputes.length} icon={Flag} color="#FF4D8D" bg="rgba(255,77,141,0.12)" trendUp={false} />
                <StatCard label="Overdue" value={statusCounts.overdue ?? 0} icon={AlertTriangle} color="#FF9632" bg="rgba(255,150,50,0.12)" trendUp={false} />
                <StatCard label="Pending" value={statusCounts.pending ?? 0} icon={Clock} color="#FFC857" bg="rgba(255,200,87,0.12)" />
                <StatCard label="Claimed Paid" value={statusCounts.claimed_paid ?? 0} icon={Shield} color="#00C9A7" bg="rgba(0,201,167,0.12)" />
                <StatCard label="Total Tracked" value={`$${totalAmount.toFixed(0)}`} icon={DollarSign} color="#FFC857" bg="rgba(255,200,87,0.12)" />
                <StatCard label="Confirmed Amount" value={`$${confirmedAmount.toFixed(0)}`} icon={CheckCircle} color="#00E676" bg="rgba(0,230,118,0.12)" />
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <h2 className="text-base font-semibold text-foreground mb-4">Settlement Status Distribution</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,68,0.5)" vertical={false} />
                      <XAxis dataKey="status" tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }} />
                      <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <rect key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Users with most unpaid */}
              {usersWithUnpaid.length > 0 && (
                <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <h2 className="text-base font-semibold text-foreground mb-4">Users with Unpaid Obligations</h2>
                  <div className="space-y-2">
                    {usersWithUnpaid.slice(0, 10).map((r) => (
                      <div key={r.user_id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--elevated)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(255,77,141,0.12)', color: '#FF4D8D' }}>
                          {(r.user?.full_name ?? 'U').charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{r.user?.full_name ?? 'Unknown'}</p>
                          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Trust: {Number(r.trust_score).toFixed(0)} · Disputes: {r.dispute_count}</p>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#FF4D8D' }}>{r.unpaid_count} unpaid</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SETTLEMENTS */}
          {activeSection === 'settlements' && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-base font-semibold text-foreground">All Settlements</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{settlements.length} total</p>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {settlements.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No settlements yet</p>
                  </div>
                ) : settlements.map((s) => (
                  <div key={s.id} className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {s.payer?.full_name ?? 'Payer'} → {s.recipient?.full_name ?? 'Recipient'}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${STATUS_COLORS[s.settlement_status] ?? '#7C5CFF'}18`, color: STATUS_COLORS[s.settlement_status] ?? '#7C5CFF' }}
                        >
                          {s.settlement_status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        ${Number(s.amount).toFixed(2)} · {s.pool?.title ?? 'No pool'} · {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <select
                      value={s.settlement_status}
                      onChange={(e) => handleUpdateSettlementStatus(s.id, e.target.value)}
                      className="text-xs px-2 py-1.5 rounded-lg outline-none"
                      style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    >
                      {['pending','claimed_paid','confirmed_received','disputed','overdue','cancelled'].map(st => (
                        <option key={st} value={st}>{st.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DISPUTES */}
          {activeSection === 'disputes' && (
            <div className="space-y-3">
              {disputes.length === 0 ? (
                <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <CheckCircle size={36} className="mx-auto mb-3" style={{ color: '#00E676' }} />
                  <p className="text-base font-semibold text-foreground">No disputes</p>
                </div>
              ) : disputes.map((d) => (
                <div key={d.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,77,141,0.12)' }}>
                      <Flag size={16} style={{ color: '#FF4D8D' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          Dispute by {d.opener?.full_name ?? 'Unknown'}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: d.dispute_status === 'open' ? 'rgba(255,77,141,0.12)' : 'rgba(0,230,118,0.12)',
                            color: d.dispute_status === 'open' ? '#FF4D8D' : '#00E676',
                          }}
                        >
                          {d.dispute_status}
                        </span>
                      </div>
                      <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                        Reason: {d.reason}
                      </p>
                      {d.settlement && (
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          Settlement: ${Number(d.settlement.amount).toFixed(2)} · {new Date(d.created_at).toLocaleDateString()}
                        </p>
                      )}
                      {d.dispute_status === 'open' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleResolveDispute(d.id, 'Resolved by admin — payment confirmed')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(0,230,118,0.12)', color: '#00E676', border: '1px solid rgba(0,230,118,0.25)' }}
                          >
                            <Gavel size={12} />
                            Resolve
                          </button>
                          <button
                            onClick={() => handleResolveDispute(d.id, 'Dismissed by admin')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(255,150,50,0.12)', color: '#FF9632', border: '1px solid rgba(255,150,50,0.25)' }}
                          >
                            <Ban size={12} />
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REPUTATION */}
          {activeSection === 'reputation' && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-base font-semibold text-foreground">User Reputation Scores</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Sorted by lowest trust score</p>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {reputations.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No reputation data yet</p>
                  </div>
                ) : reputations.map((r) => (
                  <div key={r.user_id} className="p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: 'rgba(124,92,255,0.12)', color: '#7C5CFF' }}>
                      {(r.user?.full_name ?? 'U').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{r.user?.full_name ?? 'Unknown'}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Trust: <strong style={{ color: '#7C5CFF' }}>{Number(r.trust_score).toFixed(0)}</strong></span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Reliability: <strong style={{ color: '#00C9A7' }}>{Number(r.reliability_score).toFixed(0)}</strong></span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Unpaid: <strong style={{ color: r.unpaid_count > 0 ? '#FF4D8D' : 'var(--foreground)' }}>{r.unpaid_count}</strong></span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Disputes: <strong style={{ color: r.dispute_count > 0 ? '#FF9632' : 'var(--foreground)' }}>{r.dispute_count}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustTrustScore(r.user_id, -5)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(255,77,141,0.12)', color: '#FF4D8D' }}
                        title="Decrease trust -5"
                      >
                        −
                      </button>
                      <button
                        onClick={() => handleAdjustTrustScore(r.user_id, 5)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(0,230,118,0.12)', color: '#00E676' }}
                        title="Increase trust +5"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Compliance footer */}
      <div className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          PoolParty does not process payments or hold funds. All settlement tracking is user-reported only.
        </p>
      </div>
    </div>
  );
}
