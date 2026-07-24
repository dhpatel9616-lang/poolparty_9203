'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, ChevronRight, CheckCircle, UserPlus } from 'lucide-react';
import GroupDashboard from './GroupDashboard';
import GroupCreationFlow from './GroupCreationFlow';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface GroupMember {
  userId: string;
  name: string;
  avatar: string;
  trustScore: number;
  wins: number;
  rank: number;
}

interface Group {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  activeContracts: number;
  totalContracts: number;
  members: GroupMember[];
  createdAt: string;
  status?: string;
}

function mapDbGroupToGroup(g: any): Group {
  return {
    id: g.id,
    name: g.name || g.group_name || 'Unnamed Group',
    emoji: g.emoji || g.icon || '🏆',
    memberCount: g.member_count ?? 1,
    activeContracts: g.active_pool_count ?? 0,
    totalContracts: g.total_pool_count ?? 0,
    status: g.approval_status || 'approved',
    members: (g.members ?? []).slice(0, 3).map((m: any, i: number) => ({
      userId: m.user_id || m.id,
      name: m.user?.full_name || m.full_name || 'Member',
      avatar: (m.user?.full_name || m.full_name || 'M').charAt(0).toUpperCase(),
      trustScore: m.trust_score ?? 50,
      wins: m.wins ?? 0,
      rank: i + 1,
    })),
    createdAt: g.created_at,
  };
}

export default function GroupsList() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);

  const fetchGroups = async () => {
    if (!user) { setLoading(false); return; }
    const supabase = createClient();

    // Scope to groups this user is actually a member of — the previous
    // version queried `groups` with no filter at all, meaning every user
    // saw the 20 most recently created groups platform-wide, regardless
    // of membership.
    const { data: myMemberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (membershipError) {
      console.error('Failed to load group memberships', membershipError);
      setLoading(false);
      return;
    }

    const myGroupIds = (myMemberships ?? []).map((m: any) => m.group_id);

    if (myGroupIds.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('groups')
      .select('*, members:group_members(user_id, wins, user:user_id(full_name))')
      .in('id', myGroupIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGroups(data.map(mapDbGroupToGroup));
    } else {
      console.error('Failed to load groups', error);
      setGroups([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, [user]);

  const handleGroupCreated = async (data: any) => {
    if (!user) return;
    const supabase = createClient();
    try {
      const { data: newGroup, error } = await supabase
        .from('groups')
        .insert({
          name: data.name,
          description: data.description,
          emoji: data.emoji,
          category: data.category,
          max_members: data.maxMembers === 'Unlimited' ? null : parseInt(data.maxMembers),
          require_approval: data.requireApproval,
          who_creates_contracts: data.whoCreatesContracts,
          who_resolves_contracts: data.whoResolvesContracts,
          who_invites: data.whoInvites,
          creator_id: user.id,
          approval_status: 'approved',
          member_count: 1,
        })
        .select()
        .single();

      if (!error && newGroup) {
        // Add creator as first member
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({ group_id: newGroup.id, user_id: user.id, role: 'admin' });
        if (memberError) {
          console.error('Failed to add creator as group member:', memberError);
          toast.error('Group created, but you were not added as a member. Contact support.');
        }

        const mapped = mapDbGroupToGroup(newGroup);
        setGroups((prev) => [mapped, ...prev]);
        setCreatedGroup(mapped);
        setSelectedGroup(mapped);
        toast.success(`"${data.name}" created! 🎉`);
      } else {
        toast.error(error?.message || 'Failed to create group. Please try again.');
      }
    } catch {
      toast.error('Failed to create group. Please try again.');
    }
    setShowCreate(false);
  };

  if (selectedGroup) {
    return <GroupDashboard group={selectedGroup} onBack={() => setSelectedGroup(null)} />;
  }

  if (showCreate) {
    return (
      <GroupCreationFlow
        onComplete={handleGroupCreated}
        onCancel={() => setShowCreate(false)}
      />
    );
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Groups</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {loading ? '...' : `${groups.length} group${groups.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/friends-screen"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-90"
            style={{ background: 'rgba(124,92,255,0.1)', color: 'var(--primary)' }}
          >
            <UserPlus size={14} />
            Friends
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-90"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            <Plus size={14} />
            Create
          </button>
        </div>
      </div>

      {/* Success banner for newly created group */}
      {createdGroup && (
        <div
          className="rounded-2xl p-4 mb-4 flex items-start gap-3"
          style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}
        >
          <CheckCircle size={18} style={{ color: 'var(--success)' }} />
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">"{createdGroup.name}" created!</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Invite friends to get started.
            </p>
          </div>
          <button onClick={() => setCreatedGroup(null)} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'var(--card)', height: 80 }} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: 'var(--card)' }}>🏆</div>
          <p className="text-sm font-semibold text-foreground">No groups yet</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--muted-foreground)' }}>Create your first group to get started!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            Create Group
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className="w-full text-left rounded-2xl p-4 card-interactive transition-all"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'rgba(124,92,255,0.1)' }}>
                    {group.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{group.name}</h2>
                      {group.status === 'pending_approval' && (
                        <span className="text-2xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,171,0,0.15)', color: 'var(--warning)' }}>
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1">
                        <Users size={12} style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{group.memberCount} members</span>
                      </div>
                      <span
                        className="pill-badge text-2xs"
                        style={{
                          background: group.activeContracts > 0 ? 'rgba(0,230,118,0.12)' : 'rgba(184,180,200,0.1)',
                          color: group.activeContracts > 0 ? 'var(--success)' : 'var(--muted-foreground)',
                        }}
                      >
                        {group.activeContracts} active
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--muted-foreground)' }} />
              </div>
              {group.members.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {group.members.slice(0, 3).map((m) => (
                    <div key={m.userId} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(124,92,255,0.15)', color: 'var(--primary)' }}>
                      {m.avatar}
                    </div>
                  ))}
                  {group.memberCount > 3 && (
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>+{group.memberCount - 3} more</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}