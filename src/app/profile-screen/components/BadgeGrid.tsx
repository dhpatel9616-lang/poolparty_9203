import React from 'react';

interface BadgeGridProps {
  badges: string[];
}

const BADGE_CONFIG: Record<string, { emoji: string; color: string; bg: string; desc: string }> = {
  'Perfect Payer': { emoji: '💳', color: '#00E676', bg: 'rgba(0,230,118,0.1)', desc: 'Never missed a payment' },
  '5-Win Streak': { emoji: '🔥', color: '#FFC857', bg: 'rgba(255,200,87,0.1)', desc: '5 consecutive wins' },
  'Top Predictor': { emoji: '🎯', color: '#7C5CFF', bg: 'rgba(124,92,255,0.1)', desc: 'Top win rate in group' },
  'Group Creator': { emoji: '👑', color: '#FF4D8D', bg: 'rgba(255,77,141,0.1)', desc: 'Created a group' },
  'Zero Disputes': { emoji: '🕊️', color: '#00C9A7', bg: 'rgba(0,201,167,0.1)', desc: 'No disputes ever' },
  'Excellent Tier': { emoji: '⭐', color: '#FFD700', bg: 'rgba(255,215,0,0.1)', desc: 'Reached Excellent tier' },
};

const ALL_BADGES = Object.keys(BADGE_CONFIG);

export default function BadgeGrid({ badges }: BadgeGridProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">Badges</h2>
      <div className="grid grid-cols-3 gap-2">
        {ALL_BADGES.map((badgeName) => {
          const config = BADGE_CONFIG[badgeName];
          const earned = badges.includes(badgeName);
          return (
            <div
              key={`badge-${badgeName}`}
              className="rounded-xl p-3 flex flex-col items-center gap-1.5 text-center"
              style={{
                background: earned ? config.bg : 'var(--elevated)',
                border: earned ? `1px solid ${config.color}30` : '1px solid var(--border)',
                opacity: earned ? 1 : 0.45,
              }}
            >
              <span className="text-2xl">{config.emoji}</span>
              <p
                className="text-2xs font-semibold leading-tight"
                style={{ color: earned ? config.color : 'var(--muted-foreground)' }}
              >
                {badgeName}
              </p>
              <p className="text-2xs leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                {config.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}