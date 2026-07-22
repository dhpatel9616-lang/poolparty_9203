'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, Link as LinkIcon, Copy, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { searchUsers, sendFriendRequest, generateFriendInviteLink, FriendProfile } from '@/lib/supabase/services';

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

export default function OnboardingAddFriendsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  React.useEffect(() => {
    if (!searchQuery.trim() || !user?.id) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      const results = await searchUsers(searchQuery, user.id);
      setSearchResults(results);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchQuery, user?.id]);

  const handleSend = async (addresseeId: string) => {
    if (!user?.id) return;
    try {
      await sendFriendRequest(user.id, addresseeId);
      setSentTo((prev) => new Set(prev).add(addresseeId));
      toast.success('Request sent');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send request');
    }
  };

  const handleGenerateLink = async () => {
    if (!user?.id) return;
    setGeneratingLink(true);
    try {
      const { invite_url } = await generateFriendInviteLink(user.id);
      setInviteUrl(invite_url);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create link');
    }
    setGeneratingLink(false);
  };

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Link copied!');
  };

  const handleContinue = () => router.push('/home-screen');

  return (
    <MobileLayout>
      <div className="px-4 pt-8 pb-24">
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--grad-start), var(--grad-end))' }}
          >
            <UserPlus size={26} color="#fff" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Find your friends</h1>
          <p className="text-sm px-6" style={{ color: 'var(--muted-foreground)' }}>
            PoolParty is more fun with friends. Search for people already here, or share your invite link.
          </p>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
          style={{ background: 'var(--elevated)', border: '1.5px solid var(--border)' }}
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

        <div className="space-y-2 mb-6">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}
            >
              <Avatar name={result.full_name} url={result.avatar_url} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{result.full_name}</p>
                {result.username && (
                  <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>@{result.username}</p>
                )}
              </div>
              <button
                onClick={() => handleSend(result.id)}
                disabled={sentTo.has(result.id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0"
                style={{
                  background: sentTo.has(result.id) ? 'var(--elevated)' : 'var(--primary)',
                  color: sentTo.has(result.id) ? 'var(--muted-foreground)' : '#fff',
                }}
              >
                {sentTo.has(result.id) ? 'Sent' : 'Add'}
              </button>
            </div>
          ))}
        </div>

        {/* Invite link */}
        <div className="pt-4 border-t mb-8" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>OR INVITE BY LINK</p>
          {inviteUrl ? (
            <div
              className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'var(--elevated)', border: '1.5px solid var(--border)' }}
            >
              <LinkIcon size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <p className="flex-1 text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{inviteUrl}</p>
              <button
                onClick={handleCopyLink}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--primary)' }}
              >
                <Copy size={14} color="#fff" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateLink}
              disabled={generatingLink}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'var(--elevated)',
                border: '1.5px solid var(--border)',
                color: 'var(--foreground)',
                opacity: generatingLink ? 0.7 : 1,
              }}
            >
              <LinkIcon size={14} />
              {generatingLink ? 'Creating link...' : 'Generate Invite Link'}
            </button>
          )}
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          Continue to PoolParty
          <ArrowRight size={16} />
        </button>
      </div>
    </MobileLayout>
  );
}
