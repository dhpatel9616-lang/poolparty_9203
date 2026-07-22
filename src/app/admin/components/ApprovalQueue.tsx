'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Clock, AlertTriangle, Users, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PendingGroup {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  creator?: { full_name: string; email: string };
}

interface PendingPool {
  id: string;
  title: string;
  contract_type: string;
  status: string;
  created_at: string;
  creator?: { full_name: string; email: string };
}

interface DisputeItem {
  id: string;
  title: string;
  description: string;
  dispute_status: string;
  created_at: string;
  opener?: { full_name: string };
  against?: { full_name: string };
}

const MOCK_PENDING_GROUPS: PendingGroup[] = [
  { id: 'g1', name: 'NBA Fans 2025', emoji: '🏀', description: 'Weekly NBA prediction group', category: 'Sports', status: 'pending_approval', created_at: new Date(Date.now() - 3600000).toISOString(), creator: { full_name: 'Alex Chen', email: 'alex@example.com' } },
  { id: 'g2', name: 'Crypto Traders', emoji: '₿', description: 'Crypto price prediction group', category: 'Finance', status: 'pending_approval', created_at: new Date(Date.now() - 7200000).toISOString(), creator: { full_name: 'Sam Rivera', email: 'sam@example.com' } },
];

const MOCK_PENDING_POOLS: PendingPool[] = [
  { id: 'p1', title: 'Will the Lakers win the championship?', contract_type: 'yes_no', status: 'pending_approval', created_at: new Date(Date.now() - 1800000).toISOString(), creator: { full_name: 'Jordan Smith', email: 'jordan@example.com' } },
  { id: 'p2', title: 'Bitcoin price on Dec 31?', contract_type: 'number', status: 'pending_approval', created_at: new Date(Date.now() - 5400000).toISOString(), creator: { full_name: 'Taylor Kim', email: 'taylor@example.com' } },
];

const MOCK_DISPUTES: DisputeItem[] = [
  { id: 'd1', title: 'Unpaid wager from NBA Finals pool', description: 'User has not paid their agreed amount.', dispute_status: 'open', created_at: new Date(Date.now() - 86400000).toISOString(), opener: { full_name: 'Alex Chen' }, against: { full_name: 'Jordan M.' } },
  { id: 'd2', title: 'Incorrect pool outcome reported', description: 'Pool admin marked wrong team as winner.', dispute_status: 'under_review', created_at: new Date(Date.now() - 259200000).toISOString(), opener: { full_name: 'Sam Rivera' }, against: { full_name: 'Casey Park' } },
];

type ApprovalTab = 'groups' | 'pools' | 'disputes';

export default function ApprovalQueue() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<ApprovalTab>('groups');
  const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>(MOCK_PENDING_GROUPS);
  const [pendingPools, setPendingPools] = useState<PendingPool[]>(MOCK_PENDING_POOLS);
  const [disputes, setDisputes] = useState<DisputeItem[]>(MOCK_DISPUTES);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<{ id: string; type: 'group' | 'pool' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const results = await Promise.all([
          supabase.from('groups').select('*, creator:creator_id(full_name, email)').eq('approval_status', 'pending_approval').order('created_at', { ascending: false }).limit(20),
          supabase.from('pools').select('*, creator:creator_id(full_name, email)').eq('status', 'pending_approval').order('created_at', { ascending: false }).limit(20),
          supabase.from('disputes').select('*, opener:opened_by(full_name), against:against_user_id(full_name)').in('dispute_status', ['open', 'under_review']).order('created_at', { ascending: false }).limit(20),
        ]);
        const groupsData = results[0].data;
        const poolsData = results[1].data;
        const disputesData = results[2].data;
        if (groupsData && groupsData.length > 0) setPendingGroups(groupsData as any);
        if (poolsData && poolsData.length > 0) setPendingPools(poolsData as any);
        if (disputesData && disputesData.length > 0) setDisputes(disputesData as any);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleApproveGroup = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('groups').update({ approval_status: 'approved', approved_at: new Date().toISOString() }).eq('id', id);
      if (!error) {
        setPendingGroups(prev => prev.filter(g => g.id !== id));
        toast.success('Group approved!');
      }
    } catch { toast.error('Failed to approve group'); }
    setProcessingId(null);
  };

  const handleRejectGroup = async (id: string, reason: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('groups').update({ approval_status: 'rejected', rejection_reason: reason }).eq('id', id);
      if (!error) {
        setPendingGroups(prev => prev.filter(g => g.id !== id));
        toast.success('Group rejected');
      }
    } catch { toast.error('Failed to reject group'); }
    setProcessingId(null);
    setShowRejectModal(null);
    setRejectionReason('');
  };

  const handleApprovePool = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('pools').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id);
      if (!error) {
        setPendingPools(prev => prev.filter(p => p.id !== id));
        toast.success('Pool approved!');
      }
    } catch { toast.error('Failed to approve pool'); }
    setProcessingId(null);
  };

  const handleRejectPool = async (id: string, reason: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('pools').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
      if (!error) {
        setPendingPools(prev => prev.filter(p => p.id !== id));
        toast.success('Pool rejected');
      }
    } catch { toast.error('Failed to reject pool'); }
    setProcessingId(null);
    setShowRejectModal(null);
    setRejectionReason('');
  };

  const handleUpdateDisputeStatus = async (id: string, newStatus: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('disputes').update({ dispute_status: newStatus }).eq('id', id);
      if (!error) {
        setDisputes(prev => prev.map(d => d.id === id ? { ...d, dispute_status: newStatus } : d));
        toast.success(`Dispute marked as ${newStatus}`);
      }
    } catch { toast.error('Failed to update dispute'); }
    setProcessingId(null);
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Approval Queue</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Review and approve pending groups, pools, and disputes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Groups', value: pendingGroups.length, icon: <Users size={18} />, color: 'var(--primary)', tab: 'groups' as ApprovalTab },
          { label: 'Pending Pools', value: pendingPools.length, icon: <FileText size={18} />, color: '#FFC857', tab: 'pools' as ApprovalTab },
          { label: 'Open Disputes', value: disputes.length, icon: <AlertTriangle size={18} />, color: 'var(--accent)', tab: 'disputes' as ApprovalTab },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setActiveTab(stat.tab)}
            className="rounded-2xl p-4 text-left transition-all active:scale-95"
            style={{ background: activeTab === stat.tab ? `${stat.color}15` : 'var(--surface)', border: `1px solid ${activeTab === stat.tab ? stat.color : 'var(--border)'}` }}
          >
            <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>{stat.icon}</div>
            <p className="text-2xl font-black text-foreground">{stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', width: 'fit-content' }}>
        {([
          { id: 'groups', label: 'Groups' },
          { id: 'pools', label: 'Pools' },
          { id: 'disputes', label: 'Disputes' },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-4 py-2 rounded-lg text-sm font-semibold transition-all" style={{ background: activeTab === tab.id ? 'var(--primary)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'var(--muted-foreground)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-3">
          {pendingGroups.length === 0 && (
            <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <CheckCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--success)' }} />
              <p className="text-sm font-semibold text-foreground">No pending groups</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>All groups have been reviewed</p>
            </div>
          )}
          {pendingGroups.map((group) => (
            <div key={group.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'var(--elevated)' }}>
                  {group.emoji || '🏆'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{group.name}</p>
                    <span className="text-2xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,200,87,0.15)', color: '#FFC857' }}>
                      <Clock size={9} className="inline mr-0.5" /> Pending
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{group.description || 'No description'}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    By {group.creator?.full_name || 'Unknown'} · {formatDate(group.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveGroup(group.id)}
                  disabled={processingId === group.id}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  style={{ background: 'rgba(0,230,118,0.12)', color: 'var(--success)', border: '1px solid rgba(0,230,118,0.3)' }}
                >
                  {processingId === group.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal({ id: group.id, type: 'group' })}
                  disabled={processingId === group.id}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  style={{ background: 'rgba(255,77,141,0.1)', color: 'var(--accent)', border: '1px solid rgba(255,77,141,0.3)' }}
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pools Tab */}
      {activeTab === 'pools' && (
        <div className="space-y-3">
          {pendingPools.length === 0 && (
            <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <CheckCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--success)' }} />
              <p className="text-sm font-semibold text-foreground">No pending pools</p>
            </div>
          )}
          {pendingPools.map((pool) => (
            <div key={pool.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground line-clamp-2">{pool.title}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}>
                      {pool.contract_type?.replace('_', ' ') || 'yes/no'}
                    </span>
                    <span className="text-2xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,200,87,0.15)', color: '#FFC857' }}>
                      <Clock size={9} className="inline mr-0.5" /> Pending
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    By {pool.creator?.full_name || 'Unknown'} · {formatDate(pool.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprovePool(pool.id)}
                  disabled={processingId === pool.id}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  style={{ background: 'rgba(0,230,118,0.12)', color: 'var(--success)', border: '1px solid rgba(0,230,118,0.3)' }}
                >
                  {processingId === pool.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal({ id: pool.id, type: 'pool' })}
                  disabled={processingId === pool.id}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  style={{ background: 'rgba(255,77,141,0.1)', color: 'var(--accent)', border: '1px solid rgba(255,77,141,0.3)' }}
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <div className="space-y-3">
          {disputes.length === 0 && (
            <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <CheckCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--success)' }} />
              <p className="text-sm font-semibold text-foreground">No open disputes</p>
            </div>
          )}
          {disputes.map((dispute) => (
            <div key={dispute.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="mb-3">
                <p className="text-sm font-bold text-foreground">{dispute.title}</p>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{dispute.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                    {dispute.opener?.full_name || 'Unknown'} vs {dispute.against?.full_name || 'Unknown'}
                  </span>
                  <span className="ml-auto text-2xs" style={{ color: 'var(--muted-foreground)' }}>{formatDate(dispute.created_at)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateDisputeStatus(dispute.id, 'under_review')}
                  disabled={processingId === dispute.id || dispute.dispute_status === 'under_review'}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{ background: 'rgba(124,92,255,0.1)', color: 'var(--primary)', border: '1px solid rgba(124,92,255,0.3)', opacity: dispute.dispute_status === 'under_review' ? 0.5 : 1 }}
                >
                  Mark In Review
                </button>
                <button
                  onClick={() => handleUpdateDisputeStatus(dispute.id, 'resolved')}
                  disabled={processingId === dispute.id}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{ background: 'rgba(0,230,118,0.12)', color: 'var(--success)', border: '1px solid rgba(0,230,118,0.3)' }}
                >
                  Resolve
                </button>
                <button
                  onClick={() => handleUpdateDisputeStatus(dispute.id, 'dismissed')}
                  disabled={processingId === dispute.id}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{ background: 'rgba(255,77,141,0.1)', color: 'var(--accent)', border: '1px solid rgba(255,77,141,0.3)' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowRejectModal(null)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-foreground mb-3">Rejection Reason</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this is being rejected..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--elevated)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showRejectModal.type === 'group') handleRejectGroup(showRejectModal.id, rejectionReason);
                  else handleRejectPool(showRejectModal.id, rejectionReason);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,77,141,0.15)', color: 'var(--accent)', border: '1px solid rgba(255,77,141,0.3)' }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}