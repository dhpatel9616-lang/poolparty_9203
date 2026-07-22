'use client';
import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, Star, ChevronRight, Zap } from 'lucide-react';
import type { PoolTemplate } from '../page';

interface Recommendation {
  templateId: string;
  score: number;
  reason: string;
  matchFactors: string[];
  category: string;
}

interface AIRecommendedPoolsProps {
  templates: PoolTemplate[];
  userHistory?: {
    createdCategories: string[];
    joinedCategories: string[];
    groupActivity: string[];
  };
  onUse: (template: PoolTemplate) => void;
}

const SCORE_COLORS: Record<string, string> = {
  high: '#00C853',
  medium: '#FFD700',
  low: '#FF6B35',
};

function ScoreBadge({ score }: { score: number }) {
  const level = score >= 85 ? 'high' : score >= 65 ? 'medium' : 'low';
  const color = SCORE_COLORS[level];
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: `${color}22`, color }}
    >
      <Star size={10} fill={color} />
      {score}% match
    </div>
  );
}

function MatchFactorPill({ factor }: { factor: string }) {
  return (
    <span
      className="text-2xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: 'rgba(124,92,255,0.12)', color: '#7C5CFF' }}
    >
      {factor}
    </span>
  );
}

// Free, deterministic recommendation scoring — no AI/API calls, no ongoing cost.
// Mirrors the original scoring weights: 40 history match, 30 group activity,
// 20 trending momentum, 10 difficulty fit.
function computeRecommendations(
  templates: PoolTemplate[],
  userHistory?: AIRecommendedPoolsProps['userHistory']
): Recommendation[] {
  if (templates.length === 0) return [];

  const createdCats = new Set((userHistory?.createdCategories ?? []).map((c) => c.toLowerCase()));
  const joinedCats = new Set((userHistory?.joinedCategories ?? []).map((c) => c.toLowerCase()));
  const groupCats = new Set((userHistory?.groupActivity ?? []).map((c) => c.toLowerCase()));

  const maxLaunches = Math.max(1, ...templates.map((t) => t.launch_count ?? 0));
  const maxViral = Math.max(1, ...templates.map((t) => t.analytics?.viral_coefficient ?? 0));

  const scored = templates.map((t) => {
    const category = (t.category?.name ?? '').toLowerCase();
    const matchFactors: string[] = [];
    let score = 0;

    // History match (40 pts)
    if (category && createdCats.has(category)) {
      score += 40;
      matchFactors.push('Your History');
    } else if (category && joinedCats.has(category)) {
      score += 28;
      matchFactors.push('Your History');
    }

    // Group activity alignment (30 pts)
    if (category && groupCats.has(category)) {
      score += 30;
      matchFactors.push('Group Activity');
    }

    // Trending momentum (20 pts): blend of launch count and viral coefficient, normalized
    const launchRatio = (t.launch_count ?? 0) / maxLaunches;
    const viralRatio = (t.analytics?.viral_coefficient ?? 0) / maxViral;
    const trendingScore = Math.round((launchRatio * 0.5 + viralRatio * 0.5) * 20);
    score += trendingScore;
    if (trendingScore >= 14) matchFactors.push('Trending Now');
    else if ((t.launch_count ?? 0) > maxLaunches * 0.5) matchFactors.push('Popular Pick');

    // Difficulty fit (10 pts): favor easier/more approachable templates when there's
    // no strong personalization signal yet (new users), otherwise flat mid score.
    const difficulty = t.difficulty_score ?? 3;
    const difficultyScore = Math.max(0, 10 - (difficulty - 1) * 2);
    score += difficultyScore;
    if (difficulty <= 2) matchFactors.push('Easy Start');

    if (t.is_featured) matchFactors.push('Featured');

    score = Math.min(100, Math.max(0, Math.round(score)));

    let reason: string;
    if (matchFactors.includes('Your History')) {
      reason = `Matches your interest in ${t.category?.name ?? 'this category'}, with ${(t.launch_count ?? 0).toLocaleString()} launches so far.`;
    } else if (matchFactors.includes('Group Activity')) {
      reason = `Your groups have been active in ${t.category?.name ?? 'this category'} lately.`;
    } else if (matchFactors.includes('Trending Now')) {
      reason = `Trending right now with strong viral momentum in ${t.category?.name ?? 'this category'}.`;
    } else {
      reason = `Popular in ${t.category?.name ?? 'this category'} with ${(t.launch_count ?? 0).toLocaleString()} launches.`;
    }

    return {
      templateId: t.id,
      score,
      reason,
      matchFactors: matchFactors.slice(0, 3).length > 0 ? matchFactors.slice(0, 3) : ['Popular Pick'],
      category: t.category?.name ?? '',
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 4);
}

export default function AIRecommendedPools({
  templates,
  userHistory,
  onUse,
}: AIRecommendedPoolsProps) {
  const recommendations = useMemo(
    () => computeRecommendations(templates, userHistory),
    [templates, userHistory]
  );

  const recommendedTemplates = recommendations
    .map((rec) => ({
      rec,
      template: templates.find((t) => t.id === rec.templateId),
    }))
    .filter((item): item is { rec: Recommendation; template: PoolTemplate } => !!item.template);

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C5CFF, #FF4D8D)' }}
          >
            <Sparkles size={13} color="#fff" />
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
            Suggested For You
          </span>
          <span
            className="text-2xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(124,92,255,0.15)', color: '#7C5CFF' }}
          >
            Personalized
          </span>
        </div>
      </div>

      {/* Insight Banner */}
      <div
        className="flex items-start gap-2.5 p-3 rounded-xl mb-3"
        style={{
          background: 'linear-gradient(135deg, rgba(124,92,255,0.08), rgba(255,77,141,0.06))',
          border: '1px solid rgba(124,92,255,0.2)',
        }}
      >
        <Sparkles size={15} style={{ color: '#7C5CFF', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: '#7C5CFF' }}>
            Picked for you
          </p>
          <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Based on your history, group activity &amp; what&apos;s trending
          </p>
        </div>
      </div>

      {/* Recommendation Cards */}
      {recommendedTemplates.length > 0 ? (
        <div className="flex flex-col gap-3">
          {recommendedTemplates.map(({ rec, template }) => (
            <AIRecommendationCard
              key={template.id}
              template={template}
              recommendation={rec}
              onUse={onUse}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Sparkles size={28} style={{ color: 'var(--muted-foreground)', margin: '0 auto 8px' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Building your recommendations
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Join more pools to unlock personalized suggestions
          </p>
        </div>
      )}
    </div>
  );
}

function AIRecommendationCard({
  template,
  recommendation,
  onUse,
}: {
  template: PoolTemplate;
  recommendation: Recommendation;
  onUse: (t: PoolTemplate) => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex gap-3 p-3">
        {/* Cover thumbnail */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          {template.cover_image ? (
            <img
              src={template.cover_image}
              alt={`${template.title} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-2xl"
              style={{ background: 'var(--elevated)' }}
            >
              {template.icon}
            </div>
          )}
          {/* Score overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-1"
            style={{ background: 'rgba(0,0,0,0.65)' }}
          >
            <span className="text-2xs font-black text-white">{recommendation.score}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--foreground)' }}>
              {template.title}
            </p>
            <ScoreBadge score={recommendation.score} />
          </div>

          {/* Reason */}
          <p className="text-2xs leading-relaxed line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
            {recommendation.reason}
          </p>

          {/* Match factors */}
          <div className="flex flex-wrap gap-1">
            {recommendation.matchFactors.slice(0, 3).map((factor) => (
              <MatchFactorPill key={factor} factor={factor} />
            ))}
          </div>
        </div>
      </div>

      {/* Stats + CTA row */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <Zap size={11} style={{ color: 'var(--primary)' }} />
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
              {template.launch_count >= 1000
                ? `${(template.launch_count / 1000).toFixed(1)}k`
                : template.launch_count}
            </span>
            <span>launches</span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <TrendingUp size={11} style={{ color: '#FF4D8D' }} />
            <span>{template.analytics?.viral_coefficient ?? '—'}x viral</span>
          </div>
        </div>
        <button
          onClick={() => onUse(template)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          Use This Pool <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}