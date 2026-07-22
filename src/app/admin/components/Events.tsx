'use client';
import React, { useState } from 'react';
import { Calendar, ExternalLink, Zap, RefreshCw, MapPin, Users, Clock, Link2 } from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface ExternalEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  linkedPools: number;
  participants: number;
  status: 'upcoming' | 'live' | 'ended';
  sourceUrl: string;
}

const EXTERNAL_EVENTS: ExternalEvent[] = [
  { id: '1', title: 'NBA Finals Game 7', category: 'Sports', date: 'Jun 22, 2026 · 8:30 PM ET', location: 'TD Garden, Boston', linkedPools: 47, participants: 312, status: 'upcoming', sourceUrl: 'https://nba.com' },
  { id: '2', title: 'UFC 310 — Main Card', category: 'Sports', date: 'Jun 14, 2026 · 10:00 PM ET', location: 'T-Mobile Arena, Las Vegas', linkedPools: 23, participants: 187, status: 'upcoming', sourceUrl: 'https://ufc.com' },
  { id: '3', title: 'The Bachelorette S29 Finale', category: 'Entertainment', date: 'Jun 10, 2026 · 9:00 PM ET', location: 'ABC Network', linkedPools: 18, participants: 143, status: 'live', sourceUrl: 'https://abc.com' },
  { id: '4', title: 'World Cup Qualifier — USA vs Mexico', category: 'Sports', date: 'Jun 8, 2026 · 7:00 PM ET', location: 'Estadio Azteca, Mexico City', linkedPools: 61, participants: 489, status: 'live', sourceUrl: 'https://fifa.com' },
  { id: '5', title: 'Oscars 2026 Ceremony', category: 'Entertainment', date: 'Mar 29, 2026 · 8:00 PM ET', location: 'Dolby Theatre, Hollywood', linkedPools: 34, participants: 271, status: 'ended', sourceUrl: 'https://oscars.org' },
  { id: '6', title: 'Super Bowl LX', category: 'Sports', date: 'Feb 8, 2026 · 6:30 PM ET', location: 'Allegiant Stadium, Las Vegas', linkedPools: 128, participants: 1042, status: 'ended', sourceUrl: 'https://nfl.com' },
];

interface LiveUpdate {
  id: string;
  eventTitle: string;
  message: string;
  time: string;
  type: 'score' | 'result' | 'alert' | 'pool';
}

const LIVE_UPDATES: LiveUpdate[] = [
  { id: '1', eventTitle: 'World Cup Qualifier', message: 'USA scores in 34th minute — 1-0', time: '2m ago', type: 'score' },
  { id: '2', eventTitle: 'The Bachelorette S29', message: 'Final rose given — pools resolving', time: '8m ago', type: 'result' },
  { id: '3', eventTitle: 'World Cup Qualifier', message: 'Mexico equalizes — 1-1', time: '12m ago', type: 'score' },
  { id: '4', eventTitle: 'NBA Finals Game 7', message: 'New pool created: "Who scores first?"', time: '18m ago', type: 'pool' },
  { id: '5', eventTitle: 'UFC 310', message: 'Odds shift detected — 14 pools affected', time: '31m ago', type: 'alert' },
  { id: '6', eventTitle: 'World Cup Qualifier', message: 'USA red card — 10 men', time: '44m ago', type: 'alert' },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ExternalEvent['status'] }) {
  const map = {
    upcoming: { label: 'Upcoming', bg: 'rgba(124,92,255,0.15)', color: '#7C5CFF' },
    live: { label: '● Live', bg: 'rgba(0,230,118,0.15)', color: '#00E676' },
    ended: { label: 'Ended', bg: 'rgba(184,180,200,0.15)', color: '#B8B4C8' },
  };
  const s = map[status];
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function UpdateTypePill({ type }: { type: LiveUpdate['type'] }) {
  const map = {
    score: { label: 'Score', color: '#00C9A7' },
    result: { label: 'Result', color: '#7C5CFF' },
    alert: { label: 'Alert', color: '#FFC857' },
    pool: { label: 'Pool', color: '#FF4D8D' },
  };
  const t = map[type];
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: `${t.color}20`, color: t.color }}>
      {t.label}
    </span>
  );
}

// ─── Events Module ────────────────────────────────────────────────────────────

export default function Events() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'ended'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = filter === 'all' ? EXTERNAL_EVENTS : EXTERNAL_EVENTS.filter(e => e.status === filter);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const liveCount = EXTERNAL_EVENTS.filter(e => e.status === 'live').length;
  const totalPools = EXTERNAL_EVENTS.reduce((s, e) => s + e.linkedPools, 0);
  const totalParticipants = EXTERNAL_EVENTS.reduce((s, e) => s + e.participants, 0);

  return (
    <div className="space-y-8">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events Tracked', value: EXTERNAL_EVENTS.length, icon: Calendar, color: '#7C5CFF', bg: 'rgba(124,92,255,0.12)' },
          { label: 'Live Right Now', value: liveCount, icon: Zap, color: '#00E676', bg: 'rgba(0,230,118,0.12)' },
          { label: 'Event-Linked Pools', value: totalPools, icon: Link2, color: '#FFC857', bg: 'rgba(255,200,87,0.12)' },
          { label: 'Total Participants', value: totalParticipants.toLocaleString(), icon: Users, color: '#FF4D8D', bg: 'rgba(255,77,141,0.12)' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
              <k.icon size={20} style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* External Events List + Live Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>External Events</h3>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--elevated)' }}>
              {(['all', 'live', 'upcoming', 'ended'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all"
                  style={{
                    background: filter === f ? 'var(--primary)' : 'transparent',
                    color: filter === f ? '#fff' : 'var(--muted-foreground)',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filtered.map(event => (
              <div key={event.id} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{event.title}</p>
                      <StatusPill status={event.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        <Clock size={11} />{event.date}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        <MapPin size={11} />{event.location}
                      </span>
                    </div>
                  </div>
                  <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--muted-foreground)' }}>
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="flex items-center gap-4 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(124,92,255,0.12)', color: '#7C5CFF' }}>{event.category}</span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <Link2 size={11} /><strong style={{ color: 'var(--foreground)' }}>{event.linkedPools}</strong> pools
                  </span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <Users size={11} /><strong style={{ color: 'var(--foreground)' }}>{event.participants}</strong> participants
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Updates */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00E676' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Live Updates</h3>
            </div>
            <button onClick={handleRefresh} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--muted-foreground)' }}>
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="space-y-3">
            {LIVE_UPDATES.map(update => (
              <div key={update.id} className="rounded-xl p-3" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-1">
                  <UpdateTypePill type={update.type} />
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{update.time}</span>
                </div>
                <p className="text-xs font-medium mt-1" style={{ color: 'var(--muted-foreground)' }}>{update.eventTitle}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--foreground)' }}>{update.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
