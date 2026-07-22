'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  fetchAccountabilityScore,
  fetchUserBadges,
  sendFriendRequest,
  respondToFriendRequest,
} from '@/lib/supabase/services';

interface OtherProfile {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

type FriendState = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'self';

const TIER_MAP: Record<string, string> = {
  bronze: 'Risky', silver: 'Good', gold: 'Good', platinum: 'Excellent', diamond: 'Excellent', legend: 'Excellent',
};

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params['user-id'] as string;
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<OtherProfile | null>(null);
  const [score, setScore] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [friendState, setFriendState] = useState<FriendState>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      const supabase = createClient();

      if (user?.id === userId) {
        router.replace('/profile-screen');
        return;
      }

      const [profileRes, scoreData, badgeData] = await Promise.all([
        supabase.from('user_profiles').select('id, full_name, username, avatar_url, bio').eq('id', userId).maybeSingle(),
        fetchAccountabilityScore(userId),
        fetchUserBadges(userId),
      ]);

      setProfile(profileRes.data ?? null);
      setScore(scoreData);
      setBadges(badgeData);

      if (user?.id) {
        const { data: existing } = await supabase
          .from('friendships')
          .select('id, status, requester_id')
          .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
          .maybeSingle();

        if (existing) {
          setFriendshipId(existing.id);
          if (existing.status === 'accepted') setFriendState('friends');
          else if (existing.status === 'pending') {
            setFriendState(existing.requester_id === user.id ? 'pending_sent' : 'pending_received');
          }
        }
      }
      setLoading(false);
    };
    load();
  }, [userId, user?.id, router]);

  const handleSendRequest = async () => {
    if (!user?.id) return;
    setActionLoading(true);
    try {
      await sendFriendRequest(user.id, userId);
      setFriendState('pending_sent');
      toast.success('Friend request sent');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send request');
    }
    setActionLoading(false);
  };

  const handleAccept = async () => {
    if (!friendshipId) return;
    setActionLoading(true);
    try {
      await respondToFriendRequest(friendshipId, true);
      setFriendState('friends');
      toast.success('Friend added! 🎉');
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept');
    }
    setActionLoading(false);
  };

  const trustScore = score ? Math.round((score.accountability_score ?? 50) * 10) : 500;
  const trustTier = TIER_MAP[score?.reputation_level ?? 'silver'] ?? 'Good';

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!profile) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <h1 className="text-xl font-bold mb-2">User not found</h1>
          <button onClick={() => router.back()} className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Go back</button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold mb-3 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,201,167,0.2))',
              border: '1.5px solid rgba(124,92,255,0.3)',
              color: 'var(--primary)',
            }}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              profile.full_name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?'
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">{profile.full_name}</h2>
          {profile.username && (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="text-sm mt-2 max-w-xs" style={{ color: 'var(--muted-foreground)' }}>{profile.bio}</p>
          )}

          {/* Friend action */}
          <div className="mt-4">
            {friendState === 'friends' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl" style={{ background: 'rgba(0,201,167,0.12)', color: 'var(--success)' }}>
                <Check size={14} /> Friends
              </span>
            )}
            {friendState === 'pending_sent' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl" style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
                <Clock size={14} /> Request Sent
              </span>
            )}
            {friendState === 'pending_received' && (
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl"
                style={{ background: 'var(--primary)', color: '#fff', opacity: actionLoading ? 0.7 : 1 }}
              >
                <Check size={14} /> Accept Request
              </button>
            )}
            {friendState === 'none' && (
              <button
                onClick={handleSendRequest}
                disabled={actionLoading}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl"
                style={{ background: 'var(--primary)', color: '#fff', opacity: actionLoading ? 0.7 : 1 }}
              >
                <UserPlus size={14} /> Add Friend
              </button>
            )}
          </div>
        </div>

        {/* Trust score summary */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Trust Score</span>
            <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}>{trustTier}</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{trustScore}</p>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{score?.total_contracts ?? 0}</p>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Contracts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{score?.completed_contracts ?? 0}</p>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Completed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{Math.round(score?.would_participate_again_pct ?? 100)}%</p>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Would Play Again</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold text-foreground mb-3">Badges</p>
            <div className="flex flex-wrap gap-2">
              {badges.map((b: any) => {
                const badge = Array.isArray(b.badge) ? b.badge[0] : b.badge;
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: 'rgba(124,92,255,0.1)', color: 'var(--primary)', border: '1px solid rgba(124,92,255,0.2)' }}
                  >
                    <span>{badge?.badge_icon || '🏅'}</span>
                    {badge?.badge_name || 'Badge'}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
