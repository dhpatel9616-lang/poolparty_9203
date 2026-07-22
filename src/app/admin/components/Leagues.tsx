'use client';
import React, { useState } from 'react';
import { Trophy, Users, TrendingUp, Shield, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface League {
  id: string;
  name: string;
  category: string;
  members: number;
  activePools: number;
  totalPools: number;
  avgTrustScore: number;
  settlementRate: number;
  topPlayer: string;
  status: 'active' | 'seasonal' | 'archived';
  prizeNote: string;
}

const LEAGUES: League[] = [
  { id: '1', name: 'PoolParty Premier', category: 'All Sports', members: 2847, activePools: 34, totalPools: 187, avgTrustScore: 742, settlementRate: 96.2, topPlayer: 'JordanK', status: 'active', prizeNote: 'Bragging rights + trust badge' },
  { id: '2', name: 'NFL Season League', category: 'Football', members: 1203, activePools: 18, totalPools: 94, avgTrustScore: 718, settlementRate: 94.1, topPlayer: 'TDking88', status: 'active', prizeNote: 'Season trophy badge' },
  { id: '3', name: 'March Madness 2026', category: 'Basketball', members: 4102, activePools: 0, totalPools: 63, avgTrustScore: 689, settlementRate: 91.8, topPlayer: 'BracketGod', status: 'seasonal', prizeNote: 'Ended — winner: BracketGod' },
  { id: '4', name: 'Entertainment Picks', category: 'TV & Film', members: 891, activePools: 12, totalPools: 48, avgTrustScore: 703, settlementRate: 93.4, topPlayer: 'ShowBizPro', status: 'active', prizeNote: 'Monthly leaderboard reset' },
  { id: '5', name: 'World Cup 2026', category: 'Soccer', members: 3418, activePools: 27, totalPools: 112, avgTrustScore: 731, settlementRate: 95.0, topPlayer: 'GoalMachine', status: 'active', prizeNote: 'Tournament badge + trust boost' },
  { id: '6', name: 'Super Bowl LX', category: 'Football', members: 5821, activePools: 0, totalPools: 241, avgTrustScore: 756, settlementRate: 97.3, topPlayer: 'ChampPicker', status: 'archived', prizeNote: 'Archived — Feb 2026' },
];

const LEADERBOARD = [
  { rank: 1, name: 'ChampPicker', wins: 47, accuracy: 78.4, trustScore: 891, badge: '🏆' },
  { rank: 2, name: 'BracketGod', wins: 43, accuracy: 74.1, trustScore: 867, badge: '🥈' },
  { rank: 3, name: 'GoalMachine', wins: 39, accuracy: 71.8, trustScore: 843, badge: '🥉' },
  { rank: 4, name: 'JordanK', wins: 36, accuracy: 69.2, trustScore: 821, badge: '⭐' },
  { rank: 5, name: 'TDking88', wins: 34, accuracy: 67.5, trustScore: 808, badge: '⭐' },
  { rank: 6, name: 'ShowBizPro', wins: 31, accuracy: 65.9, trustScore: 794, badge: '⭐' },
  { rank: 7, name: 'PredictorX', wins: 28, accuracy: 63.4, trustScore: 779, badge: '' },
  { rank: 8, name: 'LuckyDraw', wins: 25, accuracy: 61.2, trustScore: 762, badge: '' },
];

const CATEGORY_ACTIVITY = [
  { category: 'Football', pools: 335 },
  { category: 'Basketball', pools: 251 },
  { category: 'Soccer', pools: 112 },
  { category: 'TV & Film', pools: 48 },
  { category: 'Other', pools: 37 },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function LeagueStatusPill({ status }: { status: League['status'] }) {
  const map = {
    active: { label: 'Active', bg: 'rgba(0,230,118,0.15)', color: '#00E676' },
    seasonal: { label: 'Seasonal', bg: 'rgba(255,200,87,0.15)', color: '#FFC857' },
    archived: { label: 'Archived', bg: 'rgba(184,180,200,0.15)', color: '#B8B4C8' },
  };
  const s = map[status];
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}

// ─── Leagues Module ───────────────────────────────────────────────────────────

export default function Leagues() {
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);

  const totalMembers = LEAGUES.reduce((s, l) => s + l.members, 0);
  const activePools = LEAGUES.reduce((s, l) => s + l.activePools, 0);
  const avgSettlement = (LEAGUES.reduce((s, l) => s + l.settlementRate, 0) / LEAGUES.length).toFixed(1);

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leagues', value: LEAGUES.length, icon: Trophy, color: '#FFC857', bg: 'rgba(255,200,87,0.12)' },
          { label: 'League Members', value: totalMembers.toLocaleString(), icon: Users, color: '#7C5CFF', bg: 'rgba(124,92,255,0.12)' },
          { label: 'Active League Pools', value: activePools, icon: TrendingUp, color: '#00C9A7', bg: 'rgba(0,201,167,0.12)' },
          { label: 'Avg Settlement Rate', value: `${avgSettlement}%`, icon: Shield, color: '#FF4D8D', bg: 'rgba(255,77,141,0.12)' },
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

      {/* League Table + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* League Table */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-5" style={{ color: 'var(--foreground)' }}>All Leagues</h3>
          <div className="space-y-2">
            {LEAGUES.map(league => (
              <div key={league.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <button
                  className="w-full flex items-center gap-3 p-4 text-left transition-colors"
                  style={{ background: 'var(--elevated)' }}
                  onClick={() => setExpandedLeague(expandedLeague === league.id ? null : league.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{league.name}</p>
                      <LeagueStatusPill status={league.status} />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{league.category} · {league.members.toLocaleString()} members</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-semibold" style={{ color: '#00C9A7' }}>{league.settlementRate}%</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>settlement</p>
                    </div>
                    {expandedLeague === league.id ? <ChevronUp size={16} style={{ color: 'var(--muted-foreground)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted-foreground)' }} />}
                  </div>
                </button>
                {expandedLeague === league.id && (
                  <div className="px-4 pb-4 pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ background: 'var(--surface)' }}>
                    {[
                      { label: 'Active Pools', value: league.activePools },
                      { label: 'Total Pools', value: league.totalPools },
                      { label: 'Avg Trust Score', value: league.avgTrustScore },
                      { label: 'Top Player', value: league.topPlayer },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg p-3" style={{ background: 'var(--elevated)' }}>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>{s.value}</p>
                      </div>
                    ))}
                    <div className="col-span-2 sm:col-span-4 rounded-lg p-3" style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.2)' }}>
                      <p className="text-xs" style={{ color: '#7C5CFF' }}>🏆 {league.prizeNote}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Global Leaderboard */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Award size={16} style={{ color: '#FFC857' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Global Leaderboard</h3>
          </div>
          <div className="space-y-2">
            {LEADERBOARD.map(player => (
              <div key={player.rank} className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ background: player.rank <= 3 ? 'rgba(255,200,87,0.06)' : 'var(--elevated)', border: `1px solid ${player.rank <= 3 ? 'rgba(255,200,87,0.2)' : 'var(--border)'}` }}>
                <span className="text-base w-6 text-center">{player.badge || `#${player.rank}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{player.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{player.wins} wins · {player.accuracy}% acc</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: '#7C5CFF' }}>{player.trustScore}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>trust</p>
                </div>
              </div>
            ))}
          </div>

          {/* Category Activity */}
          <div className="mt-6">
            <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>POOLS BY CATEGORY</h4>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={CATEGORY_ACTIVITY} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }} />
                <Bar dataKey="pools" radius={[0, 6, 6, 0]}>
                  {CATEGORY_ACTIVITY.map((_, i) => (
                    <Cell key={i} fill={`rgba(124,92,255,${0.5 + i * 0.1})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
