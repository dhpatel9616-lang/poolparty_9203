'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { requestToJoinGroup } from '@/lib/supabase/services';

interface GroupInfo {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  member_count: number;
  require_approval?: boolean;
}

interface JoinGroupCardProps {
  inviteCode: string;
  group: GroupInfo | null;
  inviteStatus: string | null;
}

export default function JoinGroupCard({ inviteCode, group, inviteStatus }: JoinGroupCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [requestPending, setRequestPending] = useState(false);

  // Check whether this user is already a member, or already has a
  // pending request, so the button reflects reality instead of always
  // showing "Join".
  useEffect(() => {
    if (!user?.id || !group) return;
    const supabase = createClient();
    (async () => {
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existingMember) { setJoined(true); return; }

      if (group.require_approval) {
        const { data: existingRequest } = await supabase
          .from('group_join_requests')
          .select('id, status')
          .eq('group_id', group.id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (existingRequest?.status === 'pending') setRequestPending(true);
      }
    })();
  }, [user?.id, group?.id, group?.require_approval]);

  const handleJoin = async () => {
    if (!user?.id) {
      // Not logged in — send them to sign up, then back here after
      router.push(`/sign-up-login-screen?redirect=/invite/${inviteCode}`);
      return;
    }
    if (!group) return;

    setJoining(true);
    try {
      const supabase = createClient();

      // Already a member?
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        setJoined(true);
        setJoining(false);
        return;
      }

      if (group.require_approval) {
        await requestToJoinGroup(group.id, user.id);
        setRequestPending(true);
        toast.success('Request sent — the group owner will review it.');
        setJoining(false);
        return;
      }

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'member' });
      if (memberError) throw memberError;
      // groups.member_count is kept accurate by a database trigger —
      // regular members can't update a group row directly under RLS,
      // so there's no client-side count update here anymore.

      // Mark the invite as accepted (best-effort, not blocking)
      await supabase
        .from('group_invites')
        .update({ status: 'accepted', accepted_by: user.id, accepted_at: new Date().toISOString() })
        .eq('invite_code', inviteCode);

      setJoined(true);
      toast.success(`Welcome to ${group.name}! 🎉`);
      setTimeout(() => router.push('/groups-screen'), 1200);
    } catch (err: any) {
      toast.error(err.message || 'Failed to join group');
    }
    setJoining(false);
  };

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Invite not found</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          This invite link may have expired or is invalid.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="text-6xl mb-4">{group.emoji}</div>
      <h1 className="text-2xl font-bold mb-1">{group.name}</h1>
      {group.description && (
        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{group.description}</p>
      )}
      <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
        {group.member_count} member{group.member_count === 1 ? '' : 's'}
      </p>

      {joined ? (
        <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>You&apos;re in! Redirecting...</p>
      ) : requestPending ? (
        <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>Request sent — waiting on the group owner to approve.</p>
      ) : inviteStatus === 'expired' ? (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>This invite has expired.</p>
      ) : (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="px-8 py-3 rounded-xl text-sm font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff',
            opacity: joining ? 0.7 : 1,
          }}
        >
          {joining ? (group.require_approval ? 'Sending request...' : 'Joining...') : user ? (group.require_approval ? `Request to join ${group.name}` : `Join ${group.name}`) : 'Sign in to Join'}
        </button>
      )}
    </div>
  );
}
