'use client';
import React, { useState, useEffect } from 'react';
import type { Group } from '@/lib/mockData';
import { MOCK_CONTRACTS } from '@/lib/mockData';
import { ArrowLeft, FileText, CreditCard, AlertTriangle, Users, Trophy, ShieldOff, UserPlus, Crown, Shield, User, X, Settings, CheckCircle, XCircle, Snowflake, Link as LinkIcon, MessageCircle } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import TrustBadge from '@/components/ui/TrustBadge';
import { toast } from 'sonner';
import { useGroupMembersRealtime } from '@/lib/supabase/realtime';
import ChatPanel from '@/components/chat/ChatPanel';



type GroupTab = 'contracts' | 'chat' | 'payments' | 'disputes' | 'members' | 'leaderboard' | 'blacklist';

const GROUP_TABS: { id: GroupTab; label: string; icon: React.ReactNode }[] = [
  { id: 'contracts', label: 'Contracts', icon: <FileText size={14} /> },
  { id: 'chat', label: 'Chat', icon: <MessageCircle size={14} /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard size={14} /> },
  { id: 'disputes', label: 'Disputes', icon: <AlertTriangle size={14} /> },
  { id: 'members', label: 'Members', icon: <Users size={14} /> },
  { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={14} /> },
  { id: 'blacklist', label: 'Blacklist', icon: <ShieldOff size={14} /> },
];

interface GroupDashboardProps {
  group: Group;
  onBack: () => void;
}

const CURRENT_USER_ID = 'user-001';

// Admin approval panel
function AdminApprovalPanel({ group, onClose }: { group: Group; onClose: () => void }) {
  const [visibility, setVisibility] = useState<'public' | 'private' | 'invite_only' | 'approval_required'>('invite_only');
  const [requireApproval, setRequireApproval] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [pendingApprovals] = useState([
    { id: 'req-1', name: 'Alex Kim', handle: '@alexk', avatar: 'AK', trustScore: 720 },
    { id: 'req-2', name: 'Sam Torres', handle: '@samtor', avatar: 'ST', trustScore: 580 },
  ]);

  const handleApprove = (id: string, name: string) => {
    toast.success(`${name} approved!`);
  };

  const handleReject = (id: string, name: string) => {
    toast.success(`${name} rejected`);
  };

  const handleFreeze = () => {
    setFrozen(!frozen);
    toast.success(frozen ? 'Pool unfrozen' : 'Pool frozen — no new activity allowed');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '88dvh', animation: 'fadeInUp 250ms ease forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Settings size={16} style={{ color: 'var(--primary)' }} />
            Group Admin
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
            <X size={14} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5 pb-8">
          {/* Visibility */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>Group Visibility</p>
            <div className="grid grid-cols-2 gap-2">
              {(['public', 'private', 'invite_only', 'approval_required'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: visibility === v ? 'rgba(124,92,255,0.15)' : 'var(--elevated)',
                    color: visibility === v ? 'var(--primary)' : 'var(--muted-foreground)',
                    border: visibility === v ? '1px solid rgba(124,92,255,0.4)' : '1px solid var(--border)',
                  }}
                >
                  {v === 'invite_only' ? 'Invite Only' : v === 'approval_required' ? 'Approval Required' : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Controls */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>Admin Controls</p>
            <div className="space-y-2">
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">Require Approval to Join</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Admins must approve new members</p>
                </div>
                <button
                  onClick={() => setRequireApproval(!requireApproval)}
                  className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                  style={{ background: requireApproval ? 'var(--primary)' : 'var(--elevated)', border: '1px solid var(--border)' }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
                    style={{ background: '#fff', transform: requireApproval ? 'translateX(22px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>

              <button
                onClick={handleFreeze}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{
                  background: frozen ? 'rgba(0,82,255,0.1)' : 'rgba(255,200,87,0.1)',
                  color: frozen ? '#0052FF' : 'var(--warning)',
                  border: `1px solid ${frozen ? 'rgba(0,82,255,0.3)' : 'rgba(255,200,87,0.3)'}`,
                }}
              >
                <Snowflake size={14} />
                {frozen ? 'Unfreeze Group' : 'Freeze Group'}
              </button>
            </div>
          </div>

          {/* Pending Approvals */}
          {pendingApprovals.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>
                Pending Approvals ({pendingApprovals.length})
              </p>
              <div className="space-y-2">
                {pendingApprovals.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: 'rgba(124,92,255,0.15)', color: 'var(--primary)' }}
                    >
                      {req.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{req.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Trust: {req.trustScore}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(req.id, req.name)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(0,230,118,0.15)' }}
                      >
                        <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                      </button>
                      <button
                        onClick={() => handleReject(req.id, req.name)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(255,77,141,0.15)' }}
                      >
                        <XCircle size={16} style={{ color: 'var(--social)' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Invite modal
function InviteModal({ group, onClose }: { group: Group; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inviteLink = `https://poolparty3501.builtwithrocket.new/invite/grp-${group.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Invite link copied!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join ${group.name} on PoolParty`,
        text: `You're invited to join ${group.name} on PoolParty!`,
        url: inviteLink,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '80dvh', animation: 'fadeInUp 250ms ease forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-bold text-foreground">Invite to {group.name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
            <X size={14} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4 pb-8">
          {/* Username search */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>Search by username</p>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="@username"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
            {searchQuery && (
              <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-4 py-3 text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
                  No users found for "{searchQuery}"
                </div>
              </div>
            )}
          </div>

          {/* Copy link */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>Invite link</p>
            <div
              className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
            >
              <LinkIcon size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <p className="text-xs flex-1 truncate" style={{ color: 'var(--muted-foreground)' }}>{inviteLink}</p>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all active:scale-90"
                style={{ background: copied ? 'rgba(0,230,118,0.15)' : 'rgba(124,92,255,0.15)', color: copied ? 'var(--success)' : 'var(--primary)' }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            Share Invite Link
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupDashboard({ group, onBack }: GroupDashboardProps) {
  const [activeTab, setActiveTab] = useState<GroupTab>('contracts');
  const [showInvite, setShowInvite] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blacklistedIds, setBlacklistedIds] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const groupContracts = MOCK_CONTRACTS.filter((c) => c.groupId === group.id);
  const isOwner = group.members[0]?.userId === CURRENT_USER_ID;

  // Real-time group members subscription
  const { newMemberAlert, members: liveMembers } = useGroupMembersRealtime(group.id);

  // Live member count: prefer live data, fall back to group prop
  const liveMemberCount = liveMembers.length > 0 ? liveMembers.length : group.memberCount;

  // Show toast when a new member joins
  useEffect(() => {
    if (newMemberAlert) {
      const name =
        newMemberAlert.profile?.full_name ??
        newMemberAlert.profile?.username ??
        'Someone';
      toast(`👋 ${name} just joined the group!`, { duration: 3500 });
    }
  }, [newMemberAlert]);

  const getRoleIcon = (index: number) => {
    if (index === 0) return <Crown size={12} style={{ color: '#FFC857' }} />;
    if (index === 1) return <Shield size={12} style={{ color: 'var(--primary)' }} />;
    return <User size={12} style={{ color: 'var(--muted-foreground)' }} />;
  };

  const getRoleLabel = (index: number) => {
    if (index === 0) return 'Owner';
    if (index === 1) return 'Admin';
    return 'Member';
  };

  const handleRemoveMember = (userId: string, name: string) => {
    setRemovedIds((prev) => new Set([...prev, userId]));
    toast.success(`${name} removed from group`);
  };

  const handleBlacklist = (userId: string, name: string) => {
    setBlacklistedIds((prev) => new Set([...prev, userId]));
    setRemovedIds((prev) => new Set([...prev, userId]));
    toast.success(`${name} blacklisted`);
  };

  return (
    <>
      <div className="px-4 pt-4 pb-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">{group.emoji}</span>
            <h1 className="text-lg font-bold text-foreground">{group.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => setShowAdmin(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)' }}
              >
                <Settings size={16} style={{ color: 'var(--primary)' }} />
              </button>
            )}
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(124,92,255,0.15)', color: 'var(--primary)' }}
            >
              <UserPlus size={13} />
              Invite
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: 'gs-members', label: 'Members', value: liveMemberCount, color: 'var(--primary)' },
            { id: 'gs-active', label: 'Active', value: group.activeContracts, color: 'var(--success)' },
            { id: 'gs-total', label: 'Total', value: group.totalContracts, color: 'var(--muted-foreground)' },
          ].map((s) => (
            <div
              key={s.id}
              className="rounded-xl p-3 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-lg font-bold" style={{ color: s.color, fontVariantNumeric: 'tabular-nums' }}>
                {s.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
          {GROUP_TABS.map((tab) => (
            <button
              key={`gtab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--primary)' : 'var(--surface)',
                color: activeTab === tab.id ? '#fff' : 'var(--muted-foreground)',
                border: activeTab === tab.id ? 'none' : '1px solid var(--border)',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'contracts' && (
          <div className="space-y-3">
            {groupContracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
                <p className="text-sm font-semibold text-foreground">No contracts yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Create the first prediction contract for this group
                </p>
              </div>
            ) : (
              groupContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="rounded-xl p-4 transition-all active:scale-98"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground flex-1 pr-2 leading-snug">
                      {contract.title}
                    </p>
                    <StatusBadge status={contract.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {contract.participantCount} entries
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {contract.stakeNote}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold mb-3 px-1" style={{ color: 'var(--muted-foreground)' }}>
              Manage Members
            </p>
            {group.members.map((member, index) => {
              if (removedIds.has(member.userId)) return null;
              return (
                <div
                  key={`member-${member.userId}`}
                  className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'rgba(124,92,255,0.15)', color: 'var(--primary)' }}
                  >
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground">{member.name}</p>
                      <div className="flex items-center gap-0.5">
                        {getRoleIcon(index)}
                        <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                          {getRoleLabel(index)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {member.wins} wins · Score: {member.trustScore}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrustBadge
                      tier={member.trustScore >= 800 ? 'Excellent' : member.trustScore >= 600 ? 'Good' : member.trustScore >= 400 ? 'Risky' : 'Unreliable'}
                      size="sm"
                    />
                    {isOwner && member.userId !== CURRENT_USER_ID && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleRemoveMember(member.userId, member.name)}
                          className="px-2 py-1 rounded-lg text-xs font-medium"
                          style={{ background: 'rgba(255,200,87,0.1)', color: 'var(--warning)' }}
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => handleBlacklist(member.userId, member.name)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(255,77,141,0.1)' }}
                          title="Blacklist member"
                        >
                          <X size={12} style={{ color: 'var(--social)' }} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Leave / Delete group */}
            <div className="mt-4 space-y-2">
              {!isOwner && (
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="w-full py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,77,141,0.1)', color: 'var(--social)', border: '1px solid rgba(255,77,141,0.2)' }}
                >
                  Leave Group
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,77,141,0.1)', color: 'var(--social)', border: '1px solid rgba(255,77,141,0.2)' }}
                >
                  Delete Group
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div>
            <div className="flex items-end justify-center gap-3 mb-6 pt-2">
              {group.members.slice(0, 3).map((member, i) => {
                const order = [1, 0, 2][i];
                const heights = ['h-16', 'h-24', 'h-12'];
                const medals = ['🥈', '🥇', '🥉'];
                return (
                  <div key={`podium-${member.userId}`} className="flex flex-col items-center gap-1" style={{ order }}>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: 'rgba(124,92,255,0.15)', color: 'var(--primary)' }}
                    >
                      {member.avatar}
                    </div>
                    <span className="text-base">{medals[i]}</span>
                    <p className="text-xs font-semibold text-foreground text-center">{member.name.split(' ')[0]}</p>
                    <div className={`w-16 ${heights[i]} rounded-t-xl flex items-end justify-center pb-2`}
                      style={{ background: i === 1 ? 'rgba(124,92,255,0.2)' : 'var(--elevated)', border: '1px solid var(--border)' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{member.wins}W</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              {group.members.map((member, i) => (
                <div key={`lb-${member.userId}`} className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span className="text-sm font-bold w-5 text-center" style={{ color: 'var(--muted-foreground)' }}>#{i + 1}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{ background: 'rgba(124,92,255,0.15)', color: 'var(--primary)' }}>
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{member.wins} wins</p>
                  </div>
                  <TrustBadge
                    tier={member.trustScore >= 800 ? 'Excellent' : member.trustScore >= 600 ? 'Good' : member.trustScore >= 400 ? 'Risky' : 'Unreliable'}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <ChatPanel groupId={group.id} />
        )}

        {(activeTab === 'payments' || activeTab === 'disputes' || activeTab === 'blacklist') && (
          <div className="text-center py-12">
            <p className="text-sm font-semibold text-foreground">No {activeTab} yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {activeTab === 'payments' ? 'Settlements will appear here after pools resolve' :
               activeTab === 'disputes' ? 'Disputes will appear here if members contest outcomes' :
               'Blacklisted members will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showInvite && <InviteModal group={group} onClose={() => setShowInvite(false)} />}
      {showAdmin && <AdminApprovalPanel group={group} onClose={() => setShowAdmin(false)} />}

      {/* Leave modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-[320px] rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-bold text-foreground mb-2">Leave group?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>You'll need a new invite to rejoin.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLeaveModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--elevated)', color: 'var(--foreground)' }}>Cancel</button>
              <button onClick={() => { setShowLeaveModal(false); onBack(); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--social)', color: '#fff' }}>Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-[320px] rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-bold text-foreground mb-2">Delete group?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>This action cannot be undone. All members will be removed.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--elevated)', color: 'var(--foreground)' }}>Cancel</button>
              <button onClick={() => { setShowDeleteModal(false); onBack(); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--social)', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}