'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  X, ChevronRight, ChevronLeft, Copy, MessageSquare, Share2,
  QrCode, Users, Check, Rocket, Edit3, BadgeCheck,
} from 'lucide-react';
import type { PoolTemplate } from '../page';
import Icon from '@/components/ui/AppIcon';


interface PoolCloneFlowProps {
  template: PoolTemplate;
  onClose: () => void;
  onLaunched: () => void;
}

type Step = 'preview' | 'edit' | 'invite' | 'launch';

const INVITE_METHODS = [
  { id: 'copy_link', label: 'Copy Link', icon: Copy, color: '#7C5CFF' },
  { id: 'sms', label: 'SMS', icon: MessageSquare, color: '#00C9A7' },
  { id: 'whatsapp', label: 'WhatsApp', icon: Share2, color: '#25D366' },
  { id: 'qr_code', label: 'QR Code', icon: QrCode, color: '#FF4D8D' },
  { id: 'group', label: 'Group', icon: Users, color: '#FF6B35' },
];

export default function PoolCloneFlow({ template, onClose, onLaunched }: PoolCloneFlowProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [step, setStep] = useState<Step>('preview');
  const [title, setTitle] = useState(template.title);
  const [rules, setRules] = useState(template.resolution_rules ?? '');
  const [selectedInvites, setSelectedInvites] = useState<string[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const steps: Step[] = ['preview', 'edit', 'invite', 'launch'];
  const stepIndex = steps.indexOf(step);

  const handleNext = () => {
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  };

  const handleBack = () => {
    const prev = steps[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const toggleInvite = (id: string) => {
    setSelectedInvites(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCopyLink = () => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${template.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      if (user) {
        await supabase.from('pool_template_clones').insert({
          template_id: template.id,
          user_id: user.id,
          title,
          custom_rules: rules,
        });
        await supabase.rpc('increment_template_clone', { p_template_id: template.id });
      }
      setLaunched(true);
      setTimeout(() => onLaunched(), 1800);
    } catch {
      setLaunched(true);
      setTimeout(() => onLaunched(), 1800);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleSkip = () => {
    if (stepIndex < steps.length - 1) {
      setStep(steps[stepIndex + 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-[390px] rounded-t-3xl flex flex-col"
        style={{ background: 'var(--background)', maxHeight: '92dvh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button onClick={handleBack} className="p-1.5 rounded-xl" style={{ background: 'var(--surface)' }}>
                <ChevronLeft size={18} style={{ color: 'var(--foreground)' }} />
              </button>
            )}
            <div>
              <h2 className="text-base font-black" style={{ color: 'var(--foreground)' }}>
                {step === 'preview' && 'Pool Preview'}
                {step === 'edit' && 'Customize Pool'}
                {step === 'invite' && 'Invite People'}
                {step === 'launch' && 'Ready to Launch'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Step {stepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl" style={{ background: 'var(--surface)' }}>
            <X size={18} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 mb-4">
          <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ background: 'var(--primary)', width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="px-4 pb-6 flex flex-col gap-4 flex-1">
          {/* STEP 1: Preview */}
          {step === 'preview' && (
            <>
              {template.cover_image && (
                <div className="rounded-2xl overflow-hidden h-40">
                  <img
                    src={template.cover_image}
                    alt={`${template.title} pool template preview`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{template.icon}</span>
                  <h3 className="text-lg font-black" style={{ color: 'var(--foreground)' }}>{template.title}</h3>
                  {template.is_official && <BadgeCheck size={18} color="#7C5CFF" />}
                </div>
                {template.subtitle && (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{template.subtitle}</p>
                )}
              </div>
              {template.description && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                  {template.description}
                </p>
              )}
              {template.resolution_source && (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.2)' }}>
                  <BadgeCheck size={16} color="#00C853" />
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#00C853' }}>Verified Resolution Source</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{template.resolution_source.name}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Launches', value: template.launch_count.toLocaleString() },
                  { label: 'Players', value: template.participant_count.toLocaleString() },
                  { label: 'Duration', value: template.default_expiration },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-2.5 text-center"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <p className="text-sm font-black" style={{ color: 'var(--foreground)' }}>{stat.value}</p>
                    <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP 2: Edit */}
          {step === 'edit' && (
            <>
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>
                  POOL TITLE
                </label>
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <Edit3 size={16} style={{ color: 'var(--muted-foreground)' }} />
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none font-medium"
                    style={{ color: 'var(--foreground)' }}
                    placeholder="Pool title..."
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>
                  RESOLUTION RULES <span className="font-normal">(optional)</span>
                </label>
                <textarea
                  value={rules}
                  onChange={e => setRules(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                  placeholder="How will this pool be resolved?"
                />
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--foreground)' }}>Default Expiration</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{template.default_expiration}</p>
              </div>
            </>
          )}

          {/* STEP 3: Invite */}
          {step === 'invite' && (
            <>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Choose how to invite people to your pool:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {INVITE_METHODS.map(method => {
                  const Icon = method.icon;
                  const isSelected = selectedInvites.includes(method.id);
                  return (
                    <button
                      key={method.id}
                      onClick={() => {
                        toggleInvite(method.id);
                        if (method.id === 'copy_link') handleCopyLink();
                      }}
                      className="flex items-center gap-3 p-3.5 rounded-xl transition-all"
                      style={{
                        background: isSelected ? `${method.color}15` : 'var(--surface)',
                        border: `1.5px solid ${isSelected ? method.color : 'var(--border)'}`,
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${method.color}20` }}>
                        <Icon size={18} style={{ color: method.color }} />
                      </div>
                      <span className="text-sm font-semibold flex-1 text-left" style={{ color: 'var(--foreground)' }}>
                        {method.label}
                        {method.id === 'copy_link' && copiedLink && (
                          <span className="ml-2 text-xs" style={{ color: '#00C853' }}>Copied!</span>
                        )}
                      </span>
                      {isSelected && <Check size={16} style={{ color: method.color }} />}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                You can also invite after launching
              </p>
            </>
          )}

          {/* STEP 4: Launch */}
          {step === 'launch' && (
            <>
              {launched ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,200,83,0.15)' }}
                  >
                    <Check size={40} color="#00C853" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-black" style={{ color: 'var(--foreground)' }}>Pool Launched! 🎉</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      Your pool is live and ready for players
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {template.cover_image && (
                      <img
                        src={template.cover_image}
                        alt={`${template.title} launch preview`}
                        className="w-full h-28 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <p className="font-black text-base" style={{ color: 'var(--foreground)' }}>{title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {template.default_expiration} · {template.category?.name ?? 'Pool'}
                      </p>
                    </div>
                  </div>
                  {selectedInvites.length > 0 && (
                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-bold mb-1" style={{ color: 'var(--muted-foreground)' }}>INVITE VIA</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedInvites.map(id => {
                          const m = INVITE_METHODS.find(m => m.id === id);
                          return m ? (
                            <span key={id} className="text-xs px-2 py-1 rounded-full font-medium"
                              style={{ background: `${m.color}20`, color: m.color }}>
                              {m.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.2)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      🔗 Every pool gets a unique share link, invite tracking, and join tracking automatically.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer CTA */}
        {!launched && (
          <div className="px-4 pb-8 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={step === 'launch' ? handleLaunch : handleNext}
              disabled={isLaunching}
              className="w-full py-3.5 rounded-2xl text-base font-black flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: 'var(--primary)', color: '#fff', opacity: isLaunching ? 0.7 : 1 }}
            >
              {isLaunching ? (
                <span>Launching...</span>
              ) : step === 'launch' ? (
                <><Rocket size={18} /> Launch Pool</>
              ) : (
                <>Continue <ChevronRight size={18} /></>
              )}
            </button>
            {step !== 'launch' && (
              <button
                onClick={handleSkip}
                className="w-full mt-2 py-2 text-sm font-medium"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Skip
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
