'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, X, Plus, QrCode, MessageSquare, Link as LinkIcon, ShieldCheck } from 'lucide-react';

interface GroupCreationFlowProps {
  onComplete: (groupData: GroupFormData) => void;
  onCancel: () => void;
}

interface GroupFormData {
  name: string;
  description: string;
  emoji: string;
  category: string;
  maxMembers: string;
  invitePhones: string[];
  requireApproval: boolean;
  whoCreatesContracts: string;
  whoResolvesContracts: string;
  whoInvites: string;
}

const EMOJIS = ['🏀', '⚽', '🎮', '💼', '🎬', '🎵', '🍕', '✈️', '💰', '🏆', '🎯', '🔥'];
const CATEGORIES = ['Sports', 'Entertainment', 'Friends', 'Work', 'Other'];
const MAX_MEMBERS = ['4', '8', '16', 'Unlimited'];

type InviteTab = 'sms' | 'link' | 'qr';

export default function GroupCreationFlow({ onComplete, onCancel }: GroupCreationFlowProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<GroupFormData>({
    name: '',
    description: '',
    emoji: '🏆',
    category: 'Friends',
    maxMembers: '8',
    invitePhones: [],
    requireApproval: false,
    whoCreatesContracts: 'All members',
    whoResolvesContracts: 'Creator',
    whoInvites: 'All members',
  });
  const [inviteTab, setInviteTab] = useState<InviteTab>('sms');
  const [phoneInput, setPhoneInput] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [launching, setLaunching] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const inviteLink = `https://poolparty3501.builtwithrocket.new/invite/grp-${Date.now().toString(36)}`;

  const stopConfetti = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const launchConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#7C5CFF', '#00E676', '#FFD700', '#FF6B6B', '#00BFFF', '#FF69B4', '#FFA500'];
    const PARTICLE_COUNT = 140;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      color: string;
      width: number; height: number;
      rotation: number; rotationSpeed: number;
      opacity: number;
    }

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      width: 6 + Math.random() * 8,
      height: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    }));

    const startTime = performance.now();
    const DURATION = 3000;

    const draw = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const progress = Math.min(elapsed / DURATION, 1);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.rotation += p.rotationSpeed;
        p.opacity = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      });

      if (elapsed < DURATION) {
        animFrameRef.current = requestAnimationFrame(draw);
      } else {
        stopConfetti();
      }
    };

    animFrameRef.current = requestAnimationFrame(draw);
  }, [stopConfetti]);

  useEffect(() => {
    return () => stopConfetti();
  }, [stopConfetti]);

  const handleLaunch = () => {
    setLaunching(true);
    launchConfetti();
    setTimeout(() => {
      stopConfetti();
      setLaunching(false);
      onComplete(form);
    }, 3000);
  };

  const addPhone = () => {
    const trimmed = phoneInput.trim();
    if (trimmed && !form.invitePhones.includes(trimmed)) {
      setForm((f) => ({ ...f, invitePhones: [...f.invitePhones, trimmed] }));
      setPhoneInput('');
    }
  };

  const removePhone = (phone: string) => {
    setForm((f) => ({ ...f, invitePhones: f.invitePhones.filter((p) => p !== phone) }));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const canProceed = () => {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.invitePhones.length > 0 || inviteTab !== 'sms';
    return true;
  };

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9999 }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={step === 1 ? onCancel : () => setStep((s) => s - 1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Create Group</h1>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Step {step} of 4</p>
        </div>
        {/* Step dots */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: s <= step ? 'var(--primary)' : 'var(--border)' }}
            />
          ))}
        </div>
      </div>

      {/* Step 1 — Group Info */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Emoji picker */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>Group Emoji</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                  style={{
                    background: form.emoji === e ? 'rgba(124,92,255,0.2)' : 'var(--elevated)',
                    border: form.emoji === e ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Group name */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>Group Name *</p>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Hoops Squad"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>Description (optional)</p>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What's this group about?"
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          {/* Category */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setForm((f) => ({ ...f, category: cat }))}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: form.category === cat ? 'var(--primary)' : 'var(--elevated)',
                    color: form.category === cat ? '#fff' : 'var(--muted-foreground)',
                    border: form.category === cat ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Max members */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>Max Members</p>
            <div className="flex gap-2">
              {MAX_MEMBERS.map((m) => (
                <button
                  key={m}
                  onClick={() => setForm((f) => ({ ...f, maxMembers: m }))}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: form.maxMembers === m ? 'var(--primary)' : 'var(--elevated)',
                    color: form.maxMembers === m ? '#fff' : 'var(--muted-foreground)',
                    border: form.maxMembers === m ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance note */}
          <div
            className="rounded-xl p-3 flex items-start gap-2"
            style={{ background: 'rgba(255,200,87,0.08)', border: '1px solid rgba(255,200,87,0.2)' }}
          >
            <ShieldCheck size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
            <p className="text-xs" style={{ color: 'var(--warning)' }}>
              PoolParty groups are private and invite-only. PoolParty does not process payments or facilitate gambling. Groups are for tracking friendly agreements between people who know each other.
            </p>
          </div>
        </div>
      )}

      {/* Step 2 — Invite Members */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-foreground mb-1">Invite Members</h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              You must invite at least 1 person. Groups are invite-only — no public browsing.
            </p>
          </div>

          {/* Invite tabs */}
          <div className="flex gap-1.5">
            {([
              { id: 'sms' as InviteTab, label: 'SMS', icon: <MessageSquare size={13} /> },
              { id: 'link' as InviteTab, label: 'Copy Link', icon: <LinkIcon size={13} /> },
              { id: 'qr' as InviteTab, label: 'QR Code', icon: <QrCode size={13} /> },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setInviteTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: inviteTab === tab.id ? 'var(--primary)' : 'var(--elevated)',
                  color: inviteTab === tab.id ? '#fff' : 'var(--muted-foreground)',
                  border: inviteTab === tab.id ? 'none' : '1px solid var(--border)',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {inviteTab === 'sms' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPhone()}
                  placeholder="+1 (555) 000-0000"
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                />
                <button
                  onClick={addPhone}
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--primary)' }}
                >
                  <Plus size={18} color="#fff" />
                </button>
              </div>
              {form.invitePhones.length > 0 && (
                <div className="space-y-2">
                  {form.invitePhones.map((phone) => (
                    <div
                      key={phone}
                      className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                      style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                    >
                      <span className="text-sm text-foreground">{phone}</span>
                      <button onClick={() => removePhone(phone)}>
                        <X size={14} style={{ color: 'var(--muted-foreground)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Each number receives: &quot;[You] invited you to [{form.name || 'your group'}] on PoolParty. You&apos;ll need to be invited to join.&quot;
              </p>
            </div>
          )}

          {inviteTab === 'link' && (
            <div className="space-y-3">
              <div
                className="rounded-xl p-4"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  Invite Link (expires in 7 days)
                </p>
                <p className="text-xs text-foreground break-all mb-3">{inviteLink}</p>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold w-full justify-center transition-all"
                  style={{
                    background: linkCopied ? 'rgba(0,230,118,0.15)' : 'rgba(124,92,255,0.15)',
                    color: linkCopied ? 'var(--success)' : 'var(--primary)',
                  }}
                >
                  {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Link works once per invitee. Each click creates a new invite record. No one can join without a valid invite.
              </p>
            </div>
          )}

          {inviteTab === 'qr' && (
            <div className="space-y-3">
              <div
                className="rounded-xl p-6 flex flex-col items-center gap-4"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
              >
                {/* QR placeholder */}
                <div
                  className="w-40 h-40 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
                >
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-sm"
                        style={{ background: Math.random() > 0.5 ? 'var(--foreground)' : 'transparent' }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground text-center">
                  Show this to someone in person
                </p>
                <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                  They scan this to get your invite link
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Settings */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-foreground mb-1">Group Settings</h2>
          </div>

          {/* Visibility — always invite only */}
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}
          >
            <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
            <div>
              <p className="text-sm font-semibold text-foreground">Invite Only</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Groups cannot be discoverable by non-members. This is non-negotiable for compliance.
              </p>
            </div>
          </div>

          {/* Require approval */}
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">Require Admin Approval</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Accepted invites go to pending until owner approves
              </p>
            </div>
            <button
              onClick={() => setForm((f) => ({ ...f, requireApproval: !f.requireApproval }))}
              className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: form.requireApproval ? 'var(--primary)' : 'var(--elevated)', border: '1px solid var(--border)' }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
                style={{ background: '#fff', transform: form.requireApproval ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
          </div>

          {/* Who creates contracts */}
          {[
            { key: 'whoCreatesContracts' as keyof GroupFormData, label: 'Who can create contracts?', options: ['All members', 'Admins only'] },
            { key: 'whoResolvesContracts' as keyof GroupFormData, label: 'Who can resolve contracts?', options: ['Creator', 'Any admin', 'Group vote'] },
            { key: 'whoInvites' as keyof GroupFormData, label: 'Who can invite new members?', options: ['All members', 'Admins only'] },
          ].map((setting) => (
            <div key={setting.key} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold text-foreground mb-2">{setting.label}</p>
              <div className="flex flex-wrap gap-2">
                {setting.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setForm((f) => ({ ...f, [setting.key]: opt }))}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: form[setting.key] === opt ? 'var(--primary)' : 'var(--elevated)',
                      color: form[setting.key] === opt ? '#fff' : 'var(--muted-foreground)',
                      border: form[setting.key] === opt ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 4 — Confirmation */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-foreground mb-1">Ready to Launch</h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Review your group before creating</p>
          </div>

          {/* Summary card */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'var(--elevated)' }}
              >
                {form.emoji}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{form.name}</h3>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {form.category} · Max {form.maxMembers}
                </p>
              </div>
            </div>
            {form.description && (
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>{form.description}</p>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Invited</span>
                <span className="text-xs font-semibold text-foreground">
                  {form.invitePhones.length > 0 ? `${form.invitePhones.length} invited` : 'Via link/QR'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Visibility</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>🔒 Invite Only</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Admin approval</span>
                <span className="text-xs font-semibold text-foreground">{form.requireApproval ? 'Required' : 'Not required'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Contracts</span>
                <span className="text-xs font-semibold text-foreground">{form.whoCreatesContracts}</span>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-3 flex items-start gap-2"
            style={{ background: 'rgba(255,200,87,0.08)', border: '1px solid rgba(255,200,87,0.2)' }}
          >
            <ShieldCheck size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
            <p className="text-xs" style={{ color: 'var(--warning)' }}>
              PoolParty does not process payments or facilitate gambling. Groups are for tracking friendly agreements.
            </p>
          </div>

          <button
            onClick={handleLaunch}
            disabled={launching}
            className="w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-95"
            style={{ background: 'var(--primary)', color: '#fff', opacity: launching ? 0.8 : 1 }}
          >
            {launching ? '🎉 Launching...' : '🚀 Launch Group'}
          </button>
        </div>
      )}

      {/* Navigation buttons */}
      {step < 4 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-4">
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: canProceed() ? 'var(--primary)' : 'var(--elevated)',
              color: canProceed() ? '#fff' : 'var(--muted-foreground)',
              opacity: canProceed() ? 1 : 0.6,
            }}
          >
            {step === 3 ? 'Review' : 'Continue'}
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
