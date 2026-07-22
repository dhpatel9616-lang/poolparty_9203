'use client';
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CreditCard, CheckCircle, AlertTriangle, Clock, Shield, TrendingDown, Flag, ChevronUp, ChevronDown, Zap,  } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


// ─── Mock Data ────────────────────────────────────────────────────────────────

const SETTLEMENT_TREND = [
  { date: 'Apr 6', paid: 28, confirmed: 22, disputed: 3, waived: 2 },
  { date: 'Apr 7', paid: 34, confirmed: 28, disputed: 2, waived: 1 },
  { date: 'Apr 8', paid: 21, confirmed: 17, disputed: 4, waived: 3 },
  { date: 'Apr 9', paid: 41, confirmed: 35, disputed: 2, waived: 1 },
  { date: 'Apr 10', paid: 37, confirmed: 30, disputed: 3, waived: 2 },
  { date: 'Apr 11', paid: 52, confirmed: 44, disputed: 5, waived: 2 },
  { date: 'Apr 12', paid: 48, confirmed: 40, disputed: 4, waived: 3 },
  { date: 'Apr 13', paid: 43, confirmed: 36, disputed: 3, waived: 1 },
  { date: 'Apr 14', paid: 56, confirmed: 47, disputed: 6, waived: 2 },
];

const TRUST_SCORE_TREND = [
  { date: 'Apr 6', avg: 68.2 },
  { date: 'Apr 7', avg: 68.8 },
  { date: 'Apr 8', avg: 69.1 },
  { date: 'Apr 9', avg: 69.5 },
  { date: 'Apr 10', avg: 70.0 },
  { date: 'Apr 11', avg: 70.4 },
  { date: 'Apr 12', avg: 70.9 },
  { date: 'Apr 13', avg: 71.1 },
  { date: 'Apr 14', avg: 71.4 },
];

const RISK_ALERTS = [
  {
    id: 'r1',
    type: 'chronic_nonpayer',
    title: 'Chronic Non-Payer Detected',
    description: '@jake_m has 4 unpaid settlements totaling 14 days overdue. Trust score: 28.',
    user: '@jake_m',
    severity: 'critical',
    time: '2h ago',
    action: 'Review User',
  },
  {
    id: 'r2',
    type: 'dispute_spike',
    title: 'Dispute Rate Spike',
    description: 'Group "Hoops Squad" has 3 open disputes in the last 48h — above 2× normal rate.',
    user: 'Hoops Squad',
    severity: 'high',
    time: '4h ago',
    action: 'View Group',
  },
  {
    id: 'r3',
    type: 'overdue_settlement',
    title: 'Settlement Overdue 7+ Days',
    description: '@sara_t owes $120 to @mike_r. Auto-flag triggered. Trust deduction pending.',
    user: '@sara_t',
    severity: 'high',
    time: '6h ago',
    action: 'View Settlement',
  },
  {
    id: 'r4',
    type: 'trust_drop',
    title: 'Significant Trust Score Drop',
    description: '@dev_p trust score dropped 35 points in 7 days (82 → 47). Multiple disputes.',
    user: '@dev_p',
    severity: 'medium',
    time: '12h ago',
    action: 'Review User',
  },
  {
    id: 'r5',
    type: 'waive_pattern',
    title: 'Unusual Waive Pattern',
    description: '@anna_k has waived 3 settlements in 2 weeks. Possible collusion or abuse.',
    user: '@anna_k',
    severity: 'medium',
    time: '1d ago',
    action: 'Investigate',
  },
  {
    id: 'r6',
    type: 'overdue_settlement',
    title: 'Bulk Unpaid Settlements',
    description: '11 settlement items from "March Madness" pool are unpaid after 10 days.',
    user: 'March Madness pool',
    severity: 'high',
    time: '1d ago',
    action: 'View Pool',
  },
  {
    id: 'r7',
    type: 'trust_drop',
    title: 'New User High Dispute Rate',
    description: '@new_user_92 filed 2 disputes within first week. Possible bad actor.',
    user: '@new_user_92',
    severity: 'low',
    time: '2d ago',
    action: 'Review User',
  },
];

const KPI_TILES = [
  {
    label: 'Settlement Rate',
    value: '91.2%',
    icon: CheckCircle,
    color: '#00E676',
    bg: 'rgba(0,230,118,0.12)',
    trend: '+1.2%',
    trendUp: true,
  },
  {
    label: 'Avg Time to Settle',
    value: '2.4d',
    icon: Clock,
    color: '#7C5CFF',
    bg: 'rgba(124,92,255,0.12)',
    trend: '-0.3d',
    trendUp: true,
  },
  {
    label: 'Dispute Rate',
    value: '3.1%',
    icon: Flag,
    color: '#FF4D8D',
    bg: 'rgba(255,77,141,0.12)',
    trend: '-0.4%',
    trendUp: true,
  },
  {
    label: 'Open Disputes',
    value: '14',
    icon: AlertTriangle,
    color: '#FF9632',
    bg: 'rgba(255,150,50,0.12)',
    trend: '+2 this week',
    trendUp: false,
  },
  {
    label: 'Avg Trust Score',
    value: '71.4',
    icon: Shield,
    color: '#00C9A7',
    bg: 'rgba(0,201,167,0.12)',
    trend: '+2.3',
    trendUp: true,
  },
  {
    label: 'Tracked Stake Vol.',
    value: '$48.2K',
    icon: CreditCard,
    color: '#FFC857',
    bg: 'rgba(255,200,87,0.12)',
    trend: '+18.9%',
    trendUp: true,
  },
  {
    label: 'Unpaid Flags (7d)',
    value: '47',
    icon: TrendingDown,
    color: '#FF4D8D',
    bg: 'rgba(255,77,141,0.12)',
    trend: '+5 vs last week',
    trendUp: false,
  },
  {
    label: 'Trust Badges Awarded',
    value: '83',
    icon: Zap,
    color: '#7C5CFF',
    bg: 'rgba(124,92,255,0.12)',
    trend: '+11 this week',
    trendUp: true,
  },
];

const SEVERITY_CONFIG: Record<string, { bg: string; color: string; label: string; dot: string }> = {
  critical: { bg: 'rgba(255,77,141,0.1)', color: '#FF4D8D', label: 'Critical', dot: '#FF4D8D' },
  high: { bg: 'rgba(255,150,50,0.1)', color: '#FF9632', label: 'High', dot: '#FF9632' },
  medium: { bg: 'rgba(255,200,87,0.1)', color: '#FFC857', label: 'Medium', dot: '#FFC857' },
  low: { bg: 'rgba(0,201,167,0.1)', color: '#00C9A7', label: 'Low', dot: '#00C9A7' },
};

const ALERT_TYPE_ICONS: Record<string, React.ElementType> = {
  chronic_nonpayer: AlertTriangle,
  dispute_spike: Flag,
  overdue_settlement: Clock,
  trust_drop: TrendingDown,
  waive_pattern: Shield,
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

export default function SettlementTrust() {
  const [lastUpdated] = useState(new Date());
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const activeAlerts = RISK_ALERTS.filter((a) => !dismissedAlerts.includes(a.id));

  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
  const highCount = activeAlerts.filter((a) => a.severity === 'high').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settlement & Trust</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Settlement health, trust score trends, and risk alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{ background: 'rgba(255,77,141,0.12)', color: '#FF4D8D', border: '1px solid rgba(255,77,141,0.25)' }}
            >
              <AlertTriangle size={12} />
              {criticalCount} critical
            </span>
          )}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', color: '#00E676' }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00E676' }} />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
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
        {/* Settlement Status Trend */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">Settlement Status Trend</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Daily breakdown: paid, confirmed, disputed, waived (last 9 days)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SETTLEMENT_TREND} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,68,0.5)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#B8B4C8' }} />
              <Bar dataKey="paid" name="Paid" fill="#7C5CFF" radius={[3, 3, 0, 0]} stackId="a" />
              <Bar dataKey="confirmed" name="Confirmed" fill="#00E676" radius={[3, 3, 0, 0]} stackId="b" />
              <Bar dataKey="disputed" name="Disputed" fill="#FF4D8D" radius={[3, 3, 0, 0]} stackId="c" />
              <Bar dataKey="waived" name="Waived" fill="#FFC857" radius={[3, 3, 0, 0]} stackId="d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trust Score Trend */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">Avg Trust Score</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Platform-wide average over 9 days
            </p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={TRUST_SCORE_TREND} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,68,0.5)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#B8B4C8', fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} domain={[65, 75]} />
              <Tooltip
                contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }}
                formatter={(v: number) => [v.toFixed(1), 'Avg Trust']}
              />
              <Line type="monotone" dataKey="avg" stroke="#00C9A7" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          {/* Summary stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Current Avg', value: '71.4', color: '#00C9A7' },
              { label: '7d Change', value: '+3.2', color: '#00E676' },
              { label: 'Platinum Users', value: '142', color: '#7C5CFF' },
              { label: 'At-Risk (<50)', value: '47', color: '#FF4D8D' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3 text-center"
                style={{ background: 'var(--elevated)' }}
              >
                <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Alerts Table */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Risk Alerts</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Automated flags for settlement abuse, dispute spikes, and trust anomalies
            </p>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,77,141,0.12)', color: '#FF4D8D' }}
              >
                {criticalCount} critical
              </span>
            )}
            {highCount > 0 && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,150,50,0.12)', color: '#FF9632' }}
              >
                {highCount} high
              </span>
            )}
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(124,92,255,0.12)', color: '#7C5CFF' }}
            >
              {activeAlerts.length} active
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle size={32} className="mx-auto mb-3" style={{ color: '#00E676' }} />
              <p className="text-sm font-semibold text-foreground">All clear!</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>No active risk alerts at this time.</p>
            </div>
          ) : (
            activeAlerts.map((alert) => {
              const sev = SEVERITY_CONFIG[alert.severity];
              const AlertIcon = ALERT_TYPE_ICONS[alert.type] ?? AlertTriangle;
              return (
                <div
                  key={alert.id}
                  className="rounded-xl p-4 flex items-start gap-4"
                  style={{ background: sev.bg, border: `1px solid ${sev.color}22` }}
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${sev.color}20` }}
                  >
                    <AlertIcon size={17} style={{ color: sev.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                      <span
                        className="text-2xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${sev.color}20`, color: sev.color }}
                      >
                        {sev.label}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{alert.time}</span>
                      <span
                        className="text-2xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(124,92,255,0.12)', color: '#7C5CFF' }}
                      >
                        {alert.user}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{ background: sev.color, color: '#fff' }}
                    >
                      {alert.action}
                    </button>
                    <button
                      onClick={() => setDismissedAlerts((prev) => [...prev, alert.id])}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Compliance footer */}
        <div
          className="mt-5 pt-4 text-center"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            PoolParty does not process payments or hold funds. All settlement tracking is user-reported only.
          </p>
        </div>
      </div>
    </div>
  );
}
