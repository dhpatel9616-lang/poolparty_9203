'use client';
import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Users, TrendingUp, Star, Globe, Share2, CheckCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

interface CreatorProfile {
  id: string;
  display_name: string;
  tagline: string;
  is_verified: boolean;
  is_public: boolean;
  follower_count: number;
  following_count: number;
  public_pool_count: number;
  total_participants: number;
  creator_score: number;
  social_links: Record<string, string> | null;
}

const MOCK_CREATOR: CreatorProfile = {
  id: '1', display_name: 'PoolMaster Pro', tagline: 'Creating the best sports pools since 2023 🏆',
  is_verified: true, is_public: true, follower_count: 1247, following_count: 89,
  public_pool_count: 34, total_participants: 8920, creator_score: 94.2, social_links: null,
};

const MOCK_TOP_POOLS = [
  { id: '1', name: 'NBA Finals 2026', participants: 342, prize: '$1,200', status: 'active' },
  { id: '2', name: 'World Cup Qualifier', participants: 218, prize: '$800', status: 'active' },
  { id: '3', name: 'Super Bowl LX', participants: 891, prize: '$3,500', status: 'ended' },
  { id: '4', name: 'March Madness 2026', participants: 456, prize: '$2,000', status: 'ended' },
];

const MOCK_GROUPS = [
  { id: 'g1', name: 'Sports Fanatics', memberCount: 24, activeContracts: 3 },
  { id: 'g2', name: 'Crypto Predictors', memberCount: 12, activeContracts: 1 },
];

const MOCK_ACTIVITY = [
  { id: 'a1', type: 'pool_created', text: 'Created "NBA Finals 2026"', time: '2 days ago' },
  { id: 'a2', type: 'pool_resolved', text: 'Resolved "Super Bowl LX" — Lakers won 🏆', time: '1 week ago' },
  { id: 'a3', type: 'follower', text: '12 new followers this week', time: '1 week ago' },
];

export default function CreatorProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const creatorId = searchParams?.get('id');
  const fromDiscover = searchParams?.get('from') === 'discover';

  const [profile, setProfile] = useState<CreatorProfile>(MOCK_CREATOR);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pools' | 'groups' | 'activity' | 'reputation'>('pools');
  const [loading, setLoading] = useState(false);
  const [becomingCreator, setBecomingCreator] = useState(false);
  const [hasCreatorProfile, setHasCreatorProfile] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (creatorId) {
          const { data } = await supabase.from('creator_profiles').select('*').eq('id', creatorId).single();
          if (data) setProfile(data);
          const { data: followData } = await supabase.from('creator_follows').select('id').eq('follower_id', user.id).eq('creator_id', creatorId).single();
          setIsFollowing(!!followData);
          setIsOwnProfile(false);
        } else {
          const { data } = await supabase.from('creator_profiles').select('*').eq('user_id', user.id).single();
          if (data) { setProfile(data); setHasCreatorProfile(true); }
          setIsOwnProfile(true);
        }
      } catch {}
      setLoading(false);
    };
    fetchProfile();
  }, [user, creatorId]);

  const handleBecomeCreator = async () => {
    if (!user) return;
    setBecomingCreator(true);
    try {
      const { data, error } = await supabase.from('creator_profiles').insert({ user_id: user.id, display_name: user.user_metadata?.full_name || 'New Creator', tagline: 'Creating amazing pools', is_public: true }).select().single();
      if (!error && data) { setProfile(data); setHasCreatorProfile(true); toast.success('Creator profile created!'); }
    } catch {}
    setBecomingCreator(false);
  };

  const handleFollow = async () => {
    if (!user) { toast.error('Sign in to follow creators'); return; }
    const targetId = creatorId || profile.id;
    setIsFollowing((prev) => !prev);
    try {
      if (isFollowing) {
        await supabase.from('creator_follows').delete().eq('follower_id', user.id).eq('creator_id', targetId);
        toast.success('Unfollowed');
      } else {
        await supabase.from('creator_follows').insert({ follower_id: user.id, creator_id: targetId });
        toast.success(`Following ${profile.display_name}!`);
      }
    } catch { setIsFollowing((prev) => !prev); }
  };

  const handleShare = () => {
    const url = `${window.location?.origin}/creator-profile?id=${creatorId || profile.id}`;
    if (navigator.share) {
      navigator.share({ title: `${profile.display_name} on PoolParty`, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
      toast.success('Link copied!');
    }
  };

  const handleBack = () => {
    if (fromDiscover) router.push('/discover-pools');
    else router.back();
  };

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full pb-24">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <button onClick={handleBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--muted-foreground)' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Creator Profile</h1>
            {fromDiscover && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>← Discover</p>}
          </div>
          <button onClick={handleShare} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Share2 size={16} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pt-4 space-y-4 pb-8">
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(124,92,255,0.15), rgba(0,201,167,0.1))', border: '1px solid rgba(124,92,255,0.3)' }}>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--primary), #00C9A7)' }}>
                {profile.display_name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{profile.display_name}</h2>
                  {profile.is_verified && <CheckCircle size={16} style={{ color: 'var(--primary)' }} />}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{profile.tagline}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Globe size={12} style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Public Creator</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(124,92,255,0.2)' }}>
              {[
                { label: 'Followers', value: profile.follower_count.toLocaleString() },
                { label: 'Pools', value: profile.public_pool_count },
                { label: 'Players', value: profile.total_participants.toLocaleString() },
                { label: 'Score', value: profile.creator_score.toFixed(0) },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-base font-black text-foreground">{s.value}</p>
                  <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              {!isOwnProfile ? (
                <button onClick={handleFollow} className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95" style={{ background: isFollowing ? 'var(--elevated)' : 'var(--primary)', color: isFollowing ? 'var(--muted-foreground)' : '#fff', border: isFollowing ? '1px solid var(--border)' : 'none' }}>
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              ) : !hasCreatorProfile ? (
                <button onClick={handleBecomeCreator} disabled={becomingCreator} className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95" style={{ background: 'var(--primary)', color: '#fff' }}>
                  {becomingCreator ? 'Setting up...' : 'Become a Creator'}
                </button>
              ) : (
                <button onClick={() => router.push('/create-screen')} className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95" style={{ background: 'var(--primary)', color: '#fff' }}>
                  + Create Pool
                </button>
              )}
              <button onClick={handleShare} className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <Share2 size={16} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>
          </div>

          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
            {(['pools', 'groups', 'activity', 'reputation'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all" style={{ background: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? '#fff' : 'var(--muted-foreground)' }}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'pools' && (
            <div className="space-y-3">
              {MOCK_TOP_POOLS.map((pool) => (
                <Link key={pool.id} href={`/contract-detail-screen?id=${pool.id}`} className="rounded-xl p-3 flex items-center gap-3 block" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: pool.status === 'active' ? 'rgba(0,230,118,0.15)' : 'var(--elevated)' }}>
                    <Star size={18} style={{ color: pool.status === 'active' ? 'var(--success)' : 'var(--muted-foreground)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{pool.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{pool.participants} players · {pool.prize}</p>
                  </div>
                  <span className="text-2xs px-2 py-0.5 rounded-full font-medium" style={{ background: pool.status === 'active' ? 'rgba(0,230,118,0.15)' : 'var(--elevated)', color: pool.status === 'active' ? 'var(--success)' : 'var(--muted-foreground)' }}>
                    {pool.status}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-3">
              {MOCK_GROUPS.map((group) => (
                <div key={group.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'var(--elevated)' }}>🏆</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{group.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{group.memberCount} members · {group.activeContracts} active</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {MOCK_ACTIVITY.map((item) => (
                <div key={item.id} className="rounded-xl p-3 flex items-start gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,92,255,0.15)' }}>
                    {item.type === 'pool_created' ? <Star size={14} style={{ color: 'var(--primary)' }} /> : item.type === 'follower' ? <Users size={14} style={{ color: 'var(--primary)' }} /> : <TrendingUp size={14} style={{ color: 'var(--primary)' }} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reputation' && (
            <div className="space-y-3">
              <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>Creator Score</p>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,201,167,0.2))', border: '2px solid var(--primary)' }}>
                    <span className="text-xl font-black" style={{ color: 'var(--primary)' }}>{profile.creator_score.toFixed(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Excellent Creator</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Top 5% of all creators</p>
                  </div>
                </div>
              </div>
              {[
                { label: 'Pool Quality', value: 96, color: 'var(--success)' },
                { label: 'Engagement Rate', value: 88, color: 'var(--primary)' },
                { label: 'Resolution Accuracy', value: 100, color: '#FFD700' },
                { label: 'Community Trust', value: 92, color: '#00C9A7' },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{metric.label}</span>
                    <span className="text-sm font-bold" style={{ color: metric.color }}>{metric.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--elevated)' }}>
                    <div className="h-full rounded-full" style={{ width: `${metric.value}%`, background: metric.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
