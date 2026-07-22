'use client';
import React, { useEffect, useState } from 'react';
import TrustBadge from '@/components/ui/TrustBadge';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCurrentUserProfile, fetchAccountabilityScore } from '@/lib/supabase/services';

const TIER_MAP: Record<string, string> = {
  bronze: 'Risky',
  silver: 'Good',
  gold: 'Good',
  platinum: 'Excellent',
  diamond: 'Excellent',
  legend: 'Excellent',
};

export default function TrustScoreHero() {
  const { user } = useAuth();
  const [barWidth, setBarWidth] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [score, setScore] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetchCurrentUserProfile(user.id),
      fetchAccountabilityScore(user.id),
    ]).then(([p, s]) => {
      setProfile(p);
      setScore(s);
    });
  }, [user]);

  const trustScore = score?.accountability_score ?? 50;
  const pct = (trustScore / 100) * 100;
  const tier = TIER_MAP[score?.reputation_level ?? 'bronze'] ?? 'Risky';
  const paidOnTime = score?.would_participate_again_pct ?? 100;
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'You';

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <Link href="/profile-screen">
      <div
        className="rounded-2xl p-5 card-interactive"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>
              Trust Score
            </p>
            <div className="flex items-end gap-2">
              <span
                className="text-4xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #7C5CFF, #00C9A7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {Math.round(trustScore * 10)}
              </span>
              <span className="text-base font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                /1000
              </span>
            </div>
          </div>
          <TrustBadge tier={tier as any} size="md" />
        </div>

        {/* Trust bar */}
        <div className="relative h-2 rounded-full overflow-hidden mb-3" style={{ background: 'var(--elevated)' }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full trust-bar-fill"
            style={{
              width: `${barWidth}%`,
              background: 'linear-gradient(90deg, #7C5CFF, #00C9A7)',
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {Math.round(paidOnTime)}% would participate again
            </span>
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
            {displayName}
          </span>
        </div>
      </div>
    </Link>
  );
}