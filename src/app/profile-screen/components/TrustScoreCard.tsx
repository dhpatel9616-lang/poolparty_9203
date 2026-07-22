'use client';
import React, { useState, useEffect } from 'react';
import type { User } from '@/lib/mockData';
import TrustBadge from '@/components/ui/TrustBadge';
import { TrendingUp, Award, Target, Zap, ChevronRight, X, Trophy, AlertTriangle, Clock, Minus } from 'lucide-react';

interface TrustScoreCardProps {
  user: User;
}

const TIER_THRESHOLDS = [
  { min: 0, max: 400, label: 'Unreliable', color: '#FF4D8D' },
  { min: 400, max: 600, label: 'Risky', color: '#FFC857' },
  { min: 600, max: 800, label: 'Good', color: '#7C5CFF' },
  { min: 800, max: 1000, label: 'Excellent', color: '#00E676' },
];

interface StatDetail {
  title: string;
  value: string | number;
  description: string;
  breakdown?: { label: string; value: string | number; color?: string }[];
  emptyMessage?: string;
}

function StatDetailSheet({ stat, onClose }: { stat: StatDetail; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl flex flex-col"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          maxHeight: '85dvh',
          paddingBottom: 'env(safe-area-inset-bottom)',
          animation: 'fadeInUp 250ms ease forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-bold text-foreground">{stat.title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
            <X size={14} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 pb-6 space-y-4">
          {/* Main value */}
          <div
            className="rounded-2xl p-5 text-center"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <p
              className="text-4xl font-bold mb-1"
              style={{ background: 'linear-gradient(135deg, #7C5CFF, #00C9A7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              {stat.value}
            </p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{stat.description}</p>
          </div>

          {/* Breakdown */}
          {stat.breakdown && stat.breakdown.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Breakdown</p>
              {stat.breakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: item.color || 'var(--foreground)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{stat.emptyMessage || 'No data available yet. Start participating in pools to see your stats here.'}</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-2 flex-shrink-0 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--elevated)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrustScoreCard({ user }: TrustScoreCardProps) {
  const [barWidth, setBarWidth] = useState(0);
  const [openStat, setOpenStat] = useState<StatDetail | null>(null);
  const pct = (user.trustScore / 1000) * 100;

  React.useEffect(() => {
    const t = setTimeout(() => setBarWidth(pct), 300);
    return () => clearTimeout(t);
  }, [pct]);

  const wins = user.wins ?? 0;
  const losses = user.losses ?? 0;
  const total = user.totalContracts ?? 0;
  const winRate = user.winRate ?? 0;
  const paidOnTime = user.paidOnTimePercent ?? 0;

  const statCards = [
    {
      icon: <TrendingUp size={14} style={{ color: 'var(--success)' }} />,
      label: 'Win %',
      value: `${winRate}%`,
      detail: {
        title: 'Win Percentage',
        value: `${winRate}%`,
        description: `Won ${wins} out of ${total} contracts`,
        breakdown: total > 0 ? [
          { label: 'Wins', value: wins, color: 'var(--success)' },
          { label: 'Losses', value: losses, color: 'var(--accent)' },
          { label: 'Total Played', value: total },
        ] : [],
        emptyMessage: 'No contracts completed yet. Join a pool to start building your win rate.',
      },
    },
    {
      icon: <Award size={14} style={{ color: 'var(--primary)' }} />,
      label: 'On-time',
      value: `${paidOnTime}%`,
      detail: {
        title: 'On-time Payment Rate',
        value: `${paidOnTime}%`,
        description: 'Percentage of settlements paid on time',
        breakdown: paidOnTime > 0 ? [
          { label: 'On-time payments', value: `${paidOnTime}%`, color: 'var(--success)' },
          { label: 'Late payments', value: `${100 - paidOnTime}%`, color: 'var(--warning)' },
        ] : [],
        emptyMessage: 'No payment history yet. Complete contracts to build your on-time record.',
      },
    },
    {
      icon: <Target size={14} style={{ color: 'var(--warning)' }} />,
      label: 'Contracts',
      value: total,
      detail: {
        title: 'Total Contracts',
        value: total,
        description: 'Total prediction contracts participated in',
        breakdown: total > 0 ? [
          { label: 'Active', value: user.activeContracts ?? 0, color: 'var(--primary)' },
          { label: 'Completed', value: total - (user.activeContracts ?? 0) },
          { label: 'Disputes', value: user.disputes ?? 0, color: 'var(--accent)' },
        ] : [],
        emptyMessage: 'No contracts yet. Create or join a pool to get started.',
      },
    },
    {
      icon: <Zap size={14} style={{ color: '#FFC857' }} />,
      label: 'Streak',
      value: wins > 0 ? `${wins}W` : '—',
      detail: {
        title: 'Current Streak',
        value: wins > 0 ? `${wins}W` : '—',
        description: 'Your current winning streak',
        breakdown: wins > 0 ? [
          { label: 'Current streak', value: `${wins} wins`, color: '#FFC857' },
          { label: 'Best streak', value: `${wins} wins`, color: 'var(--success)' },
        ] : [],
        emptyMessage: 'No streak yet. Win consecutive contracts to build your streak.',
      },
    },
  ];

  // Extended stats for additional detail links
  const extendedStats = [
    {
      label: 'Wins',
      value: wins,
      icon: <Trophy size={14} style={{ color: '#FFD700' }} />,
      detail: {
        title: 'Total Wins',
        value: wins,
        description: 'Total contracts you have won',
        breakdown: wins > 0 ? [{ label: 'Total wins', value: wins, color: 'var(--success)' }] : [],
        emptyMessage: 'No wins yet. Join pools to start winning.',
      },
    },
    {
      label: 'Losses',
      value: losses,
      icon: <Minus size={14} style={{ color: 'var(--accent)' }} />,
      detail: {
        title: 'Total Losses',
        value: losses,
        description: 'Total contracts you have lost',
        breakdown: losses > 0 ? [{ label: 'Total losses', value: losses, color: 'var(--accent)' }] : [],
        emptyMessage: 'No losses recorded yet.',
      },
    },
    {
      label: 'Disputes',
      value: user.disputes ?? 0,
      icon: <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />,
      detail: {
        title: 'Disputes',
        value: user.disputes ?? 0,
        description: 'Total disputes filed or received',
        breakdown: (user.disputes ?? 0) > 0 ? [
          { label: 'Filed by you', value: user.disputes ?? 0 },
          { label: 'Against you', value: 0 },
        ] : [],
        emptyMessage: 'No disputes on record. Keep it clean! 🌟',
      },
    },
    {
      label: 'Unpaid',
      value: user.unpaidCount ?? 0,
      icon: <Clock size={14} style={{ color: 'var(--social)' }} />,
      detail: {
        title: 'Unpaid Settlements',
        value: user.unpaidCount ?? 0,
        description: 'Settlements not yet paid',
        breakdown: (user.unpaidCount ?? 0) > 0 ? [
          { label: 'Overdue', value: user.unpaidCount ?? 0, color: 'var(--social)' },
        ] : [],
        emptyMessage: 'No unpaid settlements. Great track record! ✅',
      },
    },
  ];

  return (
    <>
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>
              Trust Score
            </p>
            <div className="flex items-end gap-2">
              <span
                className="text-5xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #7C5CFF, #00C9A7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {user.trustScore}
              </span>
              <span className="text-lg font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                /1000
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <TrustBadge tier={user.trustTier} size="lg" />
            <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
              +25 this month
            </span>
          </div>
        </div>

        {/* Gradient trust bar */}
        <div className="mb-4">
          <div className="relative h-3 rounded-full overflow-hidden mb-1" style={{ background: 'var(--elevated)' }}>
            <div
              className="absolute left-0 top-0 h-full rounded-full trust-bar-fill"
              style={{
                width: `${barWidth}%`,
                background: 'linear-gradient(90deg, #FF4D8D 0%, #FFC857 40%, #7C5CFF 60%, #00E676 100%)',
              }}
            />
            <div
              className="absolute top-0 w-0.5 h-full rounded-full transition-all duration-700"
              style={{ left: `${barWidth}%`, background: '#fff', boxShadow: '0 0 4px rgba(255,255,255,0.6)' }}
            />
          </div>
          <div className="flex justify-between">
            {TIER_THRESHOLDS.map((tier) => (
              <span key={`tier-label-${tier.label}`} className="text-2xs font-medium" style={{ color: tier.color }}>
                {tier.label}
              </span>
            ))}
          </div>
        </div>

        {/* Primary stat cards */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {statCards.map((card, i) => (
            <button
              key={`stat-card-${i}`}
              onClick={() => setOpenStat(card.detail)}
              className="rounded-xl p-3 flex items-center justify-between transition-all active:scale-95"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                {card.icon}
                <div className="text-left">
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{card.label}</p>
                  <p className="text-sm font-bold text-foreground">{card.value}</p>
                </div>
              </div>
              <ChevronRight size={12} style={{ color: 'var(--muted-foreground)' }} />
            </button>
          ))}
        </div>

        {/* Extended stats row */}
        <div className="grid grid-cols-4 gap-1.5">
          {extendedStats.map((s, i) => (
            <button
              key={i}
              onClick={() => setOpenStat(s.detail)}
              className="rounded-xl p-2 flex flex-col items-center gap-1 transition-all active:scale-95"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
            >
              {s.icon}
              <p className="text-xs font-bold text-foreground">{s.value}</p>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      {openStat && <StatDetailSheet stat={openStat} onClose={() => setOpenStat(null)} />}
    </>
  );
}