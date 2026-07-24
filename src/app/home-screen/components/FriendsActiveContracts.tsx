'use client';
import React, { useState, useEffect } from 'react';
import { Users, Clock, ChevronRight, UserCheck } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface FriendContract {
  id: string;
  title: string;
  status: string;
  icon: string | null;
  participant_count: number | null;
  entry_deadline: string | null;
  friend_names: string[];
}

export default function FriendsActiveContracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<FriendContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchFriendsContracts() {
      const supabase = createClient();

      // Step 1: Get connected friend IDs from friendships (accepted, both directions).
      // (Previously queried trust_relationships, a table nothing in the app
      // ever writes to — this widget always showed "No friend activity"
      // regardless of real friends.)
      const [outgoingResult, incomingResult] = await Promise.all([
        supabase
          .from('friendships')
          .select('addressee_id')
          .eq('requester_id', user!.id)
          .eq('status', 'accepted'),
        supabase
          .from('friendships')
          .select('requester_id')
          .eq('addressee_id', user!.id)
          .eq('status', 'accepted'),
      ]);

      const friendIds = Array.from(
        new Set([
          ...(outgoingResult.data ?? []).map((r: any) => r.addressee_id),
          ...(incomingResult.data ?? []).map((r: any) => r.requester_id),
        ])
      ).filter((id) => id !== user!.id);

      if (friendIds.length === 0) {
        setContracts([]);
        setLoading(false);
        return;
      }

      // Step 2: Get pool_entries for those friends (active pools only)
      const { data: entries } = await supabase
        .from('pool_entries')
        .select('pool_id, user_id, user:user_id(full_name)')
        .in('user_id', friendIds);

      if (!entries || entries.length === 0) {
        setContracts([]);
        setLoading(false);
        return;
      }

      // Step 3: Get unique pool IDs (excluding pools the current user is already in)
      const { data: myEntries } = await supabase
        .from('pool_entries')
        .select('pool_id')
        .eq('user_id', user!.id);

      const myPoolIds = new Set((myEntries ?? []).map((e: any) => e.pool_id));

      // Build a map of pool_id -> friend names
      const poolFriendMap: Record<string, string[]> = {};
      for (const entry of entries) {
        const poolId = entry.pool_id;
        if (myPoolIds.has(poolId)) continue;
        if (!poolFriendMap[poolId]) poolFriendMap[poolId] = [];
        const name = (entry.user as any)?.full_name ?? 'Friend';
        if (!poolFriendMap[poolId].includes(name)) {
          poolFriendMap[poolId].push(name);
        }
      }

      const friendPoolIds = Object.keys(poolFriendMap);
      if (friendPoolIds.length === 0) {
        setContracts([]);
        setLoading(false);
        return;
      }

      // Step 4: Fetch the actual pool data for those IDs (open status only)
      const { data: pools } = await supabase
        .from('pools')
        .select('id, title, status, icon, participant_count, entry_deadline')
        .in('id', friendPoolIds)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);

      const result: FriendContract[] = (pools ?? []).map((p: any) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        icon: p.icon,
        participant_count: p.participant_count,
        entry_deadline: p.entry_deadline,
        friend_names: poolFriendMap[p.id] ?? [],
      }));

      setContracts(result);
      setLoading(false);
    }

    fetchFriendsContracts();
  }, [user]);

  if (!user) return null;

  return (
    <div className="mt-2">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(124,92,255,0.15)' }}
        >
          <UserCheck size={13} style={{ color: 'var(--primary)' }} />
        </div>
        <p className="text-sm font-semibold text-foreground">Friends&apos; Active Contracts</p>
      </div>

      {loading ? (
        <div className="text-center py-6">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
        </div>
      ) : contracts.length === 0 ? (
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm font-semibold text-foreground">No friend activity yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Connect with friends to see their active contracts here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map((c) => (
            <Link
              key={c.id}
              href={`/contract-detail-screen?id=${c.id}`}
              className="block rounded-xl p-4 card-interactive"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {c.icon && (
                    <span className="text-base leading-none mt-0.5 flex-shrink-0">{c.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Users size={11} style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {c.participant_count ?? 0} joined
                        </span>
                      </div>
                      {c.entry_deadline && (
                        <div className="flex items-center gap-1">
                          <Clock size={11} style={{ color: 'var(--muted-foreground)' }} />
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {new Date(c.entry_deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <StatusBadge status={c.status as 'open' | 'locked' | 'resolved'} />
                  <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                </div>
              </div>
              {/* Friend names row */}
              {c.friend_names.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <UserCheck size={11} style={{ color: 'var(--primary)' }} />
                  <span className="text-xs" style={{ color: 'var(--primary)' }}>
                    {c.friend_names.slice(0, 2).join(', ')}
                    {c.friend_names.length > 2 && ` +${c.friend_names.length - 2} more`}
                    {' '}active
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
