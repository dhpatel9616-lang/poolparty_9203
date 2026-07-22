'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface InviterInfo {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function FriendInvitePage() {
  const params = useParams();
  const inviteCode = params['invite-code'] as string;
  const router = useRouter();
  const { user } = useAuth();

  const [inviter, setInviter] = useState<InviterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: invite } = await supabase
        .from('friend_invites')
        .select('id, inviter_id, status, expires_at, inviter:inviter_id(id, full_name, avatar_url)')
        .eq('invite_code', inviteCode)
        .maybeSingle();

      if (invite) {
        const isExpired = invite.expires_at ? new Date(invite.expires_at).getTime() < Date.now() : false;
        setStatus(isExpired ? 'expired' : invite.status);
        const rawInviter = invite.inviter as any;
        setInviter(Array.isArray(rawInviter) ? rawInviter[0] : rawInviter);
      }
      setLoading(false);
    };
    load();
  }, [inviteCode]);

  const handleAccept = async () => {
    if (!user?.id) {
      router.push(`/sign-up-login-screen?redirect=/friend-invite/${inviteCode}`);
      return;
    }
    if (!inviter || inviter.id === user.id) return;

    setAccepting(true);
    try {
      const supabase = createClient();

      // Already friends or a pending request already exists?
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${inviter.id},addressee_id.eq.${user.id}),and(requester_id.eq.${user.id},addressee_id.eq.${inviter.id})`)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('friendships')
          .insert({ requester_id: inviter.id, addressee_id: user.id, status: 'accepted', responded_at: new Date().toISOString() });
        if (error) throw error;
      }

      await supabase
        .from('friend_invites')
        .update({ status: 'accepted', accepted_by: user.id, accepted_at: new Date().toISOString() })
        .eq('invite_code', inviteCode);

      setAccepted(true);
      toast.success(`You're now friends with ${inviter.full_name}! 🎉`);
      setTimeout(() => router.push('/friends-screen'), 1200);
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept invite');
    }
    setAccepting(false);
  };

  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {loading ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : !inviter ? (
          <>
            <h1 className="text-2xl font-bold mb-2">Invite not found</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This invite link may have expired or is invalid.
            </p>
          </>
        ) : (
          <>
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,201,167,0.2))',
                border: '1.5px solid rgba(124,92,255,0.3)',
                color: 'var(--primary)',
              }}
            >
              {inviter.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={inviter.avatar_url} alt={inviter.full_name} className="w-full h-full object-cover" />
              ) : (
                inviter.full_name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
              )}
            </div>
            <h1 className="text-2xl font-bold mb-1">{inviter.full_name}</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              wants to be friends on PoolParty
            </p>

            {accepted ? (
              <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>You&apos;re connected! Redirecting...</p>
            ) : status === 'expired' ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>This invite has expired.</p>
            ) : (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="px-8 py-3 rounded-xl text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: '#fff',
                  opacity: accepting ? 0.7 : 1,
                }}
              >
                {accepting ? 'Connecting...' : user ? 'Accept' : 'Sign in to Accept'}
              </button>
            )}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
