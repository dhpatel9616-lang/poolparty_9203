'use client';
import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Shield, ThumbsUp, Clock, Zap } from 'lucide-react';
import Link from 'next/link';

interface AccountabilityScore {
  accountability_score: number;
  response_rate: number;
  ghost_rate: number;
  would_participate_again_pct: number;
  reputation_level: string;
  total_contracts: number;
  completed_contracts: number;
  disputed_contracts: number;
  on_time_settlements: number;
}

interface ReliabilityEvent {
  id: string;
  event_type: string;
  event_description: string;
  score_delta: number;
  score_after: number;
  occurred_at: string;
}

interface Endorsement {
  id: string;
  category: string;
  note: string;
  weight: number;
  created_at: string;
  endorser: { full_name: string; username: string };
}

const LEVEL_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  bronze: { color: '#CD7F32', icon: '🥉', label: 'Bronze' },
  silver: { color: '#C0C0C0', icon: '🥈', label: 'Silver' },
  gold: { color: '#FFD700', icon: '🥇', label: 'Gold' },
  platinum: { color: '#E5E4E2', icon: '💎', label: 'Platinum' },
  diamond: { color: '#B9F2FF', icon: '💠', label: 'Diamond' },
  legend: { color: '#7C5CFF', icon: '⭐', label: 'Legend' },
};

const EVENT_ICONS: Record<string, { icon: string; color: string }> = {
  contract_completed: { icon: '✅', color: 'var(--success)' },
  on_time_settlement: { icon: '⚡', color: 'var(--warning)' },
  dispute_opened: { icon: '⚠️', color: 'var(--accent)' },
  endorsement_received: { icon: '👍', color: 'var(--primary)' },
  late_settlement: { icon: '🕐', color: 'var(--warning)' },
  default: { icon: '📋', color: 'var(--muted-foreground)' },
};

const MOCK_SCORE: AccountabilityScore = {
  accountability_score: 78.5,
  response_rate: 94.2,
  ghost_rate: 3.1,
  would_participate_again_pct: 88.0,
  reputation_level: 'gold',
  total_contracts: 42,
  completed_contracts: 38,
  disputed_contracts: 2,
  on_time_settlements: 35,
};

const MOCK_HISTORY: ReliabilityEvent[] = [
  { id: '1', event_type: 'contract_completed', event_description: 'Completed NBA Finals pool', score_delta: 2.0, score_after: 78.5, occurred_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', event_type: 'on_time_settlement', event_description: 'Settled wager within 24h', score_delta: 1.5, score_after: 76.5, occurred_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '3', event_type: 'endorsement_received', event_description: 'Endorsed for reliability', score_delta: 0.5, score_after: 75.0, occurred_at: new Date(Date.now() - 259200000).toISOString() },
  { id: '4', event_type: 'late_settlement', event_description: 'Settlement delayed 3 days', score_delta: -1.0, score_after: 74.5, occurred_at: new Date(Date.now() - 432000000).toISOString() },
  { id: '5', event_type: 'contract_completed', event_description: 'Completed World Cup pool', score_delta: 2.0, score_after: 75.5, occurred_at: new Date(Date.now() - 604800000).toISOString() },
];

const MOCK_ENDORSEMENTS: Endorsement[] = [
  { id: '1', category: 'reliability', note: 'Always pays on time!', weight: 1.0, created_at: new Date(Date.now() - 86400000).toISOString(), endorser: { full_name: 'Alex Chen', username: '@alexc' } },
  { id: '2', category: 'sportsmanship', note: 'Great competitor', weight: 1.0, created_at: new Date(Date.now() - 172800000).toISOString(), endorser: { full_name: 'Jordan Smith', username: '@jsmith' } },
  { id: '3', category: 'general', note: 'Trustworthy pool member', weight: 1.0, created_at: new Date(Date.now() - 345600000).toISOString(), endorser: { full_name: 'Sam Rivera', username: '@samr' } },
];

export default function ReputationTimelinePage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [score, setScore] = useState<AccountabilityScore>(MOCK_SCORE);
  const [history, setHistory] = useState<ReliabilityEvent[]>(MOCK_HISTORY);
  const [endorsements, setEndorsements] = useState<Endorsement[]>(MOCK_ENDORSEMENTS);
  const [activeTab, setActiveTab] = useState<'timeline' | 'endorsements' | 'stats'>('timeline');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: scoreData } = await supabase
          .from('accountability_scores')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (scoreData) setScore(scoreData);

        const { data: historyData } = await supabase
          .from('reliability_history')
          .select('*')
          .eq('user_id', user.id)
          .order('occurred_at', { ascending: false })
          .limit(30);
        if (historyData && historyData.length > 0) setHistory(historyData);

        const { data: endorseData } = await supabase
          .from('social_endorsements')
          .select('*, endorser:endorser_id(full_name, username)')
          .eq('endorsed_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (endorseData && endorseData.length > 0) setEndorsements(endorseData as any);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const levelCfg = LEVEL_CONFIG[score.reputation_level] || LEVEL_CONFIG.bronze;
  const scoreColor = score.accountability_score >= 75 ? 'var(--success)' : score.accountability_score >= 50 ? 'var(--warning)' : 'var(--accent)';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link href="/profile-screen" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--muted-foreground)' }} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Reputation Timeline</h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Your trust & accountability history</p>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {/* Score Hero */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>ACCOUNTABILITY SCORE</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black" style={{ color: scoreColor }}>{score.accountability_score.toFixed(1)}</span>
                  <span className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>/100</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">{levelCfg.icon}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${levelCfg.color}22`, color: levelCfg.color }}>
                  {levelCfg.label}
                </span>
              </div>
            </div>
            {/* Score bar */}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--elevated)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score.accountability_score}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}88)` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Response Rate', value: `${score.response_rate.toFixed(0)}%`, icon: Zap, color: 'var(--success)' },
              { label: 'Ghost Rate', value: `${score.ghost_rate.toFixed(1)}%`, icon: Clock, color: score.ghost_rate < 5 ? 'var(--success)' : 'var(--accent)' },
              { label: 'Would Join Again', value: `${score.would_participate_again_pct.toFixed(0)}%`, icon: ThumbsUp, color: 'var(--primary)' },
              { label: 'Contracts Done', value: `${score.completed_contracts}/${score.total_contracts}`, icon: Shield, color: 'var(--warning)' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}18` }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">{stat.value}</p>
                  <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
            {(['timeline', 'endorsements', 'stats'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  background: activeTab === tab ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--muted-foreground)',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-2">
              {history.map((event, idx) => {
                const cfg = EVENT_ICONS[event.event_type] || EVENT_ICONS.default;
                const isPositive = event.score_delta >= 0;
                return (
                  <div key={event.id} className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${cfg.color}18`, border: `1.5px solid ${cfg.color}44` }}>
                        {cfg.icon}
                      </div>
                      {idx < history.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'var(--border)', minHeight: 16 }} />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground capitalize">{event.event_type.replace(/_/g, ' ')}</p>
                            {event.event_description && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{event.event_description}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-sm font-bold" style={{ color: isPositive ? 'var(--success)' : 'var(--accent)' }}>
                              {isPositive ? '+' : ''}{event.score_delta.toFixed(1)}
                            </span>
                            <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{formatDate(event.occurred_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Score after:</span>
                          <span className="text-2xs font-bold" style={{ color: scoreColor }}>{event.score_after.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Endorsements Tab */}
          {activeTab === 'endorsements' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{endorsements.length} Endorsements</p>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--primary)22', color: 'var(--primary)' }}>
                  +{(endorsements.length * 0.5).toFixed(1)} pts
                </span>
              </div>
              {endorsements.map((e) => (
                <div key={e.id} className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,201,167,0.2))', color: 'var(--primary)' }}>
                      {e.endorser?.full_name?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{e.endorser?.full_name || 'Unknown'}</p>
                        <span className="text-2xs px-2 py-0.5 rounded-full capitalize" style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)' }}>{e.category}</span>
                      </div>
                      {e.note && <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>"{e.note}"</p>}
                      <p className="text-2xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{formatDate(e.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-3">
              {[
                { label: 'Total Contracts', value: score.total_contracts, max: 100, color: 'var(--primary)' },
                { label: 'Completed', value: score.completed_contracts, max: score.total_contracts || 1, color: 'var(--success)' },
                { label: 'On-Time Settlements', value: score.on_time_settlements, max: score.completed_contracts || 1, color: 'var(--warning)' },
                { label: 'Disputed', value: score.disputed_contracts, max: score.total_contracts || 1, color: 'var(--accent)' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{stat.label}</p>
                    <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--elevated)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (stat.value / stat.max) * 100)}%`, background: stat.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
