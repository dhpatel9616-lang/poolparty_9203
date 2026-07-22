'use client';
import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, CheckCircle, Clock, AlertTriangle, XCircle, Upload, ChevronDown, ChevronUp, DollarSign, Shield, Flag, RefreshCw,  } from 'lucide-react';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import SettlementBadges, { SettlementBadgeMetrics, computeSettlementBadges } from '@/components/ui/SettlementBadges';


interface Settlement {
  id: string;
  pool_id: string | null;
  payer_id: string;
  recipient_id: string;
  amount: number;
  settlement_status: string;
  due_date: string | null;
  created_at: string;
  payer?: { full_name: string; username: string };
  recipient?: { full_name: string; username: string };
  pool?: { title: string };
  confirmation?: { proof_url: string | null; payer_confirmed_at: string | null; recipient_confirmed_at: string | null };
  recipient_payment_methods?: PaymentMethod[];
  recipient_reputation?: SettlementBadgeMetrics | null;
  payer_reputation?: SettlementBadgeMetrics | null;
}

interface PaymentMethod {
  id: string;
  method_type: string;
  username: string | null;
  payment_url: string | null;
  qr_code_url: string | null;
  priority: number;
}

interface UserReputation {
  trust_score: number;
  reliability_score: number;
  unpaid_count: number;
  dispute_count: number;
  total_paid: number;
  total_received: number;
  on_time_percentage: number;
  pools_won: number;
  pools_lost: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: '#FFC857', bg: 'rgba(255,200,87,0.12)', icon: Clock },
  claimed_paid: { label: 'Claimed Paid', color: '#7C5CFF', bg: 'rgba(124,92,255,0.12)', icon: CheckCircle },
  confirmed_received: { label: 'Confirmed', color: '#00E676', bg: 'rgba(0,230,118,0.12)', icon: CheckCircle },
  disputed: { label: 'Disputed', color: '#FF4D8D', bg: 'rgba(255,77,141,0.12)', icon: Flag },
  overdue: { label: 'Overdue', color: '#FF9632', bg: 'rgba(255,150,50,0.12)', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: XCircle },
};

const METHOD_LABELS: Record<string, string> = {
  zelle: 'Zelle', venmo: 'Venmo', cash_app: 'Cash App',
  apple_pay: 'Apple Pay', paypal: 'PayPal', other: 'Other',
};

const METHOD_COLORS: Record<string, string> = {
  zelle: '#6C1CD1', venmo: '#3D95CE', cash_app: '#00D64F',
  apple_pay: '#000000', paypal: '#003087', other: '#7C5CFF',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function PaymentMethodChip({ method }: { method: PaymentMethod }) {
  const color = METHOD_COLORS[method.method_type] ?? '#7C5CFF';
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
      style={{ background: `${color}18`, border: `1px solid ${color}30` }}
    >
      <span className="font-semibold" style={{ color }}>{METHOD_LABELS[method.method_type] ?? method.method_type}</span>
      {method.username && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{method.username}</span>}
      {method.payment_url && (
        <a
          href={method.payment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium underline"
          style={{ color }}
        >
          Pay
        </a>
      )}
    </div>
  );
}

function LoserCard({ settlement, onMarkPaid, onUploadProof }: {
  settlement: Settlement;
  onMarkPaid: (id: string) => void;
  onUploadProof: (id: string, file: File) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const recipientName = settlement.recipient?.full_name ?? settlement.recipient?.username ?? 'Recipient';
  const methods = settlement.recipient_payment_methods ?? [];
  const earnedBadges = computeSettlementBadges(settlement.recipient_reputation ?? null).filter((b) => b.earned);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                You owe
              </span>
              <StatusBadge status={settlement.settlement_status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: '#FF4D8D' }}>
                ${Number(settlement.amount).toFixed(2)}
              </span>
              <ArrowRight size={16} style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-base font-semibold text-foreground">{recipientName}</span>
            </div>
            {earnedBadges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {earnedBadges.map((badge) => (
                  <span
                    key={badge.key}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-2xs font-semibold"
                    style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}30` }}
                    title={badge.desc}
                  >
                    {badge.emoji} {badge.label}
                  </span>
                ))}
              </div>
            )}
            {settlement.pool?.title && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Pool: {settlement.pool.title}
              </p>
            )}
            {settlement.due_date && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Due: {new Date(settlement.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            {expanded ? <ChevronUp size={14} style={{ color: 'var(--muted-foreground)' }} /> : <ChevronDown size={14} style={{ color: 'var(--muted-foreground)' }} />}
          </button>
        </div>

        {/* Action buttons */}
        {settlement.settlement_status === 'pending' || settlement.settlement_status === 'overdue' ? (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onMarkPaid(settlement.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              Mark as Paid
            </button>
            <label
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all active:scale-95"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
            >
              <Upload size={14} />
              Proof
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadProof(settlement.id, file);
                }}
              />
            </label>
          </div>
        ) : null}
      </div>

      {/* Expanded: payment methods */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold pt-3" style={{ color: 'var(--muted-foreground)' }}>
            PAYMENT METHODS FOR {recipientName.toUpperCase()}
          </p>
          {methods.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {methods.map((m) => <PaymentMethodChip key={m.id} method={m} />)}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No payment methods on file. Contact recipient directly.</p>
          )}
          {settlement.confirmation?.proof_url && (
            <div className="mt-2">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>PROOF UPLOADED</p>
              <img
                src={settlement.confirmation.proof_url}
                alt="Payment proof screenshot"
                className="rounded-xl max-h-32 object-cover"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WinnerCard({ settlement, onConfirmReceived, onDispute }: {
  settlement: Settlement;
  onConfirmReceived: (id: string) => void;
  onDispute: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const payerName = settlement.payer?.full_name ?? settlement.payer?.username ?? 'Payer';
  const earnedBadges = computeSettlementBadges(settlement.payer_reputation ?? null).filter((b) => b.earned);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                Expected from
              </span>
              <StatusBadge status={settlement.settlement_status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">{payerName}</span>
              <ArrowRight size={16} style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-2xl font-bold" style={{ color: '#00E676' }}>
                ${Number(settlement.amount).toFixed(2)}
              </span>
            </div>
            {earnedBadges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {earnedBadges.map((badge) => (
                  <span
                    key={badge.key}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-2xs font-semibold"
                    style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}30` }}
                    title={badge.desc}
                  >
                    {badge.emoji} {badge.label}
                  </span>
                ))}
              </div>
            )}
            {settlement.pool?.title && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Pool: {settlement.pool.title}
              </p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            {expanded ? <ChevronUp size={14} style={{ color: 'var(--muted-foreground)' }} /> : <ChevronDown size={14} style={{ color: 'var(--muted-foreground)' }} />}
          </button>
        </div>

        {settlement.settlement_status === 'claimed_paid' && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onConfirmReceived(settlement.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{ background: '#00E676', color: '#000' }}
            >
              Confirm Received
            </button>
            <button
              onClick={() => onDispute(settlement.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ background: 'rgba(255,77,141,0.12)', color: '#FF4D8D', border: '1px solid rgba(255,77,141,0.25)' }}
            >
              Dispute
            </button>
          </div>
        )}
      </div>

      {expanded && settlement.confirmation?.proof_url && (
        <div className="px-4 pb-4 pt-0" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold pt-3 mb-2" style={{ color: 'var(--muted-foreground)' }}>PAYMENT PROOF</p>
          <img
            src={settlement.confirmation.proof_url}
            alt="Payment proof screenshot"
            className="rounded-xl max-h-40 object-cover"
          />
        </div>
      )}
    </div>
  );
}

export default function SettlementPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'owe' | 'receive'>('owe');
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [settlementsRes, reputationRes] = await Promise.all([
        supabase
          .from('settlements')
          .select(`
            *,
            payer:payer_id(full_name, username),
            recipient:recipient_id(full_name, username),
            pool:pool_id(title),
            confirmation:settlement_confirmations(proof_url, payer_confirmed_at, recipient_confirmed_at)
          `)
          .or(`payer_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_reputation')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const rawSettlements = settlementsRes.data ?? [];

      // Fetch recipient payment methods for settlements where user is payer
      const payerSettlements = rawSettlements.filter((s: any) => s.payer_id === user.id);
      const recipientIds = [...new Set(payerSettlements.map((s: any) => s.recipient_id))] as string[];

      // Fetch payer IDs for settlements where user is recipient
      const receiverSettlements = rawSettlements.filter((s: any) => s.recipient_id === user.id);
      const payerIds = [...new Set(receiverSettlements.map((s: any) => s.payer_id))] as string[];

      // All counterparty IDs to fetch reputation for
      const allCounterpartyIds = [...new Set([...recipientIds, ...payerIds])];

      let paymentMethodsMap: Record<string, PaymentMethod[]> = {};
      let reputationMap: Record<string, SettlementBadgeMetrics> = {};

      await Promise.all([
        // Payment methods for recipients
        recipientIds.length > 0
          ? supabase
              .from('payment_methods')
              .select('*')
              .in('user_id', recipientIds)
              .eq('is_active', true)
              .order('priority', { ascending: true })
              .then(({ data: pmData }) => {
                (pmData ?? []).forEach((pm: any) => {
                  if (!paymentMethodsMap[pm.user_id]) paymentMethodsMap[pm.user_id] = [];
                  paymentMethodsMap[pm.user_id].push(pm);
                });
              })
          : Promise.resolve(),
        // Reputation for all counterparties (for badge display)
        allCounterpartyIds.length > 0
          ? supabase
              .from('user_reputation')
              .select('*')
              .in('user_id', allCounterpartyIds)
              .then(({ data: repData }) => {
                (repData ?? []).forEach((rep: any) => {
                  reputationMap[rep.user_id] = rep;
                });
              })
          : Promise.resolve(),
      ]);

      const enriched = rawSettlements.map((s: any) => ({
        ...s,
        confirmation: Array.isArray(s.confirmation) ? s.confirmation[0] : s.confirmation,
        recipient_payment_methods: s.payer_id === user.id ? (paymentMethodsMap[s.recipient_id] ?? []) : [],
        recipient_reputation: s.payer_id === user.id ? (reputationMap[s.recipient_id] ?? null) : null,
        payer_reputation: s.recipient_id === user.id ? (reputationMap[s.payer_id] ?? null) : null,
      }));

      setSettlements(enriched);
      setReputation(reputationRes.data);
    } catch (err) {
      console.error('Settlement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleMarkPaid = async (settlementId: string) => {
    const { error } = await supabase
      .from('settlements')
      .update({ settlement_status: 'claimed_paid', updated_at: new Date().toISOString() })
      .eq('id', settlementId)
      .eq('payer_id', user?.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Marked as paid! Waiting for recipient confirmation.');
      fetchData();
    }
  };

  const handleUploadProof = async (settlementId: string, file: File) => {
    const path = `settlement-proofs/${settlementId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('settlement-proofs')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Upload failed. Please try again.');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('settlement-proofs').getPublicUrl(path);

    const { data: existing } = await supabase
      .from('settlement_confirmations')
      .select('id')
      .eq('settlement_id', settlementId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('settlement_confirmations')
        .update({ proof_url: publicUrl, payer_confirmed_at: new Date().toISOString() })
        .eq('settlement_id', settlementId);
    } else {
      await supabase
        .from('settlement_confirmations')
        .insert({ settlement_id: settlementId, proof_url: publicUrl, payer_confirmed_at: new Date().toISOString() });
    }

    toast.success('Proof uploaded!');
    fetchData();
  };

  const handleConfirmReceived = async (settlementId: string) => {
    const { error } = await supabase
      .from('settlements')
      .update({ settlement_status: 'confirmed_received', updated_at: new Date().toISOString() })
      .eq('id', settlementId)
      .eq('recipient_id', user?.id);

    if (error) {
      toast.error('Failed to confirm');
    } else {
      await supabase
        .from('settlement_confirmations')
        .upsert({ settlement_id: settlementId, recipient_confirmed_at: new Date().toISOString() }, { onConflict: 'settlement_id' });
      toast.success('Payment confirmed! Reputation updated.');
      fetchData();
    }
  };

  const handleDispute = async (settlementId: string) => {
    const { error: statusError } = await supabase
      .from('settlements')
      .update({ settlement_status: 'disputed', updated_at: new Date().toISOString() })
      .eq('id', settlementId)
      .eq('recipient_id', user?.id);

    if (!statusError) {
      await supabase
        .from('settlement_disputes')
        .insert({ settlement_id: settlementId, opened_by: user?.id, reason: 'Payment not received' });
      toast.success('Dispute opened. Admin will review.');
      fetchData();
    }
  };

  const myOwed = settlements.filter((s) => s.payer_id === user?.id);
  const myReceivable = settlements.filter((s) => s.recipient_id === user?.id);

  const totalOwed = myOwed
    .filter((s) => ['pending', 'overdue', 'claimed_paid'].includes(s.settlement_status))
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const totalReceivable = myReceivable
    .filter((s) => ['pending', 'claimed_paid'].includes(s.settlement_status))
    .reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-24 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-xl font-bold text-foreground">Settlement</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              PoolParty tracks obligations only — pay outside the platform
            </p>
          </div>
          <button
            onClick={fetchData}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <RefreshCw size={15} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,77,141,0.08)', border: '1px solid rgba(255,77,141,0.2)' }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: '#FF4D8D' }}>YOU OWE</p>
            <p className="text-2xl font-bold" style={{ color: '#FF4D8D' }}>${totalOwed.toFixed(2)}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{myOwed.filter(s => s.settlement_status !== 'confirmed_received' && s.settlement_status !== 'cancelled').length} pending</p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: '#00E676' }}>YOU RECEIVE</p>
            <p className="text-2xl font-bold" style={{ color: '#00E676' }}>${totalReceivable.toFixed(2)}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{myReceivable.filter(s => s.settlement_status !== 'confirmed_received' && s.settlement_status !== 'cancelled').length} pending</p>
          </div>
        </div>

        {/* Reputation Strip */}
        {reputation && (
          <div
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <Shield size={18} style={{ color: '#7C5CFF' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Trust</p>
                <p className="text-base font-bold" style={{ color: '#7C5CFF' }}>{Number(reputation.trust_score).toFixed(0)}</p>
              </div>
            </div>
            <div className="w-px h-8" style={{ background: 'var(--border)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Reliability</p>
              <p className="text-base font-bold" style={{ color: '#00C9A7' }}>{Number(reputation.reliability_score).toFixed(0)}</p>
            </div>
            <div className="w-px h-8" style={{ background: 'var(--border)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>On-time</p>
              <p className="text-base font-bold text-foreground">{Number(reputation.on_time_percentage).toFixed(0)}%</p>
            </div>
            <div className="w-px h-8" style={{ background: 'var(--border)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Disputes</p>
              <p className="text-base font-bold" style={{ color: reputation.dispute_count > 0 ? '#FF4D8D' : 'var(--foreground)' }}>
                {reputation.dispute_count}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {[
            { key: 'owe', label: 'I Owe', count: myOwed.filter(s => !['confirmed_received','cancelled'].includes(s.settlement_status)).length },
            { key: 'receive', label: 'I Receive', count: myReceivable.filter(s => !['confirmed_received','cancelled'].includes(s.settlement_status)).length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'owe' | 'receive')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === t.key ? 'var(--primary)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--muted-foreground)',
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: tab === t.key ? 'rgba(255,255,255,0.25)' : 'rgba(124,92,255,0.15)',
                    color: tab === t.key ? '#fff' : '#7C5CFF',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Settlement List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl h-28" style={{ background: 'var(--surface)' }} />
            ))}
          </div>
        ) : tab === 'owe' ? (
          myOwed.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={40} className="mx-auto mb-3" style={{ color: '#00E676' }} />
              <p className="text-base font-semibold text-foreground">All clear!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>No outstanding obligations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOwed.map((s) => (
                <LoserCard
                  key={s.id}
                  settlement={s}
                  onMarkPaid={handleMarkPaid}
                  onUploadProof={handleUploadProof}
                />
              ))}
            </div>
          )
        ) : (
          myReceivable.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign size={40} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-base font-semibold text-foreground">Nothing expected</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>No incoming settlements.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myReceivable.map((s) => (
                <WinnerCard
                  key={s.id}
                  settlement={s}
                  onConfirmReceived={handleConfirmReceived}
                  onDispute={handleDispute}
                />
              ))}
            </div>
          )
        )}

        {/* Disclaimer */}
        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            PoolParty does not process, hold, or transfer money. All payments occur outside this platform. This tool tracks obligations and reputation only.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
