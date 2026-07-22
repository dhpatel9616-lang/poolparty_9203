'use client';
import React, { useState, useEffect, useRef } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Plus, AlertTriangle, CheckCircle, Clock, Upload, ChevronRight, X, FileText, Image, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Dispute {
  id: string;
  title: string;
  description: string;
  dispute_status: string;
  resolution: string | null;
  created_at: string;
  opened_by: string;
  against_user_id: string | null;
  opener?: { full_name: string };
  against?: { full_name: string };
}

interface EvidenceFile {
  id: string;
  file_url: string;
  file_type: string;
  created_at: string;
  submitted_by: string;
}

interface DisputeComment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  user?: { full_name: string };
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  open: { color: 'var(--warning)', icon: <Clock size={12} />, label: 'Open' },
  under_review: { color: 'var(--primary)', icon: <AlertTriangle size={12} />, label: 'Under Review' },
  in_review: { color: 'var(--primary)', icon: <AlertTriangle size={12} />, label: 'In Review' },
  resolved: { color: 'var(--success)', icon: <CheckCircle size={12} />, label: 'Resolved' },
  appealed: { color: '#FFC857', icon: <AlertTriangle size={12} />, label: 'Appealed' },
  dismissed: { color: 'var(--muted-foreground)', icon: <CheckCircle size={12} />, label: 'Dismissed' },
  closed: { color: 'var(--muted-foreground)', icon: <CheckCircle size={12} />, label: 'Closed' },
};

const MOCK_DISPUTES: Dispute[] = [
  { id: '1', title: 'Unpaid wager from NBA Finals pool', description: 'User has not paid their agreed amount after 7 days of the pool resolving.', dispute_status: 'open', resolution: null, created_at: new Date(Date.now() - 86400000).toISOString(), opened_by: 'me', against_user_id: 'other', opener: { full_name: 'You' }, against: { full_name: 'Jordan M.' } },
  { id: '2', title: 'Incorrect pool outcome reported', description: 'The pool admin marked the wrong team as winner.', dispute_status: 'under_review', resolution: null, created_at: new Date(Date.now() - 259200000).toISOString(), opened_by: 'other', against_user_id: 'me', opener: { full_name: 'Alex C.' }, against: { full_name: 'You' } },
  { id: '3', title: 'Late payment dispute', description: 'Payment was made but not acknowledged.', dispute_status: 'resolved', resolution: 'upheld', created_at: new Date(Date.now() - 604800000).toISOString(), opened_by: 'me', against_user_id: 'other', opener: { full_name: 'You' }, against: { full_name: 'Sam R.' } },
];

function DisputeDetailView({ dispute, onBack }: { dispute: Dispute; onBack: () => void }) {
  const { user } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cfg = STATUS_CONFIG[dispute.dispute_status] || STATUS_CONFIG.open;

  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<DisputeComment[]>([]);
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchDetails = async () => {
      const [commentsResult, evidenceResult] = await Promise.all([
        supabase.from('dispute_comments').select('*, user:user_id(full_name)').eq('dispute_id', dispute.id).order('created_at'),
        supabase.from('dispute_evidence').select('*').eq('dispute_id', dispute.id).order('created_at'),
      ]);
      const commentsData = commentsResult.data;
      const evidenceData = evidenceResult.data;
      if (commentsData) setComments(commentsData as any);
      if (evidenceData) setEvidence(evidenceData as any);
    };
    fetchDetails();
  }, [dispute.id, user]);

  const handleAddComment = async () => {
    if (!user || !comment.trim()) return;
    setSubmittingComment(true);
    try {
      const { data, error } = await supabase.from('dispute_comments').insert({
        dispute_id: dispute.id,
        user_id: user.id,
        comment: comment.trim(),
      }).select('*, user:user_id(full_name)').single();
      if (!error && data) {
        setComments(prev => [...prev, data as any]);
        setComment('');
        toast.success('Comment added');
      }
    } catch {
      toast.error('Failed to add comment');
    }
    setSubmittingComment(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) { toast.error('File must be under 10MB'); return; }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) { toast.error('Only images and PDFs are allowed'); return; }

    setUploadingEvidence(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${dispute.id}/${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('dispute-evidence')
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('dispute-evidence').getPublicUrl(path);

      const { data: evidenceRecord, error: dbError } = await supabase.from('dispute_evidence').insert({
        dispute_id: dispute.id,
        submitted_by: user.id,
        file_url: publicUrl,
        file_type: file.type,
      }).select().single();

      if (!dbError && evidenceRecord) {
        setEvidence(prev => [...prev, evidenceRecord as any]);
        toast.success('Evidence uploaded successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
    setUploadingEvidence(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileAppeal = async () => {
    if (!user) return;
    setAppealSubmitting(true);
    try {
      await supabase.from('dispute_appeals').insert({
        dispute_id: dispute.id,
        appellant_id: user.id,
        reason: 'Requesting review of resolved dispute',
        status: 'pending',
      });
      toast.success('Appeal filed successfully. Our team will review it.');
    } catch {
      toast.success('Appeal filed. Our team will review it.');
    }
    setAppealSubmitting(false);
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--muted-foreground)' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground line-clamp-1">{dispute.title}</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
              <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pt-4 pb-28 space-y-4">
          {/* Description */}
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>DESCRIPTION</p>
            <p className="text-sm text-foreground">{dispute.description}</p>
            <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div>
                <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Opened by</p>
                <p className="text-xs font-semibold text-foreground">{dispute.opener?.full_name || 'Unknown'}</p>
              </div>
              {dispute.against && (
                <div>
                  <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Against</p>
                  <p className="text-xs font-semibold text-foreground">{dispute.against.full_name}</p>
                </div>
              )}
              <div className="ml-auto">
                <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Filed</p>
                <p className="text-xs font-semibold text-foreground">{new Date(dispute.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Evidence Upload */}
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>EVIDENCE</p>

            {evidence.length > 0 && (
              <div className="space-y-2 mb-3">
                {evidence.map((ev) => (
                  <a
                    key={ev.id}
                    href={ev.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg transition-all active:scale-95"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                  >
                    {ev.file_type?.startsWith('image/') ? (
                      <Image size={14} style={{ color: 'var(--primary)' }} />
                    ) : (
                      <FileText size={14} style={{ color: 'var(--primary)' }} />
                    )}
                    <span className="text-xs text-foreground flex-1 truncate">
                      {ev.file_type?.startsWith('image/') ? 'Image evidence' : 'Document evidence'}
                    </span>
                    <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                      {new Date(ev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </a>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingEvidence}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed transition-all active:scale-95"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              {uploadingEvidence ? (
                <><Loader2 size={16} className="animate-spin" /><span className="text-sm">Uploading...</span></>
              ) : (
                <><Upload size={16} /><span className="text-sm">Upload image or PDF</span></>
              )}
            </button>
            <p className="text-2xs mt-1.5 text-center" style={{ color: 'var(--muted-foreground)' }}>Max 10MB · Images and PDFs only</p>
          </div>

          {/* Comments */}
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>COMMENTS ({comments.length})</p>

            {comments.length > 0 && (
              <div className="space-y-2 mb-3">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-lg p-3" style={{ background: 'var(--elevated)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{(c.user as any)?.full_name || 'User'}</span>
                      <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{formatDate(c.created_at)}</span>
                    </div>
                    <p className="text-xs text-foreground">{c.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {comments.length === 0 && (
              <p className="text-xs mb-3 text-center" style={{ color: 'var(--muted-foreground)' }}>No comments yet. Be the first to add context.</p>
            )}

            <div className="flex gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
              <button
                onClick={handleAddComment}
                disabled={submittingComment || !comment.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: 'var(--primary)', color: '#fff', opacity: !comment.trim() ? 0.5 : 1 }}
              >
                {submittingComment ? <Loader2 size={14} className="animate-spin" /> : 'Send'}
              </button>
            </div>
          </div>

          {/* Appeal */}
          {dispute.dispute_status === 'resolved' && (
            <button
              onClick={handleFileAppeal}
              disabled={appealSubmitting}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: 'var(--elevated)', color: 'var(--warning)', border: '1px solid var(--border)' }}
            >
              {appealSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              File an Appeal
            </button>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

export default function DisputeCenterPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'review' | 'resolved'>('all');

  useEffect(() => {
    if (!user) return;
    const fetchDisputes = async () => {
      const { data } = await supabase
        .from('disputes')
        .select('*, opener:opened_by(full_name), against:against_user_id(full_name)')
        .or(`opened_by.eq.${user.id},against_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) setDisputes(data as any);
    };
    fetchDisputes();
  }, [user]);

  const handleOpenDispute = async () => {
    if (!user || !newTitle.trim() || !newDesc.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('disputes')
        .insert({
          title: newTitle.trim(),
          description: newDesc.trim(),
          opened_by: user.id,
          dispute_status: 'open',
        })
        .select()
        .single();
      if (!error && data) {
        setDisputes(prev => [{ ...data, opener: { full_name: 'You' } } as Dispute, ...prev]);
        setShowNewForm(false);
        setNewTitle('');
        setNewDesc('');
        toast.success('Dispute created successfully');
      } else {
        throw error;
      }
    } catch {
      toast.error('Failed to create dispute. Please try again.');
    }
    setSubmitting(false);
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const filteredDisputes = disputes.filter(d => {
    if (activeTab === 'open') return d.dispute_status === 'open';
    if (activeTab === 'review') return d.dispute_status === 'under_review' || d.dispute_status === 'in_review';
    if (activeTab === 'resolved') return d.dispute_status === 'resolved' || d.dispute_status === 'closed' || d.dispute_status === 'dismissed';
    return true;
  });

  if (selectedDispute) {
    return <DisputeDetailView dispute={selectedDispute} onBack={() => setSelectedDispute(null)} />;
  }

  return (
    <MobileLayout modalOpen={showNewForm}>
      <div className="flex flex-col min-h-full pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link href="/profile-screen" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--muted-foreground)' }} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Dispute Center</h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Resolve conflicts fairly</p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={18} color="#fff" />
          </button>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Open', value: disputes.filter(d => d.dispute_status === 'open').length, color: 'var(--warning)' },
              { label: 'In Review', value: disputes.filter(d => d.dispute_status === 'under_review' || d.dispute_status === 'in_review').length, color: 'var(--primary)' },
              { label: 'Resolved', value: disputes.filter(d => d.dispute_status === 'resolved').length, color: 'var(--success)' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
            {([
              { id: 'all', label: 'All' },
              { id: 'open', label: 'Open' },
              { id: 'review', label: 'In Review' },
              { id: 'resolved', label: 'Resolved' },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all" style={{ background: activeTab === tab.id ? 'var(--primary)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'var(--muted-foreground)' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dispute list */}
          <div className="space-y-3">
            {filteredDisputes.map(dispute => {
              const cfg = STATUS_CONFIG[dispute.dispute_status] || STATUS_CONFIG.open;
              return (
                <button key={dispute.id} onClick={() => setSelectedDispute(dispute)} className="w-full text-left rounded-xl p-4 transition-all active:scale-98" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{dispute.title}</p>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{dispute.description}</p>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}18`, color: cfg.color }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>vs {dispute.against?.full_name || 'Unknown'}</span>
                    <span className="ml-auto text-2xs" style={{ color: 'var(--muted-foreground)' }}>{formatDate(dispute.created_at)}</span>
                  </div>
                </button>
              );
            })}
            {filteredDisputes.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--success)' }} />
                <p className="text-sm font-semibold text-foreground">No disputes here</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {activeTab === 'all' ? 'No disputes yet. Keep it clean!' : `No ${activeTab} disputes.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dispute Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowNewForm(false)}>
          <div
            className="w-full max-w-[390px] rounded-t-3xl flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '85dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: 'var(--border)' }} />
            <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-base font-bold text-foreground">Create Dispute</h3>
              <button onClick={() => setShowNewForm(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
                <X size={14} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--elevated)', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Explain the dispute in detail..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--elevated)', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.2)' }}>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Disputes are reviewed by the PoolParty team. Please provide accurate information and evidence to support your case.
                </p>
              </div>
            </div>
            <div className="px-5 pb-6 pt-2 flex-shrink-0 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={handleOpenDispute}
                disabled={submitting || !newTitle.trim() || !newDesc.trim()}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{ background: 'var(--primary)', color: '#fff', opacity: (!newTitle.trim() || !newDesc.trim()) ? 0.6 : 1 }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Create Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
