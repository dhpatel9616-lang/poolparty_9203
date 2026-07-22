'use client';
import React from 'react';

export interface SettlementBadgeMetrics {
  trust_score: number;
  reliability_score: number;
  on_time_percentage: number;
  unpaid_count: number;
  dispute_count: number;
  total_paid: number;
  total_received: number;
  pools_won: number;
  pools_lost: number;
}

export interface SettlementBadge {
  key: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  desc: string;
  earned: boolean;
}

/** Compute which settlement badges are earned from reputation metrics */
export function computeSettlementBadges(metrics: SettlementBadgeMetrics | null): SettlementBadge[] {
  const totalSettlements = (metrics?.total_paid ?? 0) + (metrics?.total_received ?? 0);
  const onTime = metrics?.on_time_percentage ?? 0;
  const unpaid = metrics?.unpaid_count ?? 0;
  const disputes = metrics?.dispute_count ?? 0;
  const trustScore = metrics?.trust_score ?? 0;
  const reliabilityScore = metrics?.reliability_score ?? 0;

  return [
    {
      key: 'trusted_payer',
      label: 'Trusted Payer',
      emoji: '🛡️',
      color: '#7C5CFF',
      bg: 'rgba(124,92,255,0.12)',
      desc: 'Trust score ≥ 80 & no unpaid',
      earned: trustScore >= 80 && unpaid === 0 && totalSettlements >= 3,
    },
    {
      key: 'fast_payer',
      label: 'Fast Payer',
      emoji: '⚡',
      color: '#FFC857',
      bg: 'rgba(255,200,87,0.12)',
      desc: 'On-time rate ≥ 90%',
      earned: onTime >= 90 && totalSettlements >= 3,
    },
    {
      key: '100_paid',
      label: '100% Paid',
      emoji: '✅',
      color: '#00E676',
      bg: 'rgba(0,230,118,0.12)',
      desc: 'Zero unpaid obligations',
      earned: unpaid === 0 && totalSettlements >= 5,
    },
    {
      key: 'verified_settler',
      label: 'Verified Settler',
      emoji: '🏅',
      color: '#00C9A7',
      bg: 'rgba(0,201,167,0.12)',
      desc: 'Reliability ≥ 85 & no disputes',
      earned: reliabilityScore >= 85 && disputes === 0 && totalSettlements >= 5,
    },
  ];
}

interface SettlementBadgesProps {
  metrics: SettlementBadgeMetrics | null;
  /** compact = small inline chips; full = grid cards */
  variant?: 'compact' | 'full';
  /** show only earned badges */
  earnedOnly?: boolean;
}

export default function SettlementBadges({ metrics, variant = 'full', earnedOnly = false }: SettlementBadgesProps) {
  const badges = computeSettlementBadges(metrics);
  const displayed = earnedOnly ? badges.filter((b) => b.earned) : badges;

  if (displayed.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {displayed.map((badge) => (
          <span
            key={badge.key}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold"
            style={{
              background: badge.earned ? badge.bg : 'var(--elevated)',
              color: badge.earned ? badge.color : 'var(--muted-foreground)',
              border: badge.earned ? `1px solid ${badge.color}30` : '1px solid var(--border)',
              opacity: badge.earned ? 1 : 0.5,
            }}
            title={badge.desc}
          >
            <span>{badge.emoji}</span>
            <span>{badge.label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">Settlement Badges</h2>
      <div className="grid grid-cols-2 gap-2">
        {displayed.map((badge) => (
          <div
            key={badge.key}
            className="rounded-xl p-3 flex flex-col items-center gap-1.5 text-center"
            style={{
              background: badge.earned ? badge.bg : 'var(--elevated)',
              border: badge.earned ? `1px solid ${badge.color}30` : '1px solid var(--border)',
              opacity: badge.earned ? 1 : 0.45,
            }}
          >
            <span className="text-2xl">{badge.emoji}</span>
            <p
              className="text-2xs font-semibold leading-tight"
              style={{ color: badge.earned ? badge.color : 'var(--muted-foreground)' }}
            >
              {badge.label}
            </p>
            <p className="text-2xs leading-tight" style={{ color: 'var(--muted-foreground)' }}>
              {badge.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
