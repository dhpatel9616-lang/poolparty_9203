'use client';
import React, { useEffect, useState } from 'react';
import TrustScoreCard from './TrustScoreCard';
import BadgeGrid from './BadgeGrid';
import StatsGrid from './StatsGrid';
import TrustHistoryLog from './TrustHistoryLog';
import { Settings, Share2, Network, Trophy, Shield, Gavel, Star, BarChart2, Wallet } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCurrentUserProfile, fetchAccountabilityScore, fetchUserBadges, fetchReliabilityHistory, fetchSettlementItems } from '@/lib/supabase/services';
import { useUserTrustScoreRealtime } from '@/lib/supabase/realtime';
import PaymentMethodsManager from './PaymentMethodsManager';
import SettlementBadges, { SettlementBadgeMetrics } from '@/components/ui/SettlementBadges';
import { createClient } from '@/lib/supabase/client';
import type { TrustTier } from '@/lib/mockData';

const TIER_MAP: Record<string, TrustTier> = {
  bronze: 'Risky',
  silver: 'Good',
  gold: 'Good',
  platinum: 'Excellent',
  diamond: 'Excellent',
  legend: 'Excellent',
};

export default function ProfileView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [score, setScore] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [reputation, setReputation] = useState<SettlementBadgeMetrics | null>(null);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Real-time trust score subscription
  const { scoreRecord: liveScore, scoreChanged, scoreDelta } = useUserTrustScoreRealtime(user?.id);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const supabase = createClient();
    Promise.all([
      fetchCurrentUserProfile(user.id),
      fetchAccountabilityScore(user.id),
      fetchUserBadges(user.id),
      fetchReliabilityHistory(user.id),
      supabase.from('user_reputation').select('*').eq('user_id', user.id).maybeSingle(),
      fetchSettlementItems(user.id),
    ]).then(([p, s, b, h, repRes, settlements]) => {
      setProfile(p);
      setScore(s);
      setBadges(b);
      setHistory(h);
      setReputation((repRes as any).data ?? null);
      setUnpaidCount((settlements as any[]).filter((i) => i.payer_id === user.id && i.status === 'unpaid').length);
      setLoading(false);
    });
  }, [user]);

  // When live trust score changes, update local score state and show toast
  useEffect(() => {
    if (liveScore) {
      setScore(liveScore);
    }
  }, [liveScore]);

  useEffect(() => {
    if (scoreChanged && scoreDelta !== 0) {
      const msg =
        scoreDelta > 0
          ? `⭐ Trust score +${scoreDelta} pts!`
          : `Trust score ${scoreDelta} pts`;
      toast(msg, { duration: 4000 });
    }
  }, [scoreChanged, scoreDelta]);

  const handleShare = () => {
    const profileUrl = `${window.location?.origin}/profile-screen`;
    const text = `Check out my PoolParty profile!`;
    if (navigator.share) {
      navigator.share({ title: 'PoolParty Profile', text, url: profileUrl })?.catch(() => {});
    } else {
      navigator.clipboard?.writeText(profileUrl)?.catch(() => {});
      toast?.success('Profile link copied!');
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You';
  const handle = profile?.username ? `@${profile.username}` : user?.email?.split('@')[0] ? `@${user.email?.split('@')[0]}` : '@user';
  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently';
  const trustScore = score ? Math.round((score.accountability_score ?? 50) * 10) : 500;
  const trustTier = TIER_MAP[score?.reputation_level ?? 'bronze'] ?? 'Risky';
  const paidOnTime = score?.would_participate_again_pct ?? 100;
  const winRate = score?.total_contracts > 0 ? Math.round((score.completed_contracts / score.total_contracts) * 100) : 0;

  const userForComponents = {
    id: user?.id ?? '',
    name: displayName,
    handle,
    avatar: displayName.charAt(0).toUpperCase(),
    phone: profile?.phone ?? '',
    trustScore,
    trustTier,
    paidOnTimePercent: Math.round(paidOnTime),
    winRate,
    totalContracts: score?.total_contracts ?? 0,
    wins: score?.completed_contracts ?? 0,
    losses: score?.disputed_contracts ?? 0,
    pending: (score?.total_contracts ?? 0) - (score?.completed_contracts ?? 0) - (score?.disputed_contracts ?? 0),
    activeContracts: (score?.total_contracts ?? 0) - (score?.completed_contracts ?? 0) - (score?.disputed_contracts ?? 0),
    disputes: score?.disputed_contracts ?? 0,
    unpaidCount,
    joinDate,
    badges: badges.map((b: any) => b.badge?.badge_name ?? b.badge_name ?? '').filter(Boolean),
  };

  const trustHistoryForComponent = history.map((h: any) => ({
    id: h.id,
    date: new Date(h.occurred_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    delta: Number(h.score_delta),
    reason: h.event_description || h.event_type,
    newScore: Math.round(Number(h.score_after) * 10),
  }));

  if (loading) {
    return (
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="animate-pulse rounded-2xl h-20" style={{ background: 'var(--surface)' }} />
        <div className="animate-pulse rounded-2xl h-32" style={{ background: 'var(--surface)' }} />
        <div className="animate-pulse rounded-2xl h-24" style={{ background: 'var(--surface)' }} />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,201,167,0.2))',
              border: '1.5px solid rgba(124,92,255,0.3)',
              color: 'var(--primary)',
            }}
          >
            {userForComponents.avatar}
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{userForComponents.name}</h1>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{userForComponents.handle}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Joined {userForComponents.joinDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Share2 size={16} style={{ color: 'var(--muted-foreground)' }} />
          </button>
          <Link
            href="/settings"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Settings size={16} style={{ color: 'var(--muted-foreground)' }} />
          </Link>
        </div>
      </div>
      <TrustScoreCard user={userForComponents} />
      <StatsGrid user={userForComponents} />
      {/* Quick Access — New Systems */}
      <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>REPUTATION & TRUST</p>
        {[
          { href: '/reputation-timeline', icon: Shield, label: 'Reputation Timeline', desc: 'Accountability score & history', color: 'var(--primary)' },
          { href: '/trust-graph', icon: Network, label: 'Trust Graph', desc: 'Your trust network explorer', color: 'var(--success)' },
          { href: '/settlement', icon: Wallet, label: 'Settlement', desc: 'Manage obligations & payments', color: '#00C9A7' },
          { href: '/user-stats', icon: BarChart2, label: 'Your Stats', desc: 'Pool creation, viral & settlement metrics', color: '#7C5CFF' },
          { href: '/creator-profile', icon: Star, label: 'Creator Profile', desc: 'Manage your creator presence', color: 'var(--warning)' },
          { href: '/seasonal-leaderboard', icon: Trophy, label: 'Seasonal Leaderboard', desc: 'Rankings, badges & trophies', color: '#FFD700' },
          { href: '/dispute-center', icon: Gavel, label: 'Dispute Center', desc: 'Resolve conflicts fairly', color: 'var(--accent)' },
        ]?.map((item) => (
          <Link
            key={item?.href}
            href={item?.href}
            className="flex items-center gap-3 p-3 rounded-xl transition-all active:scale-98"
            style={{ background: 'var(--elevated)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${item?.color}20` }}
            >
              <item.icon size={16} style={{ color: item?.color }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{item?.label}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item?.desc}</p>
            </div>
          </Link>
        ))}
      </div>
      {badges.length > 0 && <BadgeGrid badges={userForComponents.badges} />}
      {/* Settlement Badges */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <SettlementBadges metrics={reputation} variant="full" earnedOnly={false} />
      </div>
      {trustHistoryForComponent.length > 0 && <TrustHistoryLog history={trustHistoryForComponent} />}
      {/* Payment Methods */}
      <PaymentMethodsManager />
      {/* Legal Links */}
      <div className="flex items-center justify-center gap-4 py-2">
        <Link href="/terms" className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Terms of Service</Link>
        <span className="text-xs" style={{ color: 'var(--border)' }}>·</span>
        <Link href="/privacy" className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Privacy Policy</Link>
      </div>
    </div>
  );
}