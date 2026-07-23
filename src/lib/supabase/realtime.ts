'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SettlementRecord {
  id: string;
  pool_id: string | null;
  payer_id: string;
  recipient_id: string;
  amount: number;
  settlement_status: 'pending' | 'claimed_paid' | 'confirmed_received' | 'disputed' | 'overdue' | 'cancelled';
  due_date: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ActivityRecord {
  id: string;
  activity_type: string;
  pool_id?: string;
  actor_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

// ─── Settlements Realtime Hook ───────────────────────────────────────────────
// Reads the real `settlements` table (with reputation triggers, disputes,
// confirmations) — the system /settlement uses. The earlier `settlement_items`
// table is retired and no longer written to.

export function useSettlementsRealtime(poolId?: string) {
  const [items, setItems] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from('settlements')
      .select('*')
      .order('created_at', { ascending: false });

    if (poolId) {
      query = query.eq('pool_id', poolId);
    }

    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }, [poolId]);

  useEffect(() => {
    fetchItems();

    const supabase = createClient();
    const channelName = poolId ? `settlements_${poolId}` : 'settlements_all';
    const filter = poolId ? `pool_id=eq.${poolId}` : undefined;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settlements',
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems((prev) => [payload.new as SettlementRecord, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              prev.map((item) =>
                item.id === (payload.new as SettlementRecord).id
                  ? (payload.new as SettlementRecord)
                  : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) =>
              prev.filter((item) => item.id !== (payload.old as SettlementRecord).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poolId, fetchItems]);

  return { items, loading, error, refetch: fetchItems };
}

// ─── Activities Realtime Hook ─────────────────────────────────────────────────

export function useActivitiesRealtime(limit = 50) {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setActivities(data ?? []);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchActivities();

    const supabase = createClient();
    const channel = supabase
      .channel('activities_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        (payload) => {
          setActivities((prev) => [payload.new as ActivityRecord, ...prev.slice(0, limit - 1)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit, fetchActivities]);

  return { activities, loading, error, refetch: fetchActivities };
}

// ─── Notifications Realtime Hook ─────────────────────────────────────────────

export function useNotificationsRealtime(userId?: string) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const notifs = data ?? [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: NotificationRecord) => !n.read_at).length);
    }
    setLoading(false);
  }, [userId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const supabase = createClient();
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as NotificationRecord;
            setNotifications((prev) => [newNotif, ...prev]);
            if (!newNotif.read_at) {
              setUnreadCount((prev) => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as NotificationRecord;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
            // Recalculate unread
            setNotifications((prev) => {
              setUnreadCount(prev.filter((n) => !n.read_at).length);
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== (payload.old as NotificationRecord).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

// ─── Edge Function Callers ────────────────────────────────────────────────────

// ─── Contract Realtime Hook ───────────────────────────────────────────────────

export interface ContractRecord {
  id: string;
  title: string;
  status: string;
  winning_outcome_id?: string | null;
  resolved_at?: string | null;
  participant_count?: number;
  updated_at?: string;
  [key: string]: unknown;
}

export function useContractRealtime(contractId?: string) {
  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContract = useCallback(async () => {
    if (!contractId) { setLoading(false); return; }
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('pools')
      .select('*')
      .eq('id', contractId)
      .single();
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setContract(data);
    }
    setLoading(false);
  }, [contractId]);

  useEffect(() => {
    fetchContract();
    if (!contractId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`contract_${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pools',
          filter: `id=eq.${contractId}`,
        },
        (payload) => {
          setContract((prev) =>
            prev ? { ...prev, ...(payload.new as ContractRecord) } : (payload.new as ContractRecord)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contractId, fetchContract]);

  return { contract, loading, error, refetch: fetchContract };
}

// ─── Group Members Realtime Hook ──────────────────────────────────────────────

export interface GroupMemberRecord {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

export function useGroupMembersRealtime(groupId?: string) {
  const [members, setMembers] = useState<GroupMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMemberAlert, setNewMemberAlert] = useState<GroupMemberRecord | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!groupId) { setLoading(false); return; }
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('group_members')
      .select('*, profile:profiles(full_name, username, avatar_url)')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMembers(data ?? []);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchMembers();
    if (!groupId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`group_members_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMember = payload.new as GroupMemberRecord;
          setMembers((prev) => {
            if (prev.some((m) => m.id === newMember.id)) return prev;
            return [...prev, newMember];
          });
          setNewMemberAlert(newMember);
          setTimeout(() => setNewMemberAlert(null), 4000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          setMembers((prev) =>
            prev.filter((m) => m.id !== (payload.old as GroupMemberRecord).id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, fetchMembers]);

  return { members, loading, error, newMemberAlert, refetch: fetchMembers };
}

// ─── User Trust Score Realtime Hook ──────────────────────────────────────────

export interface TrustScoreRecord {
  user_id: string;
  accountability_score: number;
  reputation_level: string;
  total_contracts: number;
  completed_contracts: number;
  disputed_contracts: number;
  would_participate_again_pct: number;
  updated_at?: string;
}

export function useUserTrustScoreRealtime(userId?: string) {
  const [scoreRecord, setScoreRecord] = useState<TrustScoreRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreChanged, setScoreChanged] = useState(false);
  const [scoreDelta, setScoreDelta] = useState(0);

  const fetchScore = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('accountability_scores')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setScoreRecord(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchScore();
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`trust_score_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'accountability_scores',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as TrustScoreRecord;
          const prev = payload.old as TrustScoreRecord;
          const delta = Math.round(
            ((updated.accountability_score ?? 0) - (prev.accountability_score ?? 0)) * 10
          );
          setScoreRecord(updated);
          if (delta !== 0) {
            setScoreDelta(delta);
            setScoreChanged(true);
            setTimeout(() => setScoreChanged(false), 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchScore]);

  return { scoreRecord, loading, error, scoreChanged, scoreDelta, refetch: fetchScore };
}

export async function invokeCalculateReturn(amount: number, weight: number) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('calculate-return', {
    body: { amount, weight },
  });
  if (error) throw error;
  return data as { amount: number; weight: number; profit: number; totalReturn: number };
}

export async function invokeResolvePool(params: {
  pool_id: string;
  winning_outcome_id: string;
  resolved_by: string;
  evidence?: { text?: string; url?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('resolve-pool', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export async function invokeUpdateTrustScore(params: {
  user_id: string;
  delta: number;
  reason: string;
  pool_id?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('update-trust-score', {
    body: params,
  });
  if (error) throw error;
  return data as {
    success: boolean;
    user_id: string;
    score_before: number;
    score_after: number;
    delta: number;
    tier: string;
    reason: string;
  };
}
