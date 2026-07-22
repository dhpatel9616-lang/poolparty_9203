'use client';
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,  } from 'recharts';
import { Users, UserCheck, UserX, TrendingUp, Shield, Star, AlertTriangle, ChevronUp, ChevronDown,  } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


// ─── Mock Data ────────────────────────────────────────────────────────────────

const RETENTION_DATA = [
  { week: 'W1', d1: 82, d7: 64, d30: 41 },
  { week: 'W2', d1: 79, d7: 61, d30: 38 },
  { week: 'W3', d1: 85, d7: 67, d30: 44 },
  { week: 'W4', d1: 81, d7: 63, d30: 40 },
  { week: 'W5', d1: 88, d7: 70, d30: 47 },
  { week: 'W6', d1: 84, d7: 66, d30: 43 },
  { week: 'W7', d1: 87, d7: 69, d30: 46 },
  { week: 'W8', d1: 90, d7: 72, d30: 49 },
];

const SIGNUP_DATA = [
  { date: 'Apr 6', organic: 28, invite: 54, total: 82 },
  { date: 'Apr 7', organic: 31, invite: 61, total: 92 },
  { date: 'Apr 8', organic: 24, invite: 48, total: 72 },
  { date: 'Apr 9', organic: 35, invite: 70, total: 105 },
  { date: 'Apr 10', organic: 29, invite: 58, total: 87 },
  { date: 'Apr 11', organic: 42, invite: 84, total: 126 },
  { date: 'Apr 12', organic: 38, invite: 76, total: 114 },
  { date: 'Apr 13', organic: 33, invite: 66, total: 99 },
  { date: 'Apr 14', organic: 45, invite: 90, total: 135 },
];

const TRUST_DISTRIBUTION = [
  { tier: 'Platinum', count: 142, pct: 8, color: '#7C5CFF' },
  { tier: 'Gold', count: 387, pct: 22, color: '#FFC857' },
  { tier: 'Silver', count: 621, pct: 35, color: '#B8B4C8' },
  { tier: 'Bronze', count: 442, pct: 25, color: '#CD7F32' },
  { tier: 'Unranked', count: 176, pct: 10, color: '#3A3844' },
];

const RISK_USERS = [
  {
    id: 'u1',
    handle: '@jake_m',
    name: 'Jake Morrison',
    trustScore: 28,
    unpaidCount: 4,
    disputeCount: 2,
    lastActive: '3d ago',
    flag: 'Chronic Non-Payer',
    severity: 'critical',
  },
  {
    id: 'u2',
    handle: '@sara_t',
    name: 'Sara Tran',
    trustScore: 41,
    unpaidCount: 2,
    disputeCount: 3,
    lastActive: '1d ago',
    flag: 'High Dispute Rate',
    severity: 'high',
  },
  {
    id: 'u3',
    handle: '@mike_r',
    name: 'Mike Reyes',
    trustScore: 55,
    unpaidCount: 1,
    disputeCount: 1,
    lastActive: '5h ago',
    flag: 'Overdue Payment',
    severity: 'medium',
  },
  {
    id: 'u4',
    handle: '@anna_k',
    name: 'Anna Kim',
    trustScore: 62,
    unpaidCount: 1,
    disputeCount: 0,
    lastActive: '2d ago',
    flag: 'Slow Payer',
    severity: 'low',
  },
  {
    id: 'u5',
    handle: '@dev_p',
    name: 'Dev Patel',
    trustScore: 33,
    unpaidCount: 3,
    disputeCount: 1,
    lastActive: '6d ago',
    flag: 'Inactive + Unpaid',
    severity: 'high',
  },
];

const KPI_TILES = [
  {
    label: 'Total Registered Users',
    value: '1,768',
    icon: Users,
    color: '#7C5CFF',
    bg: 'rgba(124,92,255,0.12)',
    trend: '+124 this week',
    trendUp: true,
  },
  {
    label: 'Daily Active Users',
    value: '634',
    icon: UserCheck,
    color: '#00C9A7',
    bg: 'rgba(0,201,167,0.12)',
    trend: '+8.2%',
    trendUp: true,
  },
  {
    label: 'D7 Retention',
    value: '64%',
    icon: TrendingUp,
    color: '#FFC857',
    bg: 'rgba(255,200,87,0.12)',
    trend: '+3.1%',
    trendUp: true,
  },
  {
    label: 'D30 Retention',
    value: '41%',
    icon: TrendingUp,
    color: '#00E676',
    bg: 'rgba(0,230,118,0.12)',
    trend: '+1.8%',
    trendUp: true,
  },
  {
    label: 'Churned (30d)',
    value: '89',
    icon: UserX,
    color: '#FF4D8D',
    bg: 'rgba(255,77,141,0.12)',
    trend: '-12.4%',
    trendUp: true,
  },
  {
    label: 'Avg Trust Score',
    value: '71.4',
    icon: Shield,
    color: '#7C5CFF',
    bg: 'rgba(124,92,255,0.12)',
    trend: '+2.3',
    trendUp: true,
  },
  {
    label: 'Invite Conversion',
    value: '38.4%',
    icon: Star,
    color: '#00C9A7',
    bg: 'rgba(0,201,167,0.12)',
    trend: '-1.1%',
    trendUp: false,
  },
  {
    label: 'At-Risk Users',
    value: '47',
    icon: AlertTriangle,
    color: '#FF4D8D',
    bg: 'rgba(255,77,141,0.12)',
    trend: '+5 this week',
    trendUp: false,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KpiTileProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend?: string;
  trendUp?: boolean;
}

function KpiTile({ label, value, icon: Icon, color, bg, trend, trendUp }: KpiTileProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"
            style={{
              background: trendUp ? 'rgba(0,230,118,0.12)' : 'rgba(255,77,141,0.12)',
              color: trendUp ? '#00E676' : '#FF4D8D',
            }}
          >
            {trendUp ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

const SEVERITY_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: 'rgba(255,77,141,0.15)', color: '#FF4D8D', label: 'Critical' },
  high: { bg: 'rgba(255,150,50,0.15)', color: '#FF9632', label: 'High' },
  medium: { bg: 'rgba(255,200,87,0.15)', color: '#FFC857', label: 'Medium' },
  low: { bg: 'rgba(0,201,167,0.15)', color: '#00C9A7', label: 'Low' },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserIntelligence() {
  const [lastUpdated] = useState(new Date());

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Intelligence</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Retention, trust distribution, and at-risk user signals
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', color: '#00E676' }}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00E676' }} />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {KPI_TILES.map((tile) => (
          <KpiTile key={tile.label} {...tile} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Retention Chart */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">Retention by Cohort</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              D1 / D7 / D30 retention rates per weekly cohort
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={RETENTION_DATA} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,68,0.5)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }}
                formatter={(v: number, name: string) => [`${v}%`, name === 'd1' ? 'D1' : name === 'd7' ? 'D7' : 'D30']}
              />
              <Legend formatter={(v) => v === 'd1' ? 'D1' : v === 'd7' ? 'D7' : 'D30'} wrapperStyle={{ fontSize: 11, color: '#B8B4C8' }} />
              <Line type="monotone" dataKey="d1" stroke="#7C5CFF" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="d7" stroke="#00C9A7" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="d30" stroke="#FFC857" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Signup Sources Chart */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">New Signups by Source</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Organic vs invite-driven registrations (last 9 days)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={SIGNUP_DATA} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradOrganic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradInvite" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C9A7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C9A7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,68,0.5)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#B8B4C8' }} />
              <Area type="monotone" dataKey="organic" name="Organic" stroke="#7C5CFF" fill="url(#gradOrganic)" strokeWidth={2} />
              <Area type="monotone" dataKey="invite" name="Invite" stroke="#00C9A7" fill="url(#gradInvite)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trust Distribution + Risk Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trust Tier Distribution */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-base font-semibold text-foreground mb-5">Trust Tier Distribution</h2>
          <div className="space-y-4">
            {TRUST_DISTRIBUTION.map((tier) => (
              <div key={tier.tier}>
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: tier.color }} />
                    <span className="text-sm font-medium text-foreground">{tier.tier}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{tier.count.toLocaleString()}</span>
                    <span className="text-xs font-semibold" style={{ color: tier.color }}>{tier.pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--elevated)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${tier.pct}%`, background: tier.color }} />
                </div>
              </div>
            ))}
          </div>
          <div
            className="mt-5 pt-4 flex justify-between"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total Users</span>
            <span className="text-sm font-bold text-foreground">1,768</span>
          </div>
        </div>

        {/* At-Risk Users Table */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">At-Risk Users</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Users flagged for unpaid settlements, disputes, or inactivity
              </p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,77,141,0.12)', color: '#FF4D8D' }}
            >
              {RISK_USERS.length} flagged
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Trust Score', 'Unpaid', 'Disputes', 'Last Active', 'Flag', 'Severity'].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-3 pr-4 text-xs font-semibold"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RISK_USERS.map((user) => {
                  const sev = SEVERITY_CONFIG[user.severity];
                  return (
                    <tr
                      key={user.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="py-3 pr-4">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{user.name}</p>
                          <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{user.handle}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="text-sm font-bold"
                          style={{ color: user.trustScore < 40 ? '#FF4D8D' : user.trustScore < 60 ? '#FFC857' : '#00E676' }}
                        >
                          {user.trustScore}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm font-semibold text-foreground">{user.unpaidCount}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm font-semibold text-foreground">{user.disputeCount}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{user.lastActive}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs font-medium text-foreground">{user.flag}</span>
                      </td>
                      <td className="py-3">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: sev.bg, color: sev.color }}
                        >
                          {sev.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
