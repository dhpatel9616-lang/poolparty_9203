'use client';
import React, { useEffect, useState } from 'react';
import { Bell, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { sendNudge } from '@/lib/supabase/services';
import { useSettlementsRealtime } from '@/lib/supabase/realtime';

export default function PaymentsDue() {
  const { user } = useAuth();
  const { items: realtimeItems, loading } = useSettlementsRealtime();
  const [nudgedIds, setNudgedIds] = useState<Set<string>>(new Set());

  const unpaid = realtimeItems.filter(
    (p) => p.settlement_status === 'pending' || p.settlement_status === 'claimed_paid' || p.settlement_status === 'overdue'
  );

  const handleNudge = async (itemId: string, receiverId: string | null) => {
    if (nudgedIds.has(itemId) || !user || !receiverId) return;
    setNudgedIds((prev) => new Set([...prev, itemId]));
    try {
      await sendNudge({
        to_user_id: receiverId,
        from_user_id: user.id,
        message: 'Friendly reminder to settle up on PoolParty!',
      });
      toast.success('Nudge sent! 📲');
    } catch {
      toast.success('Nudge queued 📲');
    }
  };

  if (loading || unpaid.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Payments Due</h2>
        <span
          className="pill-badge text-xs"
          style={{ background: 'rgba(255,77,141,0.12)', color: 'var(--social)' }}
        >
          {unpaid.length} pending
        </span>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Compliance banner */}
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{ background: 'rgba(255,200,87,0.08)', borderBottom: '1px solid var(--border)' }}
        >
          <AlertCircle size={12} style={{ color: 'var(--warning)' }} />
          <p className="text-xs" style={{ color: 'var(--warning)' }}>
            PoolParty does not process payments or hold funds
          </p>
        </div>

        <div className="divide-y" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {unpaid.map((payment) => {
            const isOwedToMe = payment.recipient_id === user?.id;
            const isNudged = nudgedIds.has(payment.id);
            const otherPartyId = isOwedToMe ? payment.payer_id : payment.recipient_id;

            return (
              <div key={payment.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold"
                        style={{
                          background: isOwedToMe ? 'rgba(0,230,118,0.15)' : 'rgba(255,77,141,0.15)',
                          color: isOwedToMe ? 'var(--success)' : 'var(--social)',
                        }}
                      >
                        {isOwedToMe ? 'P' : 'R'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {isOwedToMe ? 'Awaiting payment' : 'You owe'}
                        </p>
                        {payment.due_date && (
                          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            Due {new Date(payment.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{ color: isOwedToMe ? 'var(--success)' : 'var(--social)', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {isOwedToMe ? '+' : '-'}${payment.amount}
                    </span>

                    {payment.settlement_status === 'claimed_paid' ? (
                      <span
                        className="pill-badge text-xs"
                        style={{ background: 'rgba(0,230,118,0.12)', color: 'var(--success)' }}
                      >
                        <Check size={10} className="mr-1" />
                        Paid
                      </span>
                    ) : isOwedToMe ? (
                      <button
                        onClick={() => handleNudge(payment.id, otherPartyId)}
                        disabled={isNudged}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all active:scale-90"
                        style={{
                          background: isNudged ? 'var(--elevated)' : 'rgba(124,92,255,0.15)',
                          color: isNudged ? 'var(--muted-foreground)' : 'var(--primary)',
                          opacity: isNudged ? 0.6 : 1,
                        }}
                      >
                        <Bell size={10} />
                        {isNudged ? 'Nudged' : 'Nudge'}
                      </button>
                    ) : (
                      <span
                        className="pill-badge text-xs"
                        style={{ background: 'rgba(255,77,141,0.12)', color: 'var(--social)' }}
                      >
                        Unpaid
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}