'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import type { Contract } from '@/lib/mockData';
import { X, AlertCircle, TrendingUp, Share2, Eye, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EntryModalProps {
  contract: Contract;
  outcomeId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [10, 25, 50, 100];

interface EntryForm {
  amount: string;
}

// Lightweight confetti component
function ConfettiOverlay() {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number; size: number }[]>([]);

  useEffect(() => {
    const colors = ['#7C5CFF', '#00C9A7', '#FFC857', '#FF4D8D', '#0052FF'];
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: Math.random() * 8 + 4,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-t-3xl">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            animation: `confettiFall 1.2s ease-in ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function EntryModal({ contract, outcomeId, onClose, onSuccess }: EntryModalProps) {
  const { user } = useAuth();
  const outcome = contract.outcomes.find((o) => o.id === outcomeId);
  const [amount, setAmount] = useState('25');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const { handleSubmit } = useForm<EntryForm>();

  const numAmount = parseFloat(amount) || 0;

  const calcReturn = () => {
    if (!outcome) return { profit: 0, total: 0 };
    const w = outcome.weight;
    let profit = 0;
    if (w > 0) profit = numAmount * (w / 100);
    else if (w < 0) profit = numAmount * (100 / Math.abs(w));
    else profit = numAmount;
    return { profit: Math.round(profit * 100) / 100, total: Math.round((numAmount + profit) * 100) / 100 };
  };

  const { profit, total } = calcReturn();

  const onSubmit = useCallback(async () => {
    if (!numAmount || numAmount < 1) {
      toast.error('Enter a valid stake amount');
      return;
    }
    if (!user) {
      toast.error('You need to be signed in to join a contract');
      return;
    }
    if (!outcomeId) {
      toast.error('No outcome selected');
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('pool_entries').insert({
        pool_id: contract.id,
        user_id: user.id,
        outcome_id: outcomeId,
        stake_amount: numAmount,
      });

      if (error) {
        // Unique constraint on (pool_id, user_id) — one entry per person per pool
        if (error.code === '23505') {
          toast.error("You've already joined this contract.");
        } else {
          toast.error(error.message || 'Failed to join contract. Please try again.');
        }
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setConfirmed(true);
      setShowConfetti(true);
      onSuccess?.();
      setTimeout(() => setShowConfetti(false), 1500);
    } catch (err) {
      console.error('Failed to submit entry', err);
      toast.error('Failed to join contract. Please check your connection and try again.');
      setSubmitting(false);
    }
  }, [numAmount, user, outcomeId, contract.id, onSuccess]);

  const handleShare = useCallback(() => {
    const text = `I just locked in "${outcome?.label}" on PoolParty! Staking $${numAmount} 🎱`;
    if (navigator.share) {
      navigator.share({ title: 'PoolParty Bet', text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
      toast.success('Copied to clipboard!');
    }
  }, [outcome, numAmount]);

  // Prevent scroll on body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[390px] rounded-t-3xl flex flex-col"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          maxHeight: '92dvh',
          animation: 'fadeInUp 250ms ease forwards',
        }}
      >
        {showConfetti && <ConfettiOverlay />}

        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: 'var(--border)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-3 flex-shrink-0">
          <h3 className="text-lg font-bold text-foreground">
            {confirmed ? '🎉 Entry Locked!' : 'Lock in Entry'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--elevated)' }}
          >
            <X size={16} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6" style={{ paddingBottom: confirmed ? 'calc(1rem + env(safe-area-inset-bottom))' : '1rem' }}>
          {confirmed ? (
            /* Confirmation State */
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center py-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'rgba(0,230,118,0.15)' }}
                >
                  <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
                </div>
                <p className="text-base font-bold text-foreground text-center">
                  You're in! Good luck 🍀
                </p>
              </div>

              {/* Wager Summary */}
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Wager Summary
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Pool</span>
                  <span className="text-sm font-semibold text-foreground line-clamp-1 max-w-[60%] text-right">{contract.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Your pick</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>{outcome?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Stake</span>
                  <span className="text-sm font-bold text-foreground">${numAmount}</span>
                </div>
                <div
                  className="flex items-center justify-between pt-2"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <span className="text-sm font-semibold text-foreground">Potential payout</span>
                  <span className="text-base font-bold" style={{ color: 'var(--success)' }}>${total}</span>
                </div>
              </div>

              {/* Action buttons */}
              <button
                onClick={handleShare}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'rgba(124,92,255,0.15)', color: 'var(--primary)', border: '1px solid rgba(124,92,255,0.3)' }}
              >
                <Share2 size={16} />
                Share my bet
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'var(--elevated)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                <Eye size={16} />
                View pool
              </button>
            </div>
          ) : (
            /* Entry Form */
            <div className="space-y-4 py-2">
              {/* Selected outcome */}
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.2)' }}
              >
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  You're picking
                </p>
                <p className="text-base font-bold text-foreground">{outcome?.label}</p>
              </div>

              {/* Stake amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Stake amount</label>
                <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  Enter the amount you're staking offline
                </p>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-semibold"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl text-lg font-bold text-foreground focus:outline-none transition-all"
                    style={{
                      background: 'var(--elevated)',
                      border: '1.5px solid var(--border)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                    placeholder="25"
                  />
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 mt-2">
                  {QUICK_AMOUNTS.map((qa) => (
                    <button
                      key={`qa-${qa}`}
                      onClick={() => setAmount(qa.toString())}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-90"
                      style={{
                        background: amount === qa.toString() ? 'rgba(124,92,255,0.15)' : 'var(--elevated)',
                        color: amount === qa.toString() ? 'var(--primary)' : 'var(--muted-foreground)',
                        border: amount === qa.toString() ? '1px solid rgba(124,92,255,0.3)' : '1px solid var(--border)',
                        minHeight: '40px',
                      }}
                    >
                      ${qa}
                    </button>
                  ))}
                </div>
              </div>

              {/* Return preview */}
              {numAmount > 0 && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <TrendingUp size={14} style={{ color: 'var(--success)' }} />
                    <p className="text-xs font-semibold text-foreground">Potential return</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Stake</p>
                      <p className="text-base font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ${numAmount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Profit</p>
                      <p className="text-base font-bold" style={{ color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
                        +${profit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Total</p>
                      <p className="text-base font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ${total}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Compliance */}
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: 'rgba(255,200,87,0.06)', border: '1px solid rgba(255,200,87,0.15)' }}
              >
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--warning)' }}>
                  PoolParty does not process payments or hold funds. All settlement happens offline between members.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom CTA */}
        {!confirmed && (
          <div
            className="flex-shrink-0 px-6 pt-3"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={onSubmit}
              disabled={submitting || !numAmount}
              className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: numAmount > 0 ? 'var(--primary)' : 'var(--elevated)',
                color: numAmount > 0 ? '#fff' : 'var(--muted-foreground)',
                minHeight: '56px',
              }}
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `Confirm entry — $${numAmount || 0}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}