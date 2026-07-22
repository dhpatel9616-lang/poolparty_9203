'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MOCK_CONTRACTS, MOCK_USERS } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import ReturnBadge from '@/components/ui/ReturnBadge';
import AvatarStack from '@/components/ui/AvatarStack';
import EntryModal from './EntryModal';
import { ArrowLeft, Lock, CheckCircle, Users, Calendar, Info, ExternalLink, Settings, X, Trash2, Trophy, Share2, Star } from 'lucide-react';
import { resolveContractWithPaymentNotifications } from '@/lib/supabase/services';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useContractRealtime } from '@/lib/supabase/realtime';
import { createClient } from '@/lib/supabase/client';
import ChatPanel from '@/components/chat/ChatPanel';

// Fireworks canvas animation
function FireworksCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      alpha: number; color: string;
      radius: number; gravity: number;
    }

    const COLORS = ['#7C5CFF', '#FF4D8D', '#FFD700', '#00E676', '#00C9FF', '#FF6B35', '#A855F7'];
    const particles: Particle[] = [];

    function burst(cx: number, cy: number) {
      const count = 40 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const speed = 2 + Math.random() * 5;
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          radius: 2 + Math.random() * 3,
          gravity: 0.08 + Math.random() * 0.05,
        });
      }
    }

    // Launch 4 bursts at staggered times
    const positions = [
      [0.25, 0.3], [0.75, 0.25], [0.5, 0.15], [0.15, 0.45],
    ];
    positions.forEach(([rx, ry], idx) => {
      setTimeout(() => {
        if (canvas) burst(canvas.width * rx, canvas.height * ry);
      }, idx * 350);
    });

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= 0.018;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (particles.length > 0) {
        animFrameRef.current = requestAnimationFrame(draw);
      }
    }
    animFrameRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}

// Win Celebration Banner
function WinCelebrationBanner({
  contractTitle,
  winningOutcome,
  trustScoreGain,
  onShare,
  onDismiss,
}: {
  contractTitle: string;
  winningOutcome: string;
  trustScoreGain: number;
  onShare: () => void;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onDismiss}
    >
      {/* Fireworks layer behind modal */}
      <div className="absolute inset-0 overflow-hidden">
        <FireworksCanvas active={true} />
      </div>

      <div
        className="relative w-full max-w-[360px] rounded-3xl overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1.5px solid rgba(124,92,255,0.4)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(30px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 400ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease',
          zIndex: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div
          className="px-6 pt-8 pb-6 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(124,92,255,0.12) 0%, rgba(255,77,141,0.08) 100%)' }}
        >
          {/* Trophy icon */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, #7C5CFF 0%, #FF4D8D 100%)',
              boxShadow: '0 0 32px rgba(124,92,255,0.5)',
            }}
          >
            <Trophy size={36} color="#fff" />
          </div>

          <h2 className="text-2xl font-extrabold text-foreground mb-1">You Won! 🎉</h2>
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Your pick was correct
          </p>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-4">
          {/* Contract title */}
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>Contract</p>
            <p className="text-sm font-semibold text-foreground leading-snug">{contractTitle}</p>
          </div>

          {/* Winning pick */}
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)' }}
          >
            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Winning Pick</p>
              <p className="text-sm font-semibold text-foreground">{winningOutcome}</p>
            </div>
          </div>

          {/* Trust score gain */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <Star size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Trust Score</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Updated after resolution</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold" style={{ color: 'var(--primary)' }}>
                +{trustScoreGain}
              </p>
              <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>pts earned</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onShare}
              className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              <Share2 size={15} />
              Share Win
            </button>
            <button
              onClick={onDismiss}
              className="flex-1 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: 'var(--elevated)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// URL auto-linker
function RulesText({ text }: { text: string }) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(urlRegex.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
        style={{ color: 'var(--primary)' }}
      >
        {match[0]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  text: string;
  createdAt: string;
  isSystem?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'sys-1', userId: 'system', userName: '', avatar: '', text: 'Pool created by Jordan Reyes', createdAt: '2026-04-20T10:00:00Z', isSystem: true },
  { id: 'sys-2', userId: 'system', userName: '', avatar: '', text: 'Maya Chen joined the pool', createdAt: '2026-04-21T09:00:00Z', isSystem: true },
  { id: 'msg-1', userId: 'user-002', userName: 'Maya Chen', avatar: 'MC', text: 'Who else is going Yes on this one?', createdAt: '2026-04-21T10:00:00Z' },
  { id: 'msg-2', userId: 'user-001', userName: 'Jordan Reyes', avatar: 'JR', text: 'I locked in Yes. Lakers have been on a roll lately 🏀', createdAt: '2026-04-21T10:05:00Z' },
  { id: 'sys-3', userId: 'system', userName: '', avatar: '', text: 'Dante Williams placed an entry', createdAt: '2026-04-22T14:00:00Z', isSystem: true },
];

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Admin bottom sheet
function AdminSheet({ contract, onClose, onResolved }: { contract: Contract; onClose: () => void; onResolved?: (outcomeId: string) => void }) {
  const { user } = useAuth();
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showResolveSheet, setShowResolveSheet] = useState(false);
  const [stakeNote, setStakeNote] = useState('$25 entry per person via Venmo');
  const [editingStake, setEditingStake] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [selectedWinnerOutcome, setSelectedWinnerOutcome] = useState<string | null>(null);

  const handleResolve = async () => {
    if (!selectedWinnerOutcome || !user?.id) return;
    setResolving(true);
    try {
      // Determine losers from participants (mock: all non-winner participants)
      const loserIds = MOCK_USERS.slice(1, 3).map((u) => u.id);
      const loserNames: Record<string, string> = {};
      MOCK_USERS.slice(1, 3).forEach((u) => { loserNames[u.id] = u.name; });

      await resolveContractWithPaymentNotifications({
        poolId: contract.id,
        poolTitle: contract.title,
        winnerId: user.id,
        winnerName: MOCK_USERS[0].name,
        loserIds,
        loserNames,
        amountNote: contract.stakeNote || 'Contract settlement',
        returnAmount: 25,
      });
      onResolved?.(selectedWinnerOutcome);
      onClose();
    } catch {
      toast.error('Failed to resolve. Please try again.');
    }
    setResolving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl"
        style={{ background: 'var(--surface)', maxHeight: '85dvh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-bold text-foreground">Pool Settings</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
            <X size={14} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4 pb-8">
          {/* Members */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>Members</p>
            {MOCK_USERS.slice(0, 3).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--elevated)', color: 'var(--foreground)' }}>
                    {u.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Picked outcome 1</p>
                  </div>
                </div>
                {u.id !== 'user-001' && (
                  <button className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(255,77,141,0.1)', color: 'var(--social)' }}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pool Controls */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>Pool Controls</p>
            <div className="space-y-2">
              {!showLockConfirm ? (
                <button
                  onClick={() => setShowLockConfirm(true)}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-left px-4"
                  style={{ background: 'var(--elevated)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                >
                  🔒 Lock Pool Early
                </button>
              ) : (
                <div className="rounded-xl p-3" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-semibold text-foreground mb-2">Lock now? No new entries after this point.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowLockConfirm(false)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>Cancel</button>
                    <button onClick={onClose} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>Confirm Lock</button>
                  </div>
                </div>
              )}

              <div className="rounded-xl p-3" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Stake Note</p>
                <input
                  type="text"
                  value={stakeNote}
                  onChange={(e) => setStakeNote(e.target.value)}
                  onFocus={() => setEditingStake(true)}
                  onBlur={() => setEditingStake(false)}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </div>

              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-left px-4 flex items-center gap-2"
                  style={{ background: 'rgba(255,77,141,0.08)', color: 'var(--social)', border: '1px solid rgba(255,77,141,0.2)' }}
                >
                  <Trash2 size={14} />
                  Cancel Pool
                </button>
              ) : (
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,77,141,0.08)', border: '1px solid rgba(255,77,141,0.2)' }}>
                  <p className="text-sm font-semibold text-foreground mb-2">Cancel this pool? All participants will be notified.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--elevated)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>Keep Pool</button>
                    <button onClick={onClose} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--social)', color: '#fff' }}>Cancel Pool</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>Resolution</p>
            {!showResolveSheet ? (
              <button
                onClick={() => setShowResolveSheet(true)}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                <Trophy size={15} />
                Resolve Now →
              </button>
            ) : (
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-semibold text-foreground">Select winning outcome</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Losers will be instantly notified with your payment methods so they know how to pay you.
                </p>
                <div className="space-y-2">
                  {contract.outcomes.map((outcome) => (
                    <button
                      key={outcome.id}
                      onClick={() => setSelectedWinnerOutcome(outcome.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: selectedWinnerOutcome === outcome.id ? 'rgba(124,92,255,0.15)' : 'var(--elevated)',
                        border: `1px solid ${selectedWinnerOutcome === outcome.id ? 'var(--primary)' : 'var(--border)'}`,
                        color: selectedWinnerOutcome === outcome.id ? 'var(--primary)' : 'var(--foreground)',
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                        style={{
                          borderColor: selectedWinnerOutcome === outcome.id ? 'var(--primary)' : 'var(--border)',
                          background: selectedWinnerOutcome === outcome.id ? 'var(--primary)' : 'transparent',
                        }}
                      >
                        {selectedWinnerOutcome === outcome.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      {outcome.label}
                      <span className="ml-auto text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {outcome.entryCount} entries
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setShowResolveSheet(false); setSelectedWinnerOutcome(null); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolve}
                    disabled={!selectedWinnerOutcome || resolving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    style={{
                      background: selectedWinnerOutcome ? 'var(--primary)' : 'var(--elevated)',
                      color: selectedWinnerOutcome ? '#fff' : 'var(--muted-foreground)',
                      opacity: resolving ? 0.7 : 1,
                    }}
                  >
                    {resolving ? 'Resolving…' : '🏆 Confirm & Notify'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Participants bottom sheet
function ParticipantsSheet({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const participants = MOCK_USERS.slice(0, contract.participantCount || 5);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl flex flex-col"
        style={{ background: 'var(--surface)', maxHeight: '75dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-bold text-foreground">Participants ({contract.participantCount})</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
            <X size={14} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 pb-8">
          {participants.map((u, i) => (
            <div key={u.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: 'var(--surface)', color: 'var(--foreground)' }}>
                {u.avatar}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{u.name}</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{u.handle}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                  Trust: {u.trustScore}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  ${(i + 1) * 25} staked
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Contract type (inferred from mock data shape)
type Contract = (typeof MOCK_CONTRACTS)[0];

const EMPTY_CONTRACT: Contract = {
  id: '',
  title: '',
  groupId: '',
  groupName: '',
  groupEmoji: '🏆',
  status: 'open',
  type: 'yes_no',
  creatorId: '',
  creatorName: '',
  outcomes: [],
  participantCount: 0,
  stakeNote: '',
  entryDeadline: '',
  resolutionDeadline: '',
  winningOutcomeId: undefined,
  rules: undefined,
  source: undefined,
  createdAt: new Date().toISOString(),
};

export default function ContractDetailView() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const poolId = searchParams.get('id');

  const [contract, setContract] = useState<Contract>(EMPTY_CONTRACT);
  const [contractLoading, setContractLoading] = useState(true);
  const [contractNotFound, setContractNotFound] = useState(false);

  useEffect(() => {
    if (!poolId) {
      setContractNotFound(true);
      setContractLoading(false);
      return;
    }
    const loadContract = async () => {
      const supabase = createClient();
      const { data: pool, error } = await supabase
        .from('pools')
        .select('*, creator:creator_id(full_name)')
        .eq('id', poolId)
        .maybeSingle();

      if (error || !pool) {
        setContractNotFound(true);
        setContractLoading(false);
        return;
      }

      const { data: outcomesData } = await supabase
        .from('pool_outcomes')
        .select('*')
        .eq('pool_id', poolId)
        .order('created_at', { ascending: true });

      let groupName = '';
      let groupEmoji = '🏆';
      if (pool.group_ids?.length) {
        const { data: groupData } = await supabase
          .from('groups')
          .select('name, emoji')
          .eq('id', pool.group_ids[0])
          .maybeSingle();
        if (groupData) {
          groupName = groupData.name;
          groupEmoji = groupData.emoji || '🏆';
        }
      }

      const creator = Array.isArray(pool.creator) ? pool.creator[0] : pool.creator;

      setContract({
        id: pool.id,
        title: pool.title,
        groupId: pool.group_ids?.[0] || '',
        groupName,
        groupEmoji,
        status: pool.status,
        type: pool.contract_type || 'yes_no',
        creatorId: pool.creator_id,
        creatorName: creator?.full_name || 'Unknown',
        outcomes: (outcomesData || []).map((o: any) => ({
          id: o.id,
          label: o.label,
          weight: o.weight,
          entryCount: o.entry_count,
          totalStake: o.total_stake,
          percent: o.percent,
        })),
        participantCount: pool.participant_count ?? 0,
        stakeNote: pool.stake_note || '',
        entryDeadline: pool.entry_deadline || '',
        resolutionDeadline: pool.resolution_deadline || '',
        winningOutcomeId: pool.winning_outcome_id || undefined,
        rules: pool.rules || undefined,
        source: pool.source || undefined,
        createdAt: pool.created_at,
      });
      setContractLoading(false);
    };
    loadContract();
  }, [poolId]);

  const [showEntry, setShowEntry] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [animatedBars, setAnimatedBars] = React.useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isCreator = !!user?.id && contract.creatorId === user.id;

  // Real-time contract subscription
  const { contract: liveContract } = useContractRealtime(contract.id);

  // Merge live data into display contract — live status/resolution takes precedence
  const liveStatus = (liveContract?.status as typeof contract.status) ?? contract.status;
  const liveWinningOutcomeId = liveContract?.winning_outcome_id ?? null;
  const liveParticipantCount = liveContract?.participant_count ?? contract.participantCount;

  // Win celebration state
  // For demo: user's pick is outcome index 0 (isMyPick = i === 0)
  const userPickOutcomeId = contract.outcomes[0]?.id ?? null;
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [resolvedWinnerOutcomeId, setResolvedWinnerOutcomeId] = useState<string | null>(
    contract.status === 'resolved' ? userPickOutcomeId : null
  );

  // When live contract resolves, update local state and trigger celebration
  useEffect(() => {
    if (liveContract?.status === 'resolved' && liveWinningOutcomeId && !resolvedWinnerOutcomeId) {
      setResolvedWinnerOutcomeId(liveWinningOutcomeId);
      toast.success('🏆 Contract resolved! Outcomes are in.', { duration: 4000 });
      if (liveWinningOutcomeId === userPickOutcomeId) {
        setTimeout(() => setShowWinCelebration(true), 600);
      }
    }
  }, [liveContract?.status, liveWinningOutcomeId, resolvedWinnerOutcomeId, userPickOutcomeId]);

  // When live participant count changes, show a subtle toast
  const prevParticipantCountRef = useRef(contract.participantCount);
  useEffect(() => {
    if (
      liveParticipantCount > prevParticipantCountRef.current &&
      prevParticipantCountRef.current > 0
    ) {
      toast(`👥 ${liveParticipantCount} participants now`, { duration: 2500 });
    }
    prevParticipantCountRef.current = liveParticipantCount;
  }, [liveParticipantCount]);

  const userWon = resolvedWinnerOutcomeId !== null && resolvedWinnerOutcomeId === userPickOutcomeId;
  const winningOutcomeLabel = contract.outcomes.find((o) => o.id === resolvedWinnerOutcomeId)?.label ?? '';

  // Show celebration banner when contract is resolved and user won
  useEffect(() => {
    if (contract.status === 'resolved' && userWon) {
      const t = setTimeout(() => setShowWinCelebration(true), 600);
      return () => clearTimeout(t);
    }
  }, [contract.status, userWon]);

  React.useEffect(() => {
    const t = setTimeout(() => setAnimatedBars(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const participantAvatars = MOCK_USERS.slice(0, 5).map((u) => u.avatar);

  const handleOutcomeSelect = (outcomeId: string) => {
    if (contract.status !== 'open') return;
    setSelectedOutcome(outcomeId);
    setShowEntry(true);
  };

  const handleSendMessage = () => {
    const text = chatInput.trim();
    if (!text || text.length > 280) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: 'user-001',
      userName: 'Jordan Reyes',
      avatar: 'JR',
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (contractLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading contract...</p>
      </div>
    );
  }

  if (contractNotFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-xl font-bold mb-2">Contract not found</h1>
        <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
          This contract may have been removed or the link is incorrect.
        </p>
        <button onClick={() => router.back()} className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
          Go back
        </button>
      </div>
    );
  }

  const handleAdminResolved = (outcomeId: string) => {
    setResolvedWinnerOutcomeId(outcomeId);
    // Show celebration if user's pick won
    if (outcomeId === userPickOutcomeId) {
      setTimeout(() => setShowWinCelebration(true), 400);
    }
  };

  const handleShare = () => {
    const shareText = `🏆 I just won a pool on PoolParty!\n\n"${contract.title}"\n\nMy pick: ${winningOutcomeLabel}\n\nJoin me on PoolParty!`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'I won on PoolParty! 🏆', text: shareText, url: window.location.href }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => toast.success('Win details copied to clipboard! 🎉'));
    }
    setShowWinCelebration(false);
  };

  return (
    <>
      <div className="px-4 pt-4 pb-4">
        {/* Back header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.push('/home-screen')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <h1 className="text-base font-semibold text-foreground flex-1 truncate">Contract Detail</h1>
          <StatusBadge status={contract.status} />
          {isCreator && (
            <button
              onClick={() => setShowAdmin(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
            >
              <Settings size={16} style={{ color: 'var(--muted-foreground)' }} />
            </button>
          )}
        </div>

        {/* Win celebration inline banner (shown when resolved + user won, after dismissing modal) */}
        {contract.status === 'resolved' && userWon && !showWinCelebration && resolvedWinnerOutcomeId && (
          <div
            className="rounded-2xl p-4 mb-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,92,255,0.15) 0%, rgba(255,77,141,0.1) 100%)',
              border: '1.5px solid rgba(124,92,255,0.35)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7C5CFF 0%, #FF4D8D 100%)' }}
              >
                <Trophy size={20} color="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-foreground">You Won! 🎉</p>
                <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                  Pick: <span className="font-semibold" style={{ color: 'var(--success)' }}>{winningOutcomeLabel}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Trust score gain chip */}
                <div
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
                  style={{ background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.2)' }}
                >
                  <Star size={12} style={{ color: 'var(--primary)' }} />
                  <span className="text-xs font-extrabold" style={{ color: 'var(--primary)' }}>+12 pts</span>
                </div>
                {/* Share button */}
                <button
                  onClick={handleShare}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'var(--primary)' }}
                >
                  <Share2 size={15} color="#fff" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Title card */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm">{contract.groupEmoji}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {contract.groupName}
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground leading-snug mb-3">
            {contract.title}
          </h2>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold"
                style={{ background: 'var(--elevated)', color: 'var(--foreground)' }}
              >
                {contract.creatorName[0]}
              </div>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                by {contract.creatorName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Closes May 10
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {contract.participantCount} entered
              </span>
            </div>
          </div>
        </div>

        {/* Stake note */}
        <div
          className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
          style={{ background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.15)' }}
        >
          <Info size={14} style={{ color: 'var(--primary)' }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>Stake note</p>
            <p className="text-xs text-foreground">{contract.stakeNote}</p>
          </div>
        </div>

        {/* Outcomes */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Pick an outcome</h3>
          <div className="space-y-3">
            {contract.outcomes.map((outcome, i) => {
              const isMyPick = i === 0;
              const isWinningOutcome = resolvedWinnerOutcomeId === outcome.id;
              const isMyWin = isMyPick && isWinningOutcome;
              const barColors = [
                'linear-gradient(90deg, #7C5CFF, #9B7FFF)',
                'linear-gradient(90deg, #FF4D8D, #FF7BAC)',
                'linear-gradient(90deg, #00C9A7, #00E676)',
              ];

              return (
                <button
                  key={outcome.id}
                  onClick={() => handleOutcomeSelect(outcome.id)}
                  className="w-full text-left rounded-xl p-4 transition-all duration-150 active:scale-98"
                  style={{
                    background: isMyWin
                      ? 'rgba(0,230,118,0.08)'
                      : isMyPick
                      ? 'rgba(124,92,255,0.08)'
                      : 'var(--surface)',
                    border: isMyWin
                      ? '1.5px solid rgba(0,230,118,0.4)'
                      : isMyPick
                      ? '1.5px solid rgba(124,92,255,0.4)'
                      : '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{outcome.label}</span>
                      {isMyPick && !isWinningOutcome && (
                        <span
                          className="pill-badge text-2xs"
                          style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}
                        >
                          Your pick
                        </span>
                      )}
                      {isMyWin && (
                        <span
                          className="pill-badge text-2xs flex items-center gap-1"
                          style={{ background: 'rgba(0,230,118,0.15)', color: 'var(--success)' }}
                        >
                          <Trophy size={10} />
                          Winner ✓
                        </span>
                      )}
                      {isWinningOutcome && !isMyPick && (
                        <span
                          className="pill-badge text-2xs"
                          style={{ background: 'rgba(255,215,0,0.15)', color: '#B8860B' }}
                        >
                          Winning pick
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                        {outcome.entryCount} entries
                      </span>
                      <ReturnBadge weight={outcome.weight} />
                    </div>
                  </div>

                  <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--elevated)' }}>
                    <div
                      className="h-full rounded-full outcome-bar-fill"
                      style={{
                        width: animatedBars ? `${outcome.percent}%` : '0%',
                        background: isMyWin
                          ? 'linear-gradient(90deg, #00C9A7, #00E676)'
                          : barColors[i % barColors.length],
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>
                      {outcome.percent}% of entries
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      ${outcome.totalStake} staked
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Participants */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Participants</h3>
            <button
              onClick={() => setShowParticipants(true)}
              className="text-xs font-semibold px-2 py-1 rounded-lg transition-all active:scale-90"
              style={{ background: 'var(--elevated)', color: 'var(--primary)' }}
            >
              {contract.participantCount} total →
            </button>
          </div>
          <AvatarStack avatars={participantAvatars} count={contract.participantCount} size={32} />
        </div>

        {/* Rules — with URL auto-detection */}
        {contract.rules && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-1.5">Rules &amp; Source</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              <RulesText text={contract.rules} />
            </p>
            {contract.source && (
              <div className="flex items-center gap-1 mt-2">
                <ExternalLink size={12} style={{ color: 'var(--primary)' }} />
                {/^https?:\/\//.test(contract.source) ? (
                  <a
                    href={contract.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    {contract.source}
                  </a>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {contract.source}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lock CTA */}
        {contract.status === 'open' && (
          <button
            onClick={() => setShowEntry(true)}
            className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            <Lock size={16} />
            Lock in your entry
          </button>
        )}

        {contract.status === 'locked' && (
          <div
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <Lock size={16} style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>
              Entries locked — awaiting resolution
            </span>
          </div>
        )}

        {contract.status === 'resolved' && (
          <div className="space-y-3">
            {/* Resolved status row */}
            <div
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
              style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)' }}
            >
              <CheckCircle size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                Resolved — check settlements
              </span>
            </div>

            {/* Trust score update row (shown when user won) */}
            {userWon && (
              <div
                className="w-full py-3 px-4 rounded-2xl flex items-center justify-between"
                style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.2)' }}
              >
                <div className="flex items-center gap-2">
                  <Star size={15} style={{ color: 'var(--primary)' }} />
                  <span className="text-sm font-semibold text-foreground">Trust Score Updated</span>
                </div>
                <span className="text-sm font-extrabold" style={{ color: 'var(--primary)' }}>+12 pts</span>
              </div>
            )}

            {/* Share button (shown when user won) */}
            {userWon && (
              <button
                onClick={handleShare}
                className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                <Share2 size={15} />
                Share Your Win 🏆
              </button>
            )}
          </div>
        )}

        {contract.status === 'locked' && isCreator && (
          <button
            className="w-full py-3 rounded-xl font-semibold text-sm mt-3 transition-all active:scale-95"
            style={{
              background: 'var(--elevated)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            }}
          >
            Resolve Contract (Creator)
          </button>
        )}

        {/* Chat & Activity */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Pool Chat</h3>
          <div
            className="rounded-2xl overflow-hidden p-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <ChatPanel poolId={contract.id} />
          </div>
        </div>
      </div>

      {showParticipants && (
        <ParticipantsSheet contract={contract} onClose={() => setShowParticipants(false)} />
      )}

      {showEntry && selectedOutcome && (
        <EntryModal
          contract={contract}
          outcomeId={selectedOutcome}
          onClose={() => setShowEntry(false)}
        />
      )}

      {showAdmin && (
        <AdminSheet
          contract={contract}
          onClose={() => setShowAdmin(false)}
          onResolved={handleAdminResolved}
        />
      )}

      {/* Win Celebration Modal */}
      {showWinCelebration && (
        <WinCelebrationBanner
          contractTitle={contract.title}
          winningOutcome={winningOutcomeLabel}
          trustScoreGain={12}
          onShare={handleShare}
          onDismiss={() => setShowWinCelebration(false)}
        />
      )}
    </>
  );
}