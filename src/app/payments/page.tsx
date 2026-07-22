'use client';
import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft, AlertCircle, Check, Bell, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSettlementItemsRealtime } from '@/lib/supabase/realtime';
import { updateSettlementStatus, sendNudge } from '@/lib/supabase/services';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  type: string;
  handle: string;
}

function PaymentMethodsList({ methods }: { methods: PaymentMethod[] }) {
  if (!methods || methods.length === 0) return null;
  return (
    <div
      className="mt-2 p-3 rounded-xl space-y-1.5"
      style={{ background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.15)' }}
    >
      <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--primary)' }}>
        💳 Pay via:
      </p>
      {methods.map((m, i) => (
        <div key={i} className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{m.type}</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-lg"
            style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}
          >
            {m.handle}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, loading } = useSettlementItemsRealtime();
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState<string | null>(null);
  const [methodNote, setMethodNote] = useState('');
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [nudgedIds, setNudgedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'owe' | 'owed'>('all');

  const allPayments = items.filter(
    (p) => p.payer_id === user?.id || p.receiver_id === user?.id
  );

  const filteredPayments = allPayments.filter((p) => {
    if (activeTab === 'owe') return p.payer_id === user?.id;
    if (activeTab === 'owed') return p.receiver_id === user?.id;
    return true;
  });

  const currentPayment = items.find((p) => p.id === showModal);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarkPaid = async (id: string) => {
    setPaidIds((prev) => new Set([...prev, id]));
    setShowModal(null);
    setMethodNote('');
    try {
      await updateSettlementStatus(id, 'paid');
    } catch {}
  };

  const handleConfirm = async (id: string) => {
    setConfirmedIds((prev) => new Set([...prev, id]));
    try {
      await updateSettlementStatus(id, 'confirmed');
    } catch {}
  };

  const handleNudge = async (itemId: string, payerId: string | null) => {
    if (nudgedIds.has(itemId) || !user || !payerId) return;
    setNudgedIds((prev) => new Set([...prev, itemId]));
    try {
      await sendNudge({ to_user_id: payerId, from_user_id: user.id });
      toast.success('Nudge sent! 📲');
    } catch {
      toast.success('Nudge queued 📲');
    }
  };

  // Summary counts for winner tracking
  const owedToMe = allPayments.filter((p) => p.receiver_id === user?.id);
  const unpaidCount = owedToMe.filter((p) => p.status === 'unpaid' && !paidIds.has(p.id)).length;
  const paidCount = owedToMe.filter((p) => paidIds.has(p.id) || p.status === 'paid' || p.status === 'confirmed').length;

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-24">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router?.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <h1 className="text-xl font-bold text-foreground">Payments</h1>
        </div>

        <div
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,200,87,0.08)', border: '1px solid rgba(255,200,87,0.2)' }}
        >
          <AlertCircle size={12} style={{ color: 'var(--warning)' }} />
          <p className="text-xs" style={{ color: 'var(--warning)' }}>
            PoolParty does not process payments or hold funds.
          </p>
        </div>

        {/* Winner tracking summary */}
        {owedToMe.length > 0 && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
              🏆 Winner Tracker
            </p>
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(255,200,87,0.08)', border: '1px solid rgba(255,200,87,0.2)' }}>
                <p className="text-xl font-bold" style={{ color: 'var(--warning)' }}>{unpaidCount}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Unpaid</p>
              </div>
              <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}>
                <p className="text-xl font-bold" style={{ color: 'var(--success)' }}>{paidCount}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Paid</p>
              </div>
              <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.2)' }}>
                <p className="text-xl font-bold" style={{ color: 'var(--primary)' }}>{owedToMe.length}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Total</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'owe', 'owed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab ? 'var(--primary)' : 'var(--surface)',
                color: activeTab === tab ? '#fff' : 'var(--muted-foreground)',
                border: `1px solid ${activeTab === tab ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {tab === 'all' ? 'All' : tab === 'owe' ? 'I Owe' : 'Owed to Me'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: 80 }} />
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold text-foreground">No payments yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Payments will appear here after pools resolve</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((p) => {
              const isOwed = p.receiver_id === user?.id;
              const isPaid = paidIds.has(p.id) || p.status === 'paid';
              const isConfirmed = confirmedIds.has(p.id) || p.status === 'confirmed';
              const isExpanded = expandedIds.has(p.id);
              const winnerMethods: PaymentMethod[] = p.winner_payment_methods ?? [];
              const hasPaymentMethods = !isOwed && winnerMethods.length > 0;

              return (
                <div
                  key={p.id}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {isOwed ? `Owed by ${p.payer_name || 'player'}` : `You owe ${p.receiver_name || 'winner'}`}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {p.pool_title || p.amount_note}
                      </p>
                    </div>
                    <span
                      className="text-lg font-bold ml-2 flex-shrink-0"
                      style={{ color: isOwed ? 'var(--success)' : 'var(--social)', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {isOwed ? '+' : '-'}${p.return_amount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className="pill-badge text-xs"
                      style={{
                        background: isConfirmed
                          ? 'rgba(0,230,118,0.12)'
                          : isPaid
                          ? 'rgba(124,92,255,0.12)'
                          : p.status === 'disputed' ? 'rgba(255,77,141,0.12)' : 'rgba(255,200,87,0.12)',
                        color: isConfirmed
                          ? 'var(--success)'
                          : isPaid
                          ? 'var(--primary)'
                          : p.status === 'disputed' ? 'var(--social)' : 'var(--warning)',
                      }}
                    >
                      {isConfirmed ? '✓ Confirmed' : isPaid ? 'Paid — awaiting confirm' : p.status === 'disputed' ? 'Disputed' : 'Unpaid'}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Show payment methods toggle for losers */}
                      {hasPaymentMethods && !isPaid && (
                        <button
                          onClick={() => toggleExpand(p.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all active:scale-90"
                          style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}
                        >
                          <CreditCard size={10} />
                          How to pay
                          {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>
                      )}
                      {isOwed && isPaid && !isConfirmed && (
                        <button
                          onClick={() => handleConfirm(p.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                          style={{ background: 'rgba(0,230,118,0.15)', color: 'var(--success)' }}
                        >
                          <Check size={10} />
                          Confirm
                        </button>
                      )}
                      {isOwed && !isPaid && (
                        <button
                          onClick={() => handleNudge(p.id, p.payer_id)}
                          disabled={nudgedIds.has(p.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all active:scale-90"
                          style={{
                            background: nudgedIds.has(p.id) ? 'var(--elevated)' : 'rgba(124,92,255,0.15)',
                            color: nudgedIds.has(p.id) ? 'var(--muted-foreground)' : 'var(--primary)',
                          }}
                        >
                          <Bell size={10} />
                          {nudgedIds.has(p.id) ? 'Nudged' : 'Nudge'}
                        </button>
                      )}
                      {!isOwed && !isPaid && (
                        <button
                          onClick={() => setShowModal(p.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                          style={{ background: 'rgba(124,92,255,0.15)', color: 'var(--primary)' }}
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded payment methods for loser */}
                  {isExpanded && hasPaymentMethods && (
                    <PaymentMethodsList methods={winnerMethods} />
                  )}

                  {/* Always show payment methods for loser if not paid and no expand toggle */}
                  {!isOwed && !isPaid && !hasPaymentMethods && (
                    <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                      Contact {p.receiver_name || 'the winner'} directly for payment details.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mark as Paid Modal */}
        {showModal && currentPayment && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowModal(null)}
          >
            <div
              className="w-full max-w-[390px] rounded-t-3xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />
              <h2 className="text-lg font-bold text-foreground mb-2">Mark as Paid</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Confirm you&apos;ve sent <span className="font-semibold text-foreground">${currentPayment.return_amount}</span> outside of PoolParty.
                PoolParty does not process or verify this payment.
              </p>

              {/* Show winner payment methods in modal */}
              {(currentPayment.winner_payment_methods as PaymentMethod[] | undefined)?.length ? (
                <div className="mb-4">
                  <PaymentMethodsList methods={currentPayment.winner_payment_methods as PaymentMethod[]} />
                </div>
              ) : null}

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
                  onClick={() => handleMarkPaid(showModal)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
