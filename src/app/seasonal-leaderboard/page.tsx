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

const MOCK_SEASON: Season = {
  id: '1',
  season_name: 'Season 1: Genesis',
  season_number: 1,
  season_status: 'active',
  starts_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  ends_at: new Date(Date.now() + 60 * 86400000).toISOString(),
  description: 'The inaugural PoolParty season',
};

const MOCK_RANKINGS: Ranking[] = [
  { rank_position: 1, season_points: 2840, pools_won: 18, pools_entered: 24, streak_best: 7, user_id: 'u1', user: { full_name: 'Alex Chen', username: '@alexc', avatar_url: '' } },
  { rank_position: 2, season_points: 2610, pools_won: 15, pools_entered: 22, streak_best: 5, user_id: 'u2', user: { full_name: 'Jordan Smith', username: '@jsmith', avatar_url: '' } },
  { rank_position: 3, season_points: 2390, pools_won: 14, pools_entered: 20, streak_best: 6, user_id: 'u3', user: { full_name: 'Sam Rivera', username: '@samr', avatar_url: '' } },
  { rank_position: 4, season_points: 2150, pools_won: 12, pools_entered: 19, streak_best: 4, user_id: 'u4', user: { full_name: 'Taylor Kim', username: '@tkim', avatar_url: '' } },
  { rank_position: 5, season_points: 1980, pools_won: 11, pools_entered: 18, streak_best: 4, user_id: 'u5', user: { full_name: 'Morgan Lee', username: '@mlee', avatar_url: '' } },
  { rank_position: 6, season_points: 1820, pools_won: 10, pools_entered: 17, streak_best: 3, user_id: 'u6', user: { full_name: 'Casey Park', username: '@cpark', avatar_url: '' } },
  { rank_position: 7, season_points: 1650, pools_won: 9, pools_entered: 16, streak_best: 3, user_id: 'u7', user: { full_name: 'Riley Johnson', username: '@rjohnson', avatar_url: '' } },
  { rank_position: 8, season_points: 1490, pools_won: 8, pools_entered: 15, streak_best: 2, user_id: 'u8', user: { full_name: 'Drew Wilson', username: '@dwilson', avatar_url: '' } },
  { rank_position: 9, season_points: 1320, pools_won: 7, pools_entered: 14, streak_best: 2, user_id: 'u9', user: { full_name: 'Quinn Davis', username: '@qdavis', avatar_url: '' } },
  { rank_position: 10, season_points: 1180, pools_won: 6, pools_entered: 13, streak_best: 2, user_id: 'u10', user: { full_name: 'Avery Brown', username: '@abrown', avatar_url: '' } },
];

const MOCK_BADGES: Badge[] = [
  { badge_key: 'season1_winner', badge_name: 'Season Champion', badge_icon: '🏆', badge_tier: 'legendary', badge_description: 'Won the most pools in Season 1' },
  { badge_key: 'season1_streak', badge_name: 'Hot Streak', badge_icon: '🔥', badge_tier: 'rare', badge_description: 'Won 5 pools in a row' },
  { badge_key: 'trustworthy', badge_name: 'Trustworthy', badge_icon: '🛡️', badge_tier: 'uncommon', badge_description: 'Maintained 90%+ accountability' },
  { badge_key: 'social_butterfly', badge_name: 'Social Butterfly', badge_icon: '🦋', badge_tier: 'common', badge_description: 'Endorsed by 10+ users' },
  { badge_key: 'dispute_free', badge_name: 'Clean Record', badge_icon: '✨', badge_tier: 'uncommon', badge_description: 'Zero disputes this season' },
];

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
  const [rankings, setRankings] = useState<Ranking[]>(MOCK_RANKINGS);
  const [badges, setBadges] = useState<Badge[]>(MOCK_BADGES);
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
          if (rankData && rankData.length > 0) setRankings(rankData as any);

          const { data: badgeData } = await supabase
            .from('seasonal_badges')
            .select('*')
            .eq('season_id', seasonData.id);
          if (badgeData && badgeData.length > 0) setBadges(badgeData as any);
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
