import React from 'react';
import type { TrustTier } from '@/lib/mockData';

interface TrustBadgeProps {
  tier: TrustTier;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_CONFIG: Record<TrustTier, { color: string; bg: string; label: string }> = {
  Excellent: { color: '#00E676', bg: 'rgba(0,230,118,0.12)', label: 'Excellent' },
  Good: { color: '#7C5CFF', bg: 'rgba(124,92,255,0.12)', label: 'Good' },
  Risky: { color: '#FFC857', bg: 'rgba(255,200,87,0.12)', label: 'Risky' },
  Unreliable: { color: '#FF4D8D', bg: 'rgba(255,77,141,0.12)', label: 'Unreliable' },
};

export default function TrustBadge({ tier, size = 'md' }: TrustBadgeProps) {
  const config = TIER_CONFIG[tier];
  const sizeClass = size === 'sm' ? 'text-2xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`pill-badge font-semibold ${sizeClass}`}
      style={{ color: config.color, background: config.bg }}
    >
      {config.label}
    </span>
  );
}