'use client';
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Funnel, AreaChart, Area, Cell,  } from 'recharts';
import { Share2, Users, TrendingUp, GitBranch, Zap, ArrowRight } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


// ─── Mock Data ────────────────────────────────────────────────────────────────

const VIRAL_FUNNEL = [
  { name: 'Invites Sent', value: 4820, fill: '#7C5CFF' },
  { name: 'Link Opened', value: 3104, fill: '#9B7FFF' },
  { name: 'Signed Up', value: 1847, fill: '#B8A3FF' },
  { name: 'Joined Group', value: 1203, fill: '#D4C8FF' },
  { name: 'Placed Entry', value: 741, fill: '#EDE8FF' },
];

const GROUP_SIZE_DIST = [
  { size: '2–4', count: 312 },
  { size: '5–8', count: 487 },
  { size: '9–16', count: 234 },
  { size: '17–32', count: 89 },
  { size: '33+', count: 21 },
];

const MOST_ACTIVE_GROUPS = [
  { name: 'Sunday Ballers', members: 24, invitesSent: 142, poolsCreated: 18, viralScore: 9.2 },
  { name: 'Office Picks', members: 16, invitesSent: 98, poolsCreated: 14, viralScore: 8.7 },
  { name: 'Fantasy Kings', members: 31, invitesSent: 187, poolsCreated: 22, viralScore: 8.4 },
  { name: 'Bracket Bros', members: 12, invitesSent: 74, poolsCreated: 9, viralScore: 7.9 },
  { name: 'Trivia Night', members: 8, invitesSent: 51, poolsCreated: 11, viralScore: 7.1 },
  { name: 'March Madness', members: 19, invitesSent: 63, poolsCreated: 7, viralScore: 6.8 },
];

function generateInviteVolume() {
  const data = [];
  const now = new Date();
  let base = 140;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    base = Math.max(60, Math.min(320, base + Math.floor((Math.random() - 0.42) * 40)));
    data.push({ date: label, sent: base, accepted: Math.floor(base * (0.55 + Math.random() * 0.2)) });
  }
  return data;
}

const INVITE_VOLUME = generateInviteVolume();

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

interface KpiProps { label: string; value: string | number; icon: React.ElementType; color: string; bg: string; sub?: string; }
function KpiTile({ label, value, icon: Icon, color, bg, sub }: KpiProps) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
        {sub && <p className="text-xs mt-1 font-medium" style={{ color }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Custom Funnel Step ───────────────────────────────────────────────────────

function FunnelStep({ name, value, pct, color, isLast }: { name: string; value: number; pct: number; color: string; isLast: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{name}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{pct}%</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{value.toLocaleString()}</span>
        </div>
      </div>
      <div className="h-8 rounded-lg overflow-hidden" style={{ background: 'var(--elevated)' }}>
        <div className="h-full rounded-lg transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      {!isLast && (
        <div className="flex justify-center my-1">
          <ArrowRight size={14} style={{ color: 'var(--muted-foreground)' }} />
        </div>
      )}
    </div>
  );
}

// ─── Social Graph Module ──────────────────────────────────────────────────────

export default function SocialGraph() {
  const maxFunnel = VIRAL_FUNNEL[0].value;

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Total Invites Sent" value="4,820" icon={Share2} color="#7C5CFF" bg="rgba(124,92,255,0.12)" sub="↑ 14.2% vs last month" />
        <KpiTile label="Invite Acceptance Rate" value="38.4%" icon={TrendingUp} color="#00C9A7" bg="rgba(0,201,167,0.12)" sub="↑ 2.1 pts" />
        <KpiTile label="Viral Coefficient" value="1.34" icon={GitBranch} color="#FFC857" bg="rgba(255,200,87,0.12)" sub="Above 1.0 = organic growth" />
        <KpiTile label="Active Groups" value="1,143" icon={Users} color="#FF4D8D" bg="rgba(255,77,141,0.12)" sub="↑ 87 new this week" />
      </div>

      {/* Viral Funnel + Invite Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viral Funnel */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-5" style={{ color: 'var(--foreground)' }}>Viral Funnel</h3>
          <div className="space-y-2">
            {VIRAL_FUNNEL.map((step, i) => (
              <FunnelStep
                key={step.name}
                name={step.name}
                value={step.value}
                pct={Math.round((step.value / maxFunnel) * 100)}
                color={step.fill}
                isLast={i === VIRAL_FUNNEL.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Invite Volume Chart */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-5" style={{ color: 'var(--foreground)' }}>Invite Volume — 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={INVITE_VOLUME} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="acceptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C9A7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C9A7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,68,0.5)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
              <YAxis tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }} />
              <Area type="monotone" dataKey="sent" stroke="#7C5CFF" strokeWidth={2} fill="url(#sentGrad)" name="Sent" />
              <Area type="monotone" dataKey="accepted" stroke="#00C9A7" strokeWidth={2} fill="url(#acceptGrad)" name="Accepted" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full" style={{ background: '#7C5CFF' }} /><span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Sent</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full" style={{ background: '#00C9A7' }} /><span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Accepted</span></div>
          </div>
        </div>
      </div>

      {/* Group Size Distribution + Most Active Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Group Size Distribution */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-5" style={{ color: 'var(--foreground)' }}>Group Size Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={GROUP_SIZE_DIST} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,68,0.5)" vertical={false} />
              <XAxis dataKey="size" tick={{ fill: '#B8B4C8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }} />
              <Bar dataKey="count" name="Groups" radius={[6, 6, 0, 0]}>
                {GROUP_SIZE_DIST.map((_, i) => (
                  <Cell key={i} fill={`rgba(124,92,255,${0.4 + i * 0.12})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Most Active Groups */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Most Active Groups</h3>
          <div className="space-y-3">
            {MOST_ACTIVE_GROUPS.map((g, i) => (
              <div key={g.name} className="flex items-center gap-3 py-2" style={{ borderBottom: i < MOST_ACTIVE_GROUPS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--muted-foreground)' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{g.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{g.members} members · {g.poolsCreated} pools</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: '#FFC857' }}>{g.invitesSent} invites</p>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <Zap size={10} style={{ color: '#7C5CFF' }} />
                    <span className="text-xs font-bold" style={{ color: '#7C5CFF' }}>{g.viralScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
