'use client';
import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, CheckCircle, Users, Trophy, Star, Flame, UserPlus, UserCheck, ChevronRight, Crown, Zap, BarChart2,  } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CreatorCard {
  id: string;
  display_name: string;
  tagline: string;
  is_verified: boolean;
  follower_count: number;
  public_pool_count: number;
  total_participants: number;
  creator_score: number;
  activity_rank: number;
  recent_pools: number;
  joined?: boolean;
}

type SortMode = 'activity' | 'followers' | 'pools' | 'score';

const SORT_OPTIONS: { key: SortMode; label: string; icon: React.ReactNode }[] = [
  { key: 'activity', label: 'Active', icon: <Flame size={12} /> },
  { key: 'followers', label: 'Followers', icon: <Users size={12} /> },
  { key: 'pools', label: 'Pools', icon: <BarChart2 size={12} /> },
  { key: 'score', label: 'Score', icon: <Star size={12} /> },
];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_ICONS = [Crown, Trophy, Star];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function CreatorMarketplacePage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [creators, setCreators] = useState<CreatorCard[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const { data } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('is_public', true)
          .order('creator_score', { ascending: false })
          .limit(20);
        if (data) {
          setCreators(
            data.map((c, i) => ({
              ...c,
              activity_rank: i + 1,
              recent_pools: c.public_pool_count ?? 0,
            }))
          );
        }
      } catch {}
    };
    fetchCreators();
  }, []);

  const sorted = [...creators]
    .filter(c =>
      searchQuery
        ? c.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.tagline.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .sort((a, b) => {
      if (sortMode === 'activity') return b.recent_pools - a.recent_pools;
      if (sortMode === 'followers') return b.follower_count - a.follower_count;
      if (sortMode === 'pools') return b.public_pool_count - a.public_pool_count;
      return b.creator_score - a.creator_score;
    });

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const handleFollow = async (creatorId: string) => {
    if (!user) {
      toast.error('Sign in to follow creators');
      return;
    }
    setLoadingFollow(creatorId);
    const isFollowing = followedIds.has(creatorId);
    try {
      if (isFollowing) {
        await supabase
          .from('creator_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('creator_id', creatorId);
        setFollowedIds(prev => {
          const next = new Set(prev);
          next.delete(creatorId);
          return next;
        });
        setCreators(prev =>
          prev.map(c =>
            c.id === creatorId ? { ...c, follower_count: c.follower_count - 1 } : c
          )
        );
      } else {
        await supabase
          .from('creator_follows')
          .insert({ follower_id: user.id, creator_id: creatorId });
        setFollowedIds(prev => new Set(prev).add(creatorId));
        setCreators(prev =>
          prev.map(c =>
            c.id === creatorId ? { ...c, follower_count: c.follower_count + 1 } : c
          )
        );
        toast.success('Following!');
      }
    } catch {
      toast.error('Something went wrong');
    }
    setLoadingFollow(null);
  };

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full pb-24">
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-xl font-black text-foreground tracking-tight">Creator Market</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Discover top pool creators & join their groups
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary), #00C9A7)' }}
            >
              <Zap size={16} color="#fff" />
            </div>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Search size={15} style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              placeholder="Search creators..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          {/* Sort pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortMode(opt.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0"
                style={{
                  background: sortMode === opt.key ? 'var(--primary)' : 'var(--surface)',
                  color: sortMode === opt.key ? '#fff' : 'var(--muted-foreground)',
                  border: sortMode === opt.key ? 'none' : '1px solid var(--border)',
                }}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Podium (top 3) */}
        {!searchQuery && (
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(124,92,255,0.12), rgba(0,201,167,0.08))',
                border: '1px solid rgba(124,92,255,0.25)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={14} style={{ color: 'var(--primary)' }} />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {sortMode === 'activity' ?'Most Active'
                    : sortMode === 'followers' ?'Top Followed'
                    : sortMode === 'pools' ?'Most Pools' :'Highest Score'}{' '}
                  Leaderboard
                </span>
              </div>

              <div className="flex items-end justify-center gap-3">
                {/* 2nd place */}
                {top3[1] && (
                  <PodiumCard
                    creator={top3[1]}
                    rank={2}
                    sortMode={sortMode}
                    isFollowing={followedIds.has(top3[1].id)}
                    loading={loadingFollow === top3[1].id}
                    onFollow={() => handleFollow(top3[1].id)}
                    height="h-28"
                  />
                )}
                {/* 1st place */}
                {top3[0] && (
                  <PodiumCard
                    creator={top3[0]}
                    rank={1}
                    sortMode={sortMode}
                    isFollowing={followedIds.has(top3[0].id)}
                    loading={loadingFollow === top3[0].id}
                    onFollow={() => handleFollow(top3[0].id)}
                    height="h-36"
                  />
                )}
                {/* 3rd place */}
                {top3[2] && (
                  <PodiumCard
                    creator={top3[2]}
                    rank={3}
                    sortMode={sortMode}
                    isFollowing={followedIds.has(top3[2].id)}
                    loading={loadingFollow === top3[2].id}
                    onFollow={() => handleFollow(top3[2].id)}
                    height="h-24"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Creator List */}
        <div className="px-4 space-y-3">
          {(searchQuery ? sorted : rest).map((creator, idx) => {
            const rank = searchQuery ? idx + 1 : idx + 4;
            const isFollowing = followedIds.has(creator.id);
            const isLoading = loadingFollow === creator.id;

            return (
              <div
                key={creator.id}
                className="rounded-2xl p-3.5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start gap-3">
                  {/* Rank + Avatar */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span
                      className="text-xs font-black w-5 text-center"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      #{rank}
                    </span>
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black"
                      style={{
                        background: `linear-gradient(135deg, hsl(${(creator.id.charCodeAt(0) * 47) % 360}, 60%, 50%), hsl(${(creator.id.charCodeAt(0) * 47 + 60) % 360}, 60%, 40%))`,
                        color: '#fff',
                      }}
                    >
                      {creator.display_name[0]}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground truncate">
                        {creator.display_name}
                      </span>
                      {creator.is_verified && (
                        <CheckCircle size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      )}
                    </div>
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {creator.tagline}
                    </p>

                    {/* Mini stats */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Users size={11} style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-xs font-semibold text-foreground">
                          {formatCount(creator.follower_count)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart2 size={11} style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-xs font-semibold text-foreground">
                          {creator.public_pool_count} pools
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame size={11} style={{ color: '#FF6B35' }} />
                        <span className="text-xs font-semibold" style={{ color: '#FF6B35' }}>
                          {creator.recent_pools} recent
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleFollow(creator.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                      style={{
                        background: isFollowing ? 'var(--elevated)' : 'var(--primary)',
                        color: isFollowing ? 'var(--muted-foreground)' : '#fff',
                        border: isFollowing ? '1px solid var(--border)' : 'none',
                        opacity: isLoading ? 0.6 : 1,
                      }}
                    >
                      {isFollowing ? (
                        <UserCheck size={11} />
                      ) : (
                        <UserPlus size={11} />
                      )}
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <Link
                      href="/creator-profile"
                      className="flex items-center gap-0.5 text-xs font-medium"
                      style={{ color: 'var(--primary)' }}
                    >
                      Join group
                      <ChevronRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                      Creator Score
                    </span>
                    <span className="text-2xs font-bold text-foreground">
                      {creator.creator_score.toFixed(1)}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--elevated)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${creator.creator_score}%`,
                        background: 'linear-gradient(90deg, var(--primary), #00C9A7)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {sorted.length === 0 && (
            <div className="text-center py-12">
              <Search size={32} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
              <p className="text-sm font-semibold text-foreground">No creators found</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Try a different search term
              </p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

interface PodiumCardProps {
  creator: CreatorCard;
  rank: 1 | 2 | 3;
  sortMode: SortMode;
  isFollowing: boolean;
  loading: boolean;
  onFollow: () => void;
  height: string;
}

function PodiumCard({ creator, rank, sortMode, isFollowing, loading, onFollow, height }: PodiumCardProps) {
  const RankIcon = RANK_ICONS[rank - 1];
  const rankColor = RANK_COLORS[rank - 1];

  const statValue =
    sortMode === 'activity'
      ? `${creator.recent_pools} pools`
      : sortMode === 'followers'
      ? formatCount(creator.follower_count)
      : sortMode === 'pools'
      ? `${creator.public_pool_count} total`
      : `${creator.creator_score.toFixed(0)}pts`;

  return (
    <div className={`flex flex-col items-center gap-1.5 flex-1 ${height}`}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: `${rankColor}22`, border: `1.5px solid ${rankColor}` }}
      >
        <RankIcon size={14} style={{ color: rankColor }} />
      </div>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black"
        style={{
          background: `linear-gradient(135deg, hsl(${(creator.id.charCodeAt(0) * 47) % 360}, 60%, 50%), hsl(${(creator.id.charCodeAt(0) * 47 + 60) % 360}, 60%, 40%))`,
          color: '#fff',
          border: rank === 1 ? `2px solid ${rankColor}` : 'none',
        }}
      >
        {creator.display_name[0]}
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-foreground leading-tight truncate max-w-[80px]">
          {creator.display_name}
        </p>
        <p className="text-2xs font-semibold" style={{ color: rankColor }}>
          {statValue}
        </p>
      </div>
      <button
        onClick={onFollow}
        disabled={loading}
        className="px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all active:scale-95"
        style={{
          background: isFollowing ? 'var(--elevated)' : 'var(--primary)',
          color: isFollowing ? 'var(--muted-foreground)' : '#fff',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
