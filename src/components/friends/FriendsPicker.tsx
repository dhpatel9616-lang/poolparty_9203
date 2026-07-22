'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Check } from 'lucide-react';
import {
  getFriendsForPicker,
  inviteFriendToGroup,
  invitePoolFriend,
  type FriendOption,
} from '@/lib/supabase/services';

interface FriendsPickerProps {
  mode: 'group' | 'pool';
  targetId: string; // groupId or poolId depending on mode
  excludeUserIds?: string[]; // e.g. existing group members, already-invited pool participants
}

export function FriendsPicker({ mode, targetId, excludeUserIds = [] }: FriendsPickerProps) {
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getFriendsForPicker(excludeUserIds);
        if (!cancelled) setFriends(data);
      } catch (err) {
        console.error('Failed to load friends', err);
        if (!cancelled) setError('Could not load your friends list.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  async function handleInvite(friend: FriendOption) {
    setPendingId(friend.id);
    setError(null);
    try {
      if (mode === 'group') {
        await inviteFriendToGroup(targetId, friend.id);
      } else {
        await invitePoolFriend(targetId, friend.id);
      }
      setInvitedIds((prev) => new Set(prev).add(friend.id));
    } catch (err) {
      console.error('Failed to send invite', err);
      setError('Could not send that invite. Try again.');
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Loading friends...
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-semibold text-foreground">No friends to add yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Everyone you&apos;re friends with is either already here or you haven&apos;t added anyone yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {error && (
        <p className="text-xs px-1 pb-2" style={{ color: 'var(--destructive)' }}>
          {error}
        </p>
      )}
      {friends.map((friend) => {
        const isInvited = invitedIds.has(friend.id);
        const isPending = pendingId === friend.id;
        return (
          <div
            key={friend.id}
            className="flex items-center justify-between px-2 py-2.5 rounded-xl"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: 'var(--elevated)' }}
              >
                {friend.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                    {(friend.full_name || friend.username || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {friend.full_name || friend.username || 'Friend'}
                </p>
                {friend.username && (
                  <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                    @{friend.username}
                  </p>
                )}
              </div>
            </div>

            <button
              disabled={isPending || isInvited}
              onClick={() => handleInvite(friend)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
              style={{
                background: isInvited ? 'var(--elevated)' : 'var(--primary)',
                color: isInvited ? 'var(--muted-foreground)' : '#fff',
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isInvited ? (
                <>
                  <Check size={12} /> Invited
                </>
              ) : (
                <>
                  <UserPlus size={12} /> {isPending ? 'Sending...' : 'Add'}
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
