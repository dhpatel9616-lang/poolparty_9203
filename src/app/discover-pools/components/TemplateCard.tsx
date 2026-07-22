'use client';
import React from 'react';
import { BadgeCheck, Flame, TrendingUp, Users, Zap } from 'lucide-react';
import type { PoolTemplate } from '../page';

interface TemplateCardProps {
  template: PoolTemplate;
  onUse: (t: PoolTemplate) => void;
  compact?: boolean;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const DIFFICULTY_LABELS = ['', 'Easy', 'Easy', 'Medium', 'Hard', 'Expert'];

export default function TemplateCard({ template, onUse, compact }: TemplateCardProps) {
  if (compact) {
    return (
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Cover */}
        <div className="relative h-24 overflow-hidden">
          {template.cover_image ? (
            <img
              src={template.cover_image}
              alt={`${template.title} pool template cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-3xl"
              style={{ background: 'var(--elevated)' }}
            >
              {template.icon}
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
          <div className="absolute top-2 left-2 flex gap-1">
            {template.is_official && (
              <span className="flex items-center gap-0.5 text-2xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(124,92,255,0.9)', color: '#fff' }}>
                <BadgeCheck size={9} /> Official
              </span>
            )}
            {template.is_featured && (
              <span className="text-2xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(255,215,0,0.9)', color: '#000' }}>
                ⭐
              </span>
            )}
          </div>
          <div className="absolute bottom-1.5 left-2 right-2">
            <p className="text-xs font-bold text-white truncate">{template.title}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-2.5 flex flex-col gap-2 flex-1">
          {template.category && (
            <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
              {template.category.icon} {template.category.name}
            </span>
          )}
          <div className="flex items-center gap-2 text-2xs" style={{ color: 'var(--muted-foreground)' }}>
            <span className="flex items-center gap-0.5">
              <Zap size={9} /> {formatCount(template.launch_count)}
            </span>
            <span className="flex items-center gap-0.5">
              <Users size={9} /> {formatCount(template.participant_count)}
            </span>
          </div>
          <button
            onClick={() => onUse(template)}
            className="w-full py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            Use This Pool
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Cover */}
      <div className="relative h-36 overflow-hidden">
        {template.cover_image ? (
          <img
            src={template.cover_image}
            alt={`${template.title} pool template cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: 'var(--elevated)' }}
          >
            {template.icon}
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {template.is_official && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(124,92,255,0.9)', color: '#fff' }}>
              <BadgeCheck size={11} /> Official
            </span>
          )}
          {template.is_featured && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(255,215,0,0.9)', color: '#000' }}>
              ⭐ Featured
            </span>
          )}
          {template.analytics && template.analytics.viral_coefficient >= 2.0 && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(255,77,141,0.9)', color: '#fff' }}>
              <TrendingUp size={11} /> Trending
            </span>
          )}
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5">
          <p className="text-sm font-black text-white leading-tight">{template.title}</p>
          {template.subtitle && (
            <p className="text-xs text-white/80 mt-0.5 line-clamp-1">{template.subtitle}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2.5">
        {/* Category + Difficulty */}
        <div className="flex items-center justify-between">
          {template.category && (
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {template.category.icon} {template.category.name}
            </span>
          )}
          <span
            className="text-2xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)' }}
          >
            {DIFFICULTY_LABELS[template.difficulty_score] || 'Medium'}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <Zap size={12} style={{ color: 'var(--primary)' }} />
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{formatCount(template.launch_count)}</span>
            <span>launches</span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <Users size={12} style={{ color: '#00C9A7' }} />
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{formatCount(template.participant_count)}</span>
            <span>players</span>
          </div>
        </div>

        {/* Verified Source */}
        {template.resolution_source && (
          <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
            style={{ background: 'rgba(0,200,83,0.1)', color: '#00C853' }}>
            <BadgeCheck size={11} />
            <span className="font-medium">Verified: {template.resolution_source.name}</span>
          </div>
        )}

        {/* Viral coefficient */}
        {template.analytics && template.analytics.viral_coefficient >= 1.8 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <Flame size={11} color="#FF6B35" />
            <span>{template.analytics.viral_coefficient}x viral coefficient</span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => onUse(template)}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 mt-0.5"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          Use This Pool
        </button>
      </div>
    </div>
  );
}
