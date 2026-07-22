'use client';
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,  } from 'recharts';
import {
  Layers,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  BarChart2,
  Zap,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


// ─── Mock Data ────────────────────────────────────────────────────────────────

const POOL_CREATION_DATA = [
  { date: 'Apr 6', pools: 18, entries: 142 },
  { date: 'Apr 7', pools: 22, entries: 176 },
  { date: 'Apr 8', pools: 15, entries: 120 },
  { date: 'Apr 9', pools: 28, entries: 224 },
  { date: 'Apr 10', pools: 24, entries: 192 },
  { date: 'Apr 11', pools: 35, entries: 280 },
  { date: 'Apr 12', pools: 31, entries: 248 },
  { date: 'Apr 13', pools: 27, entries: 216 },
  { date: 'Apr 14', pools: 38, entries: 304 },
];

const CATEGORY_DATA = [
  { name: 'Sports', value: 38, color: '#7C5CFF' },
  { name: 'Entertainment', value: 24, color: '#00C9A7' },
  { name: 'Friends', value: 19, color: '#FFC857' },
  { name: 'Work', value: 11, color: '#FF4D8D' },
  { name: 'Other', value: 8, color: '#B8B4C8' },
];

const POOL_FUNNEL = [
  { stage: 'Created', count: 187, color: '#7C5CFF' },
  { stage: 'Has Entries', count: 164, color: '#00C9A7' },
  { stage: 'Locked', count: 121, color: '#FFC857' },
  { stage: 'Resolved', count: 98, color: '#00E676' },
  { stage: 'Settled', count: 89, color: '#FF4D8D' },
];

const STALE_POOLS = [
  {
    id: 'p1',
    title: 'NBA Finals Game 7 Winner',
    group: 'Hoops Squad',
    status: 'open',
    entries: 6,
    maxEntries: 12,
    createdDaysAgo: 14,
    flag: 'No entries in 7d',
    severity: 'high',
  },
  {
    id: 'p2',
    title: 'Oscars Best Picture 2025',
    group: 'Movie Buffs',
    status: 'locked',
    entries: 8,
    maxEntries: 8,
    createdDaysAgo: 21,
    flag: 'Overdue resolution',
    severity: 'critical',
  },
  {
    id: 'p3',
    title: 'World Cup Group Stage',
    group: 'Soccer Fans',
    status: 'open',
    entries: 3,
    maxEntries: 16,
    createdDaysAgo: 9,
    flag: 'Low participation',
    severity: 'medium',
  },
  {
    id: 'p4',
    title: 'Super Bowl MVP',
    group: 'NFL Crew',
    status: 'locked',
    entries: 10,
    maxEntries: 10,
    createdDaysAgo: 18,
    flag: 'Pending resolution 5d',
    severity: 'high',
  },
  {
    id: 'p5',
    title: 'March Madness Champion',
    group: 'College Hoops',
    status: 'open',
    entries: 2,
    maxEntries: 8,
    createdDaysAgo: 6,
    flag: 'Low participation',
    severity: 'low',
  },
];

const KPI_TILES = [
  {
    label: 'Pools Created (7d)',
    value: '187',
    icon: Layers,
    color: '#7C5CFF',
    bg: 'rgba(124,92,255,0.12)',
    trend: '+12.4%',
    trendUp: true,
  },
  {
    label: 'Entries Placed (7d)',
    value: '1,423',
    icon: Zap,
    color: '#00C9A7',
    bg: 'rgba(0,201,167,0.12)',
    trend: '+3.7%',
    trendUp: true,
  },
  {
    label: 'Avg Pool Size',
    value: '8.3',
    icon: Users,
    color: '#FFC857',
    bg: 'rgba(255,200,87,0.12)',
    trend: '+0.6',
    trendUp: true,
  },
  {
    label: 'Resolution Rate',
    value: '52.4%',
    icon: CheckCircle,
    color: '#00E676',
    bg: 'rgba(0,230,118,0.12)',
    trend: '+4.1%',
    trendUp: true,
  },
  {
    label: 'Stale Pools',
    value: '23',
    icon: Clock,
    color: '#FF4D8D',
    bg: 'rgba(255,77,141,0.12)',
    trend: '+3 this week',
    trendUp: false,
  },
  {
    label: 'Cancelled Pools',
    value: '11',
    icon: XCircle,
    color: '#FF9632',
    bg: 'rgba(255,150,50,0.12)',
    trend: '-2 vs last week',
    trendUp: true,
  },
  {
    label: 'Avg Entries/Pool',
    value: '7.6',
    icon: BarChart2,
    color: '#7C5CFF',
    bg: 'rgba(124,92,255,0.12)',
    trend: '+0.4',
    trendUp: true,
  },
  {
    label: 'Tracked Stake Volume',
    value: '$48.2K',
    icon: TrendingUp,
    color: '#00C9A7',
    bg: 'rgba(0,201,167,0.12)',
    trend: '+18.9%',
    trendUp: true,
  },
];

const SEVERITY_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: 'rgba(255,77,141,0.15)', color: '#FF4D8D', label: 'Critical' },
  high: { bg: 'rgba(255,150,50,0.15)', color: '#FF9632', label: 'High' },
  medium: { bg: 'rgba(255,200,87,0.15)', color: '#FFC857', label: 'Medium' },
  low: { bg: 'rgba(0,201,167,0.15)', color: '#00C9A7', label: 'Low' },
};

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  open: { bg: 'rgba(0,230,118,0.12)', color: '#00E676' },
  locked: { bg: 'rgba(255,200,87,0.12)', color: '#FFC857' },
  resolved: { bg: 'rgba(124,92,255,0.12)', color: '#7C5CFF' },
};

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PoolIntelligence() {
  const [lastUpdated] = useState(new Date());

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pool Intelligence</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Pool creation trends, category breakdown, and stale pool alerts
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pool Creation + Entries Chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">Pool Creation & Entries</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Daily pools created vs entries placed (last 9 days)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={POOL_CREATION_DATA} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,68,0.5)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#B8B4C8' }} />
              <Bar dataKey="pools" name="Pools" fill="#7C5CFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="entries" name="Entries" fill="#00C9A7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">Pool Categories</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Distribution by category
            </p>
          </div>
          <div className="flex justify-center mb-4">
            <PieChart width={160} height={160}>
              <Pie
                data={CATEGORY_DATA}
                cx={75}
                cy={75}
                innerRadius={45}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
              >
                {CATEGORY_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }}
                formatter={(v: number) => [`${v}%`, '']}
              />
            </PieChart>
          </div>
          <div className="space-y-2">
            {CATEGORY_DATA.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                  <span className="text-xs text-foreground">{cat.name}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: cat.color }}>{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pool Funnel + Stale Pools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pool Lifecycle Funnel */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-base font-semibold text-foreground mb-5">Pool Lifecycle Funnel</h2>
          <div className="space-y-3">
            {POOL_FUNNEL.map((stage, i) => {
              const pct = Math.round((stage.count / POOL_FUNNEL[0].count) * 100);
              return (
                <div key={stage.stage}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{stage.count}</span>
                      <span className="text-xs font-semibold" style={{ color: stage.color }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--elevated)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: stage.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className="mt-5 pt-4 text-xs"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          >
            Settlement conversion: <span className="font-semibold text-foreground">47.6%</span> of created pools
          </div>
        </div>

        {/* Stale / At-Risk Pools Table */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">Stale & At-Risk Pools</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Pools flagged for low participation, overdue resolution, or inactivity
              </p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(255,77,141,0.12)', color: '#FF4D8D' }}
            >
              <AlertTriangle size={11} />
              {STALE_POOLS.length} flagged
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Pool', 'Group', 'Status', 'Entries', 'Age', 'Flag', 'Severity'].map((h) => (
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
                {STALE_POOLS.map((pool) => {
                  const sev = SEVERITY_CONFIG[pool.severity];
                  const st = STATUS_CONFIG[pool.status] ?? STATUS_CONFIG['open'];
                  return (
                    <tr key={pool.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 pr-4">
                        <p className="text-xs font-semibold text-foreground truncate max-w-[140px]">{pool.title}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{pool.group}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {pool.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs font-semibold text-foreground">
                          {pool.entries}/{pool.maxEntries}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{pool.createdDaysAgo}d</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs font-medium text-foreground">{pool.flag}</span>
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
