'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { X, Plus, Trash2, ChevronRight, ChevronLeft, Check, CheckCircle2, Share2 } from 'lucide-react';

type ContractType = 'yes_no' | 'multi' | 'number' | 'time';

const CONTRACT_TYPES: { id: ContractType; label: string; emoji: string; desc: string }[] = [
  { id: 'yes_no', label: 'Binary (Yes/No)', emoji: '✅', desc: 'Simple binary outcome' },
  { id: 'multi', label: 'Multi-Outcome', emoji: '🎯', desc: 'Multiple named choices' },
  { id: 'number', label: 'Numeric Scale', emoji: '🔢', desc: 'Predict a number/range' },
  { id: 'time', label: 'Date/Time', emoji: '⏱️', desc: 'Predict when something happens' },
];

const TEMPLATES = [
  'Will [team] win the next game?',
  'Who finishes first in [event]?',
  'Will [person] achieve [goal] by [date]?',
  'How many [metric] by end of [period]?',
];

// Confidence labels — clear and non-financial
const CONFIDENCE_PRESETS = [
  { id: 'conservative', label: 'Conservative', weight: -110, color: '#00C9A7' },
  { id: 'standard', label: 'Standard', weight: 0, color: '#FFC857' },
  { id: 'aggressive', label: 'Aggressive', weight: 120, color: '#FF6B35' },
  { id: 'longshot', label: 'Long Shot', weight: 250, color: '#FF4D8D' },
];

interface Outcome {
  id: string;
  label: string;
  weight: number;
}

interface Step1Form {
  title: string;
  type: ContractType;
}

interface Group {
  id: string;
  name: string;
  emoji: string;
}

// Default outcomes per contract type
function getDefaultOutcomes(type: ContractType): Outcome[] {
  switch (type) {
    case 'yes_no':
      return [
        { id: 'out-1', label: 'Yes', weight: 0 },
        { id: 'out-2', label: 'No', weight: 0 },
      ];
    case 'multi':
      return [
        { id: 'out-1', label: 'Option A', weight: 0 },
        { id: 'out-2', label: 'Option B', weight: 0 },
        { id: 'out-3', label: 'Option C', weight: 0 },
      ];
    case 'number':
      return []; // numeric type uses a different input
    case 'time':
      return []; // time type uses date/time inputs
    default:
      return [{ id: 'out-1', label: 'Yes', weight: 0 }, { id: 'out-2', label: 'No', weight: 0 }];
  }
}

export default function CreateWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [contractType, setContractType] = useState<ContractType>('yes_no');
  const [outcomes, setOutcomes] = useState<Outcome[]>(getDefaultOutcomes('yes_no'));
  const [numericMin, setNumericMin] = useState('');
  const [numericMax, setNumericMax] = useState('');
  const [numericUnit, setNumericUnit] = useState('');
  const [numericPrediction, setNumericPrediction] = useState('');
  const [timePrediction, setTimePrediction] = useState('');
  const [timePredictionTime, setTimePredictionTime] = useState('12:00');
  const [visibility, setVisibility] = useState<'group' | 'private'>('group');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [stakeNote, setStakeNote] = useState('$25 per person via Venmo');
  const [entryDeadline, setEntryDeadline] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [entryDeadlineTime, setEntryDeadlineTime] = useState('23:59');
  const [resolutionDeadline, setResolutionDeadline] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [recurring, setRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdPoolId, setCreatedPoolId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Step1Form>({
    defaultValues: { type: 'yes_no' },
  });
  const title = watch('title');

  // Load user's groups
  useEffect(() => {
    if (!user) return;
    const loadGroups = async () => {
      const { data } = await supabase
        .from('groups')
        .select('id, name, emoji')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data && data.length > 0) {
        setAvailableGroups(data as Group[]);
        if (data.length > 0) setSelectedGroups([data[0].id]);
      } else {
        setAvailableGroups([
          { id: 'mock-g1', name: 'Sports Crew', emoji: '🏈' },
          { id: 'mock-g2', name: 'Work Friends', emoji: '💼' },
        ]);
      }
    };
    loadGroups();
  }, [user]);

  const handleTypeChange = (type: ContractType) => {
    setContractType(type);
    setValue('type', type);
    setOutcomes(getDefaultOutcomes(type));
  };

  const addOutcome = () => {
    setOutcomes((prev) => [...prev, { id: `out-${Date.now()}`, label: '', weight: 0 }]);
  };

  const removeOutcome = (id: string) => {
    if (outcomes.length <= 2) { toast.error('At least 2 outcomes required'); return; }
    setOutcomes((prev) => prev.filter((o) => o.id !== id));
  };

  const updateOutcome = (id: string, field: keyof Outcome, value: string | number) => {
    setOutcomes((prev) => prev.map((o) => o.id === id ? { ...o, [field]: value } : o));
  };

  const cycleConfidence = (id: string) => {
    const presets = CONFIDENCE_PRESETS.map((p) => p.weight);
    const current = outcomes.find((o) => o.id === id)?.weight ?? 0;
    const currentIdx = presets.indexOf(current);
    const nextIdx = (currentIdx + 1) % presets.length;
    updateOutcome(id, 'weight', presets[nextIdx]);
  };

  const getConfidencePreset = (weight: number) => CONFIDENCE_PRESETS.find((p) => p.weight === weight) || CONFIDENCE_PRESETS[1];

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const onStep1Submit = handleSubmit(() => setStep(2));

  const handleFinalSubmit = async () => {
    if (selectedGroups.length === 0 && visibility === 'group') {
      toast.error('Select at least one group');
      return;
    }
    setSubmitting(true);
    try {
      // Moderation framework: when REQUIRE_POOL_APPROVAL is true, new pools sit in
      // the admin Approval Queue (/admin) until manually approved — useful once you
      // have public/stranger-facing Discover traffic worth moderating. Off by default
      // since it was blocking every single pool during friends-and-family testing.
      const REQUIRE_POOL_APPROVAL = false;

      const poolData = {
        title,
        contract_type: contractType,
        visibility,
        group_ids: selectedGroups,
        stake_note: stakeNote,
        entry_deadline: entryDeadline ? `${entryDeadline}T${entryDeadlineTime}:00` : null,
        resolution_deadline: resolutionDeadline || null,
        recurring,
        creator_id: user?.id,
        status: REQUIRE_POOL_APPROVAL ? 'pending_approval' : 'open',
      };

      const { data, error } = await supabase.from('pools').insert(poolData).select().single();

      if (error || !data) {
        toast.error(error?.message || 'Failed to create contract. Please try again.');
        setSubmitting(false);
        return;
      }

      // Outcomes are real rows in pool_outcomes, not a JSON field on pools —
      // pool_entries and the resolve flow both reference pool_outcomes.id directly.
      let outcomeRows: { pool_id: string; label: string; weight: number }[] = [];
      if (contractType === 'yes_no' || contractType === 'multi') {
        outcomeRows = outcomes.map((o) => ({ pool_id: data.id, label: o.label, weight: o.weight }));
      } else if (contractType === 'number') {
        const rangeText = numericMin && numericMax ? ` (range ${numericMin}\u2013${numericMax}${numericUnit ? ` ${numericUnit}` : ''})` : '';
        outcomeRows = [{ pool_id: data.id, label: `Numeric prediction${rangeText}${numericPrediction ? ` — target ${numericPrediction}` : ''}`, weight: 0 }];
      } else if (contractType === 'time') {
        const whenText = timePrediction ? ` — ${timePrediction}${timePredictionTime ? ` ${timePredictionTime}` : ''}` : '';
        outcomeRows = [{ pool_id: data.id, label: `Date/time prediction${whenText}`, weight: 0 }];
      }

      if (outcomeRows.length > 0) {
        const { error: outcomeError } = await supabase.from('pool_outcomes').insert(outcomeRows);
        if (outcomeError) {
          // Pool exists but outcomes failed — surface this clearly rather than
          // silently leaving a pool with no selectable outcomes.
          toast.error('Contract created, but outcomes failed to save. Please edit the contract to add outcomes.');
        }
      }

      setCreatedPoolId(data.id);
      setSubmitted(true);
      toast.success(REQUIRE_POOL_APPROVAL ? 'Contract submitted for approval! 🎉' : 'Contract created! 🎉');
    } catch (err) {
      console.error('Contract creation failed', err);
      toast.error('Failed to create contract. Please check your connection and try again.');
    }
    setSubmitting(false);
  };

  const handleShare = () => {
    const url = `${window.location?.origin}/contract-detail-screen${createdPoolId ? `?id=${createdPoolId}` : ''}`;
    if (navigator.share) {
      navigator.share({ title: `Check out my pool: ${title}`, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
      toast.success('Link copied!');
    }
  };

  const STEP_LABELS = ['Info', 'Outcomes', 'Settings'];

  // Success screen
  if (submitted) {
    return (
      <div className="px-4 pt-8 pb-8 flex flex-col items-center text-center min-h-full">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(0,230,118,0.15)' }}>
          <CheckCircle2 size={40} style={{ color: 'var(--success)' }} />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Contract Created! 🎉</h2>
        <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>
          <span className="font-semibold text-foreground">"{title}"</span>
        </p>
        <div className="rounded-2xl p-4 mt-4 mb-6 w-full text-left" style={{ background: 'rgba(255,200,87,0.08)', border: '1px solid rgba(255,200,87,0.2)' }}>
          <p className="text-sm font-bold text-foreground mb-1">⏳ Pending Admin Approval</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Your contract is under review. Once approved, it will appear in your assigned groups, your creator profile, and Discover.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: 'rgba(124,92,255,0.15)', color: 'var(--primary)', border: '1px solid rgba(124,92,255,0.3)' }}
          >
            <Share2 size={16} /> Share
          </button>
          {createdPoolId ? (
            <button
              onClick={() => router.push(`/contract-detail-screen?id=${createdPoolId}`)}
              className="flex-1 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              View Contract
            </button>
          ) : (
            <button
              onClick={() => router.push('/home-screen')}
              className="flex-1 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              Go Home
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.push('/home-screen')}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {step > 1 ? <ChevronLeft size={18} style={{ color: 'var(--foreground)' }} /> : <X size={18} style={{ color: 'var(--foreground)' }} />}
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">New Contract</h1>
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{step}/3</span>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5 mb-6">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col gap-1">
            <div className="h-1 rounded-full transition-all duration-300" style={{ background: i + 1 <= step ? 'linear-gradient(90deg, var(--primary), #9B7FFF)' : 'var(--elevated)' }} />
            <span className="text-2xs font-medium" style={{ color: i + 1 === step ? 'var(--primary)' : 'var(--muted-foreground)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Info */}
      {step === 1 && (
        <form onSubmit={onStep1Submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Contract question</label>
            <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Write a clear, specific question with a definite answer</p>
            <textarea
              rows={3}
              placeholder="Will the Lakers make the playoffs this season?"
              className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none transition-all"
              style={{ background: 'var(--elevated)', border: errors.title ? '1.5px solid #FF4D8D' : '1.5px solid var(--border)' }}
              {...register('title', { required: 'Contract question is required', minLength: { value: 10, message: 'Question must be at least 10 characters' } })}
            />
            {errors.title && <p className="text-xs mt-1" style={{ color: '#FF4D8D' }}>{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Contract type</label>
            <div className="grid grid-cols-2 gap-2">
              {CONTRACT_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => handleTypeChange(ct.id)}
                  className="p-3 rounded-xl text-left transition-all active:scale-95"
                  style={{ background: contractType === ct.id ? 'rgba(124,92,255,0.1)' : 'var(--elevated)', border: contractType === ct.id ? '1.5px solid rgba(124,92,255,0.4)' : '1px solid var(--border)' }}
                >
                  <span className="text-lg block mb-1">{ct.emoji}</span>
                  <p className="text-xs font-semibold text-foreground">{ct.label}</p>
                  <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{ct.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Quick templates</label>
            <div className="space-y-1.5">
              {TEMPLATES.map((tmpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setValue('title', tmpl)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all active:scale-98"
                  style={{ background: title === tmpl ? 'rgba(124,92,255,0.08)' : 'var(--elevated)', border: title === tmpl ? '1px solid rgba(124,92,255,0.3)' : '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95" style={{ background: 'var(--primary)', color: '#fff' }}>
            Next: Set outcomes <ChevronRight size={16} />
          </button>
        </form>
      )}

      {/* Step 2: Outcomes — different inputs per type */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              {contractType === 'number' ? 'Numeric Range' : contractType === 'time' ? 'Date/Time Prediction' : 'Outcomes'}
            </p>

            {/* Binary / Multi-Outcome */}
            {(contractType === 'yes_no' || contractType === 'multi') && (
              <>
                <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  {contractType === 'multi' ? 'Add all possible named outcomes. Tap confidence to cycle.' : 'Binary Yes/No contract.'}
                </p>
                <div className="space-y-2">
                  {outcomes.map((outcome, i) => {
                    const preset = getConfidencePreset(outcome.weight);
                    return (
                      <div key={outcome.id} className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold w-5" style={{ color: 'var(--muted-foreground)' }}>{i + 1}</span>
                          <input
                            type="text"
                            value={outcome.label}
                            onChange={(e) => updateOutcome(outcome.id, 'label', e.target.value)}
                            placeholder={`Outcome ${i + 1}`}
                            className="flex-1 px-3 py-2 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                          />
                          {contractType === 'multi' && (
                            <button onClick={() => removeOutcome(outcome.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,77,141,0.1)' }}>
                              <Trash2 size={13} style={{ color: 'var(--social)' }} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pl-7">
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Confidence:</span>
                          <button
                            onClick={() => cycleConfidence(outcome.id)}
                            className="pill-badge text-2xs font-semibold transition-all active:scale-90"
                            style={{ color: preset.color, background: `${preset.color}18` }}
                          >
                            {preset.label} ↻
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {contractType === 'multi' && (
                  <button onClick={addOutcome} className="w-full mt-2 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95" style={{ background: 'var(--elevated)', border: '1px dashed var(--border)', color: 'var(--primary)' }}>
                    <Plus size={16} /> Add outcome
                  </button>
                )}
              </>
            )}

            {/* Numeric Scale */}
            {contractType === 'number' && (
              <div className="space-y-3">
                <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Set the numeric range and your prediction.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Min value</label>
                    <input
                      type="number"
                      value={numericMin}
                      onChange={(e) => setNumericMin(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground focus:outline-none"
                      style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Max value</label>
                    <input
                      type="number"
                      value={numericMax}
                      onChange={(e) => setNumericMax(e.target.value)}
                      placeholder="100"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground focus:outline-none"
                      style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Unit (optional)</label>
                  <input
                    type="text"
                    value={numericUnit}
                    onChange={(e) => setNumericUnit(e.target.value)}
                    placeholder="points, goals, dollars..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground focus:outline-none"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Your prediction</label>
                  <input
                    type="number"
                    value={numericPrediction}
                    onChange={(e) => setNumericPrediction(e.target.value)}
                    placeholder="Enter your predicted value"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground focus:outline-none"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                  />
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.2)' }}>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Each participant will enter their own numeric prediction. The closest prediction wins.
                  </p>
                </div>
              </div>
            )}

            {/* Date/Time */}
            {contractType === 'time' && (
              <div className="space-y-3">
                <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Predict when something will happen.</p>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Predicted date</label>
                  <input
                    type="date"
                    value={timePrediction}
                    onChange={(e) => setTimePrediction(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground focus:outline-none"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Predicted time (optional)</label>
                  <input
                    type="time"
                    value={timePredictionTime}
                    onChange={(e) => setTimePredictionTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground focus:outline-none"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                  />
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.2)' }}>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Each participant predicts a date/time. The closest prediction to the actual event wins.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Confidence guide for binary/multi */}
          {(contractType === 'yes_no' || contractType === 'multi') && (
            <div className="rounded-xl p-3" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold text-foreground mb-2">Confidence guide</p>
              <div className="grid grid-cols-2 gap-1.5">
                {CONFIDENCE_PRESETS.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <span className="pill-badge text-2xs" style={{ color: p.color, background: `${p.color}18` }}>{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1 transition-all active:scale-95" style={{ background: 'var(--elevated)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={() => {
                if (contractType === 'yes_no' || contractType === 'multi') {
                  const empty = outcomes.some((o) => !o.label.trim());
                  if (empty) { toast.error('Name all outcomes before continuing'); return; }
                }
                setStep(3);
              }}
              className="flex-[2] py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              Next: Settings <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Settings */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Multi-group selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Groups <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>(select multiple)</span></label>
            <div className="space-y-1.5">
              {availableGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-98"
                  style={{ background: selectedGroups.includes(g.id) ? 'rgba(124,92,255,0.08)' : 'var(--elevated)', border: selectedGroups.includes(g.id) ? '1.5px solid rgba(124,92,255,0.3)' : '1px solid var(--border)' }}
                >
                  <span className="text-lg">{g.emoji}</span>
                  <span className="text-sm font-medium text-foreground flex-1 text-left">{g.name}</span>
                  {selectedGroups.includes(g.id) && <Check size={14} style={{ color: 'var(--primary)' }} />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              {(['group', 'private'] as const).map((v) => (
                <button key={v} onClick={() => setVisibility(v)} className="py-3 rounded-xl text-sm font-semibold transition-all active:scale-95" style={{ background: visibility === v ? 'rgba(124,92,255,0.1)' : 'var(--elevated)', border: visibility === v ? '1.5px solid rgba(124,92,255,0.4)' : '1px solid var(--border)', color: visibility === v ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                  {v === 'group' ? '👥 Group' : '🔒 Private'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Entry deadline</label>
              <div className="flex gap-2">
                <input type="date" value={entryDeadline} onChange={(e) => setEntryDeadline(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl text-xs text-foreground focus:outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }} />
                <input type="time" value={entryDeadlineTime} onChange={(e) => setEntryDeadlineTime(e.target.value)} className="w-28 px-3 py-2.5 rounded-xl text-xs text-foreground focus:outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Resolution deadline</label>
              <input type="date" value={resolutionDeadline} onChange={(e) => setResolutionDeadline(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-xs text-foreground focus:outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Stake note</label>
            <input type="text" value={stakeNote} onChange={(e) => setStakeNote(e.target.value)} placeholder="$25 per person via Venmo" className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div>
              <p className="text-sm font-medium text-foreground">Recurring contract</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Auto-recreate after each resolution</p>
            </div>
            <button onClick={() => setRecurring((r) => !r)} className="relative w-11 h-6 rounded-full transition-all duration-200" style={{ background: recurring ? 'var(--primary)' : 'var(--elevated)', border: '1px solid var(--border)' }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200" style={{ left: recurring ? '22px' : '2px', background: '#fff' }} />
            </button>
          </div>

          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(255,200,87,0.06)', border: '1px solid rgba(255,200,87,0.15)' }}>
            <span className="text-sm">⚠️</span>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--warning)' }}>PoolParty does not process payments or hold funds. All settlement happens offline between members.</p>
          </div>

          <div className="flex gap-3 pb-4">
            <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1 transition-all active:scale-95" style={{ background: 'var(--elevated)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={handleFinalSubmit} disabled={submitting} className="flex-[2] py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95" style={{ background: 'var(--primary)', color: '#fff', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Contract 🎉'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}