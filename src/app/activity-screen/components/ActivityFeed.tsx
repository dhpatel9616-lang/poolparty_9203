'use client';
import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, CreditCard, AlertTriangle, Bell, Plus, UserCheck, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useActivitiesRealtime } from '@/lib/supabase/realtime';

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  contract_created: { icon: Plus, color: '#7C5CFF', bg: 'rgba(124,92,255,0.12)' },
  contract_joined: { icon: UserCheck, color: '#7C5CFF', bg: 'rgba(124,92,255,0.12)' },
  entry_placed: { icon: UserCheck, color: '#00C9A7', bg: 'rgba(0,201,167,0.12)' },
  contract_locked: { icon: Trophy, color: '#FFC857', bg: 'rgba(255,200,87,0.12)' },
  contract_resolved: { icon: Trophy, color: '#FFC857', bg: 'rgba(255,200,87,0.12)' },
  payment_marked: { icon: CreditCard, color: '#00E676', bg: 'rgba(0,230,118,0.12)' },
  payment_confirmed: { icon: CreditCard, color: '#00E676', bg: 'rgba(0,230,118,0.12)' },
  nudge_sent: { icon: Bell, color: '#FFC857', bg: 'rgba(255,200,87,0.12)' },
  badge_earned: { icon: Sparkles, color: '#FF4D8D', bg: 'rgba(255,77,141,0.12)' },
  dispute_opened: { icon: AlertTriangle, color: '#FF4D8D', bg: 'rgba(255,77,141,0.12)' },
  dispute_resolved: { icon: AlertTriangle, color: '#00E676', bg: 'rgba(0,230,118,0.12)' },
  group_created: { icon: Plus, color: '#7C5CFF', bg: 'rgba(124,92,255,0.12)' },
  group_joined: { icon: UserCheck, color: '#7C5CFF', bg: 'rgba(124,92,255,0.12)' },
  invite_received: { icon: Bell, color: '#FF4D8D', bg: 'rgba(255,77,141,0.12)' },
  pool_created: { icon: Plus, color: '#7C5CFF', bg: 'rgba(124,92,255,0.12)' },
  pool_joined: { icon: UserCheck, color: '#00C9A7', bg: 'rgba(0,201,167,0.12)' },
  pool_resolved: { icon: Trophy, color: '#FFC857', bg: 'rgba(255,200,87,0.12)' },
};

function getRoute(event: any): string {
  const type = event.activity_type || event.type;
  if (['contract_created', 'contract_joined', 'entry_placed', 'contract_locked', 'contract_resolved', 'pool_created', 'pool_joined', 'pool_resolved'].includes(type)) {
    return event.pool_id ? `/contract-detail-screen?id=${event.pool_id}` : '/activity-screen';
  }
  if (['payment_marked', 'payment_confirmed', 'nudge_sent'].includes(type)) {
    return '/settlement';
  }
  if (['dispute_opened', 'dispute_resolved'].includes(type)) {
    return `/dispute-center`;
  }
  if (type === 'badge_earned') return '/profile-screen';
  if (['group_created', 'group_joined'].includes(type)) return '/groups-screen';
  if (type === 'invite_received') return '/home-screen';
  return '/activity-screen';
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getActivityLabel(event: any): { actor: string; description: string; group?: string } {
  const meta = event.metadata || {};
  const type = event.activity_type || event.type;
  return {
    actor: meta.actor_name || meta.user_name || 'Someone',
    description: meta.description || meta.message || type?.replace(/_/g, ' ') || 'performed an action',
    group: meta.group_name,
  };
}

export default function ActivityFeed() {
  const router = useRouter();
  const { activities, loading, error } = useActivitiesRealtime(50);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const handleTap = (eventId: string, route: string) => {
    setReadIds((prev) => new Set([...prev, eventId]));
    router.push(route);
  };

  if (loading) {
    return (
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-foreground">Activity</h1>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-3 animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: 72 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">Activity</h1>
        <span
          className="pill-badge text-xs"
          style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}
        >
          {activities.length} events
        </span>
      </div>

      {/* Smart suggestion */}
      <div
        className="rounded-xl p-4 mb-4 flex items-start gap-3"
        style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.2)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,92,255,0.15)' }}
        >
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--primary)' }}>
            Smart Insight
          </p>
          <p className="text-sm text-foreground leading-snug">
            Stay on top of your pools — check for any pending payments or unresolved disputes.
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-semibold text-foreground">No activity yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Activity will appear here as you use PoolParty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((event) => {
            const type = event.activity_type || (event as any).type || 'pool_created';
            const config = EVENT_CONFIG[type] || EVENT_CONFIG.contract_created;
            const IconComp = config.icon;
            const isRead = readIds.has(event.id);
            const route = getRoute(event);
            const { actor, description, group } = getActivityLabel(event);

            return (
              <button
                key={event.id}
                onClick={() => handleTap(event.id, route)}
                className="w-full text-left rounded-xl p-3 flex items-start gap-3 transition-all active:scale-[0.98] card-interactive"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderLeft: isRead ? '1px solid var(--border)' : '3px solid var(--primary)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: config.bg }}
                >
                  <IconComp size={16} style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-foreground">{actor} </span>
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {description}
                      </span>
                    </div>
                    <span className="text-2xs flex-shrink-0 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {timeAgo(event.created_at)}
                    </span>
                  </div>
                  {group && (
                    <span
                      className="pill-badge text-2xs mt-1.5 inline-block"
                      style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)' }}
                    >
                      {group}
                    </span>
                  )}
                </div>
                <ChevronRight size={14} className="flex-shrink-0 mt-1" style={{ color: 'var(--muted-foreground)' }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}