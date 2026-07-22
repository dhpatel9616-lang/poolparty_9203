'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Search, UserPlus, Check, X, Link as LinkIcon, Users, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  searchUsers,
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  cancelFriendRequest,
  generateFriendInviteLink,
  FriendProfile,
} from '@/lib/supabase/services';

type Tab = 'friends' | 'requests' | 'add';

function Avatar({ name, url }: { name: string; url?: string | null }) {
  return (
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,201,167,0.2))',
        border: '1.5px solid rgba(124,92,255,0.3)',
        color: 'var(--primary)',
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
      )}
    </div>
  );
}

export default function FriendsList() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('friends');

  const [friends, setFriends] = useState<{ friendshipId: string; friend: FriendProfile }[]>([]);
  const [incoming, setIncoming] = useState<{ friendshipId: string; requester: FriendProfile; createdAt: string }[]>([]);
  const [outgoing, setOutgoing] = useState<{ friendshipId: string; addressee: FriendProfile; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [f, inc, out] = await Promise.all([
      fetchFriends(user.id),
      fetchIncomingRequests(user.id),
      fetchOutgoingRequests(user.id),
    ]);
    setFriends(f);
    setIncoming(inc);
    setOutgoing(out);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Debounced search
  useEffect(() => {
    if (tab !== 'add' || !searchQuery.trim() || !user?.id) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      const results = await searchUsers(searchQuery, user.id);
      // Filter out people who are already friends or have a pending request either way
      const existingIds = new Set([
        ...friends.map((f) => f.friend?.id),
        ...incoming.map((r) => r.requester?.id),
        ...outgoing.map((r) => r.addressee?.id),
      ]);
      setSearchResults(results.filter((r) => !existingIds.has(r.id)));
      setSearching(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchQuery, tab, user?.id, friends, incoming, outgoing]);

  const handleSendRequest = async (addresseeId: string) => {
    if (!user?.id) return;
    setSendingTo(addresseeId);
    try {
      await sendFriendRequest(user.id, addresseeId);
      toast.success('Friend request sent');
      setSearchResults((prev) => prev.filter((r) => r.id !== addresseeId));
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send request');
    }
    setSendingTo(null);
  };

  const handleRespond = async (friendshipId: string, accept: boolean) => {
    try {
      await respondToFriendRequest(friendshipId, accept);
      toast.success(accept ? 'Friend added! 🎉' : 'Request declined');
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    }
  };

  const handleCancelRequest = async (friendshipId: string) => {
    try {
      await cancelFriendRequest(friendshipId);
      toast.success('Request cancelled');
      loadAll();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      await removeFriend(friendshipId);
      toast.success('Removed');
      loadAll();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleGenerateLink = async () => {
    if (!user?.id) return;
    setGeneratingLink(true);
    try {
      const { invite_url } = await generateFriendInviteLink(user.id);
      setInviteUrl(invite_url);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invite link');
    }
    setGeneratingLink(false);
  };

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Link copied!');
  };

  const pendingCount = incoming.length;

  return (
    <div className="px-4 pt-4 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={18} style={{ color: 'var(--muted-foreground)' }} />
        </button>
        <h1 className="text-xl font-bold text-foreground flex-1">Friends</h1>
        <button
          onClick={() => { setTab('add'); if (!inviteUrl) handleGenerateLink(); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <LinkIcon size={13} />
          Invite
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
        {([
          ['friends', 'Friends'],
          ['requests', pendingCount > 0 ? `Requests (${pendingCount})` : 'Requests'],
          ['add', 'Add'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: tab === key ? 'var(--primary)' : 'transparent',
              color: tab === key ? '#fff' : 'var(--muted-foreground)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {tab === 'friends' && (
        <div>
          {loading ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
          ) : friends.length === 0 ? (
            <div className="text-center py-12">
              <Users size={32} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
              <p className="text-sm font-medium text-foreground mb-1">No friends yet</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Add friends to invite them to groups faster</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map(({ friendshipId, friend }) => (
                <div
                  key={friendshipId}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                >
                  <Link href={`/profile/${friend?.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar name={friend?.full_name || 'Friend'} url={friend?.avatar_url} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{friend?.full_name || 'Unknown'}</p>
                      {friend?.username && (
                        <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>@{friend.username}</p>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveFriend(friendshipId)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests tab */}
      {tab === 'requests' && (
        <div className="space-y-5">
          {incoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>RECEIVED</p>
              <div className="space-y-2">
                {incoming.map(({ friendshipId, requester }) => (
                  <div
                    key={friendshipId}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                  >
                    <Link href={`/profile/${requester?.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar name={requester?.full_name || 'User'} url={requester?.avatar_url} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{requester?.full_name || 'Unknown'}</p>
                        {requester?.username && (
                          <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>@{requester.username}</p>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => handleRespond(friendshipId, true)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--primary)' }}
                    >
                      <Check size={16} color="#fff" />
                    </button>
                    <button
                      onClick={() => handleRespond(friendshipId, false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                    >
                      <X size={16} style={{ color: 'var(--muted-foreground)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {outgoing.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>SENT</p>
              <div className="space-y-2">
                {outgoing.map(({ friendshipId, addressee }) => (
                  <div
                    key={friendshipId}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                  >
                    <Avatar name={addressee?.full_name || 'User'} url={addressee?.avatar_url} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{addressee?.full_name || 'Unknown'}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Pending</p>
                    </div>
                    <button
                      onClick={() => handleCancelRequest(friendshipId)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {incoming.length === 0 && outgoing.length === 0 && !loading && (
            <div className="text-center py-12">
              <UserPlus size={32} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
              <p className="text-sm font-medium text-foreground mb-1">No pending requests</p>
            </div>
          )}
        </div>
      )}

      {/* Add tab */}
      {tab === 'add' && (
        <div className="space-y-5">
          {/* Search */}
          <div>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
            >
              <Search size={16} style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none"
              />
            </div>

            {searching && (
              <p className="text-xs text-center py-3" style={{ color: 'var(--muted-foreground)' }}>Searching...</p>
            )}

            {!searching && searchQuery.trim() && searchResults.length === 0 && (
              <p className="text-xs text-center py-3" style={{ color: 'var(--muted-foreground)' }}>No users found</p>
            )}

            <div className="space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                >
                  <Link href={`/profile/${result.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar name={result.full_name} url={result.avatar_url} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{result.full_name}</p>
                      {result.username && (
                        <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>@{result.username}</p>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleSendRequest(result.id)}
                    disabled={sendingTo === result.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0"
                    style={{
                      background: sendingTo === result.id ? 'var(--elevated)' : 'var(--primary)',
                      color: sendingTo === result.id ? 'var(--muted-foreground)' : '#fff',
                      opacity: sendingTo === result.id ? 0.7 : 1,
                    }}
                  >
                    <UserPlus size={12} /> Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Invite link */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold mb-2 mt-4" style={{ color: 'var(--muted-foreground)' }}>OR SHARE A LINK</p>
            {inviteUrl ? (
              <div
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
              >
                <LinkIcon size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                <p className="flex-1 text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{inviteUrl}</p>
                <button
                  onClick={handleCopyLink}
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--primary)' }}
                >
                  <Copy size={14} style={{ color: '#fff' }} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{
                  background: generatingLink ? 'var(--elevated)' : 'var(--primary)',
                  color: '#fff',
                  opacity: generatingLink ? 0.7 : 1,
                }}
              >
                <LinkIcon size={14} />
                {generatingLink ? 'Creating link...' : 'Generate Invite Link'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
