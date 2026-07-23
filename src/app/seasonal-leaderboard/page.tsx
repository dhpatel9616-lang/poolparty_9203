'use client';
import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Medal, Crown, Flame } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Season {
  id: string;
  season_name: string;
  season_number: number;
  season_status: string;
  starts_at: string;
  ends_at: string;
  description: string;
}

interface Ranking {
  rank_position: number;
  season_points: number;
  pools_won: number;
  pools_entered: number;
  streak_best: number;
  user_id?: string;
  user: { full_name: string; username: string; avatar_url: string };
}

interface Badge {
  badge_key: string;
  badge_name: string;
  badge_icon: string;
  badge_tier: string;
  badge_description: string;
}

const TIER_COLORS: Record<string, string> = {
  legendary: '#FFD700',
  rare: '#B9F2FF',
  uncommon: '#7C5CFF',
  common: '#B8B4C8',
};

const RANK_ICONS = [
  <Crown key="1" size={18} style={{ color: '#FFD700' }} />,
  <Medal key="2" size={18} style={{ color: '#C0C0C0' }} />,
  <Medal key="3" size={18} style={{ color: '#CD7F32' }} />,
];

export default function SeasonalLeaderboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [season, setSeason] = useState<Season | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rankings' | 'badges'>('rankings');
  const [myRank, setMyRank] = useState<Ranking | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: seasonData } = await supabase
          .from('seasons')
          .select('*')
          .eq('season_status', 'active')
          .maybeSingle();

        if (seasonData) {
          setSeason(seasonData);
          const { data: rankData } = await supabase
            .from('seasonal_rankings')
            .select('*, user:user_id(full_name, username, avatar_url)')
            .eq('season_id', seasonData.id)
            .order('rank_position', { ascending: true })
            .limit(20);
          if (rankData) setRankings(rankData as any);

          const { data: badgeData } = await supabase
            .from('seasonal_badges')
            .select('*')
            .eq('season_id', seasonData.id);
          if (badgeData) setBadges(badgeData as any);
        } else {
          const { data: anySeason } = await supabase
            .from('seasons')
            .select('*')
            .order('season_number', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (anySeason) setSeason(anySeason);
        }
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleViewProfile = (ranking: Ranking) => {
    const userId = ranking.user_id;
    if (userId) {
      router.push(`/creator-profile?id=${userId}&from=leaderboard`);
    }
  };

  const daysLeft = Math.max(0, Math.ceil((new Date((season as any)?.ends_at || Date.now()).getTime() - Date.now()) / 86400000));
  const totalDays = Math.ceil((new Date((season as any)?.ends_at || Date.now()).getTime() - new Date((season as any)?.starts_at || Date.now()).getTime()) / 86400000);
  const progress = totalDays > 0 ? Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100)) : 0;

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link href="/profile-screen" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--muted-foreground)' }} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Seasonal Leaderboard</h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{(season as any)?.season_name || 'Season 1: Genesis'}</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,230,118,0.15)' }}>
            <Flame size={12} style={{ color: 'var(--success)' }} />
            <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>LIVE</span>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {/* Season Progress */}
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(124,92,255,0.15), rgba(255,77,141,0.1))', border: '1px solid rgba(124,92,255,0.3)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>SEASON PROGRESS</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{daysLeft} days remaining</p>
              </div>
              <div className="text-right">
                <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Ends</p>
                <p className="text-xs font-semibold text-foreground">
                  {season ? new Date((season as any).ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
            </div>
            <p className="text-2xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{progress.toFixed(0)}% complete</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
            {(['rankings', 'badges'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all" style={{ background: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? '#fff' : 'var(--muted-foreground)' }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Rankings Tab */}
          {activeTab === 'rankings' && (
            <div className="space-y-2">
              {/* Top 3 podium */}
              <div className="flex items-end justify-center gap-3 py-4">
                {[rankings[1], rankings[0], rankings[2]].map((r, i) => {
                  if (!r) return null;
                  const podiumColors = ['#C0C0C0', '#FFD700', '#CD7F32'];
                  const heights = ['h-20', 'h-28', 'h-16'];
                  return (
                    <button key={r.rank_position} onClick={() => handleViewProfile(r)} className="flex flex-col items-center gap-2 transition-all active:scale-95">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black" style={{ background: `${podiumColors[i]}22`, border: `2px solid ${podiumColors[i]}`, color: podiumColors[i] }}>
                        {r.user?.full_name?.[0] || '?'}
                      </div>
                      <p className="text-xs font-semibold text-foreground text-center" style={{ maxWidth: 64 }}>{r.user?.full_name?.split(' ')[0] || 'User'}</p>
                      <p className="text-xs font-bold" style={{ color: podiumColors[i] }}>{r.season_points.toLocaleString()}</p>
                      <div className={`w-16 ${heights[i]} rounded-t-xl flex items-center justify-center`} style={{ background: `${podiumColors[i]}22`, border: `1px solid ${podiumColors[i]}44` }}>
                        <span className="text-xl">{['🥈', '🥇', '🥉'][i]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Full rankings — each row clickable */}
              {rankings.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm font-semibold text-foreground">No rankings yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Play in pools this season to appear on the leaderboard.
                  </p>
                </div>
              )}
              {rankings.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => handleViewProfile(r)}
                  className="w-full flex items-center gap-3 rounded-xl p-3 transition-all active:scale-98 text-left"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="w-7 flex items-center justify-center flex-shrink-0">
                    {r.rank_position <= 3 ? RANK_ICONS[r.rank_position - 1] : <span className="text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>#{r.rank_position}</span>}
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,201,167,0.2))', color: 'var(--primary)' }}>
                    {r.user?.full_name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{r.user?.full_name || 'Unknown'}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{r.pools_won}W · {r.pools_entered} pools · 🔥{r.streak_best}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{r.season_points.toLocaleString()}</p>
                    <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>pts</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Earn badges by completing seasonal challenges</p>
              <div className="grid grid-cols-2 gap-3">
                {badges.length === 0 && (
                  <p className="col-span-2 text-center text-sm py-8" style={{ color: 'var(--muted-foreground)' }}>
                    No badges available for this season yet.
                  </p>
                )}
                {badges.map(badge => (
                  <div key={badge.badge_key} className="rounded-xl p-4 flex flex-col items-center gap-2 text-center" style={{ background: 'var(--surface)', border: `1px solid ${TIER_COLORS[badge.badge_tier] || 'var(--border)'}44` }}>
                    <span className="text-3xl">{badge.badge_icon}</span>
                    <p className="text-sm font-bold text-foreground">{badge.badge_name}</p>
                    <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{badge.badge_description}</p>
                    <span className="text-2xs px-2 py-0.5 rounded-full capitalize font-semibold" style={{ background: `${TIER_COLORS[badge.badge_tier] || 'var(--border)'}22`, color: TIER_COLORS[badge.badge_tier] || 'var(--muted-foreground)' }}>
                      {badge.badge_tier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
