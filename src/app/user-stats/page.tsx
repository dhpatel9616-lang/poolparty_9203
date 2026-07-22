'use client';
import React, { useEffect, useState, useCallback } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft, TrendingUp, Users, Target, CheckCircle, BarChart2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Icon from '@/components/ui/AppIcon';


// ─── Types ────────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  trend?: number | null;
}

interface TimeSeriesPoint {
  label: string;
  pools: number;
  joins: number;
  settlements: number;
}

interface UserStatsData {
  poolsCreated: number;
  invitesSent: number;
  invitesAccepted: number;
  inviteConversionRate: number;
  viralCoefficient: number;
  joinRate: number;
  settlementsTotal: number;
  settlementsSuccess: number;
  settlementSuccessRate: number;
  timeSeries: TimeSeriesPoint[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, bg, icon: Icon, trend }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: bg }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== null && trend !== undefined && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: trend >= 0 ? 'rgba(0,230,118,0.12)' : 'rgba(255,77,141,0.12)',
              color: trend >= 0 ? '#00E676' : '#FF4D8D',
            }}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p
          className="text-2xl font-bold"
          style={{ color, fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </p>
        <p className="text-xs font-semibold text-foreground mt-0.5">{label}</p>
        {sub && (
          <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
    >
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserStatsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'pools' | 'joins' | 'settlements'>('pools');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    const supabase = createClient();

    const [poolsRes, entriesRes, settlementsRes, notifRes] = await Promise.all([
      supabase
        .from('pools')
        .select('id, created_at, participant_count, status')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('pool_entries')
        .select('id, pool_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('settlement_items')
        .select('id, status, created_at')
        .or(`payer_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true }),
      supabase
        .from('notifications')
        .select('id, type, created_at')
        .eq('user_id', user.id)
        .in('type', ['invite_received', 'group_joined', 'pool_joined']),
    ]);

    const pools = poolsRes.data ?? [];
    const entries = entriesRes.data ?? [];
    const settlements = settlementsRes.data ?? [];
    const notifs = notifRes.data ?? [];

    // Core metrics
    const poolsCreated = pools.length;
    const invitesSent = notifs.filter((n: any) => n.type === 'invite_received').length;
    const invitesAccepted = notifs.filter((n: any) => n.type === 'group_joined' || n.type === 'pool_joined').length;
    const inviteConversionRate = pct(invitesAccepted, Math.max(invitesSent, 1));

    // Viral coefficient: avg new users each pool creator brings in
    const avgParticipants = pools.length > 0
      ? pools.reduce((sum: number, p: any) => sum + (p.participant_count ?? 0), 0) / pools.length
      : 0;
    const viralCoefficient = parseFloat((avgParticipants * (inviteConversionRate / 100)).toFixed(2));

    // Join rate: pools joined vs pools created
    const joinRate = pct(entries.length, Math.max(poolsCreated + entries.length, 1));

    // Settlement success
    const settlementsTotal = settlements.length;
    const settlementsSuccess = settlements.filter(
      (s: any) => s.status === 'confirmed' || s.status === 'paid'
    ).length;
    const settlementSuccessRate = pct(settlementsSuccess, Math.max(settlementsTotal, 1));

    // Time series — group by week (last 8 weeks)
    const now = new Date();
    const weeks: TimeSeriesPoint[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekPools = pools.filter((p: any) => {
        const d = new Date(p.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;

      const weekJoins = entries.filter((e: any) => {
        const d = new Date(e.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;

      const weekSettlements = settlements.filter((s: any) => {
        const d = new Date(s.created_at);
        return d >= weekStart && d < weekEnd && (s.status === 'confirmed' || s.status === 'paid');
      }).length;

      weeks.push({
        label: formatMonth(weekStart.toISOString()),
        pools: weekPools,
        joins: weekJoins,
        settlements: weekSettlements,
      });
    }

    setStats({
      poolsCreated,
      invitesSent,
      invitesAccepted,
      inviteConversionRate,
      viralCoefficient,
      joinRate,
      settlementsTotal,
      settlementsSuccess,
      settlementSuccessRate,
      timeSeries: weeks,
    });
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const CHART_TABS = [
    { id: 'pools' as const, label: 'Pools Created', color: '#7C5CFF' },
    { id: 'joins' as const, label: 'Joins', color: '#00C9A7' },
    { id: 'settlements' as const, label: 'Settlements', color: '#00E676' },
  ];

  const activeColor = CHART_TABS.find((t) => t.id === activeChart)?.color ?? '#7C5CFF';

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Your Stats</h1>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Pool activity &amp; growth metrics
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <RefreshCw
              size={16}
              style={{ color: 'var(--primary)' }}
              className={refreshing ? 'animate-spin' : ''}
            />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl animate-pulse"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: 110 }}
                />
              ))}
            </div>
            <div
              className="rounded-2xl animate-pulse"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: 220 }}
            />
          </div>
        ) : stats ? (
          <div className="space-y-4">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Pools Created"
                value={stats.poolsCreated}
                sub="Total pools you started"
                color="#7C5CFF"
                bg="rgba(124,92,255,0.12)"
                icon={Target}
                trend={null}
              />
              <StatCard
                label="Invite Conversion"
                value={`${stats.inviteConversionRate}%`}
                sub={`${stats.invitesAccepted} of ${stats.invitesSent} accepted`}
                color="#FF4D8D"
                bg="rgba(255,77,141,0.12)"
                icon={Users}
                trend={null}
              />
              <StatCard
                label="Viral Coefficient"
                value={stats.viralCoefficient}
                sub="Avg new users per pool"
                color="#FFC857"
                bg="rgba(255,200,87,0.12)"
                icon={TrendingUp}
                trend={null}
              />
              <StatCard
                label="Join Rate"
                value={`${stats.joinRate}%`}
                sub={`${entries_count(stats)} pools joined`}
                color="#00C9A7"
                bg="rgba(0,201,167,0.12)"
                icon={BarChart2}
                trend={null}
              />
            </div>

            {/* Settlement Success */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,230,118,0.12)' }}
                  >
                    <CheckCircle size={16} style={{ color: '#00E676' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Settlement Success</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {stats.settlementsSuccess} of {stats.settlementsTotal} resolved
                    </p>
                  </div>
                </div>
                <span
                  className="text-2xl font-bold"
                  style={{ color: '#00E676', fontVariantNumeric: 'tabular-nums' }}
                >
                  {stats.settlementSuccessRate}%
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--elevated)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${stats.settlementSuccessRate}%`,
                    background: 'linear-gradient(90deg, #00C9A7, #00E676)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                  Confirmed + Paid
                </span>
                <span className="text-2xs font-semibold" style={{ color: '#00E676' }}>
                  {stats.settlementsTotal - stats.settlementsSuccess} pending
                </span>
              </div>
            </div>

            {/* Time Series Chart */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm font-bold text-foreground mb-3">Activity Over Time</p>

              {/* Chart Tabs */}
              <div className="flex gap-2 mb-4">
                {CHART_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChart(tab.id)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: activeChart === tab.id ? tab.color + '22' : 'var(--elevated)',
                      color: activeChart === tab.id ? tab.color : 'var(--muted-foreground)',
                      border: activeChart === tab.id ? `1px solid ${tab.color}44` : '1px solid transparent',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {stats.timeSeries.every((p) => p[activeChart] === 0) ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    No data yet — start creating pools!
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={stats.timeSeries} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey={activeChart}
                      name={CHART_TABS.find((t) => t.id === activeChart)?.label}
                      stroke={activeColor}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: activeColor, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: activeColor }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Viral Coefficient Explainer */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(124,92,255,0.08) 0%, rgba(255,200,87,0.06) 100%)',
                border: '1px solid rgba(124,92,255,0.2)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(124,92,255,0.15)' }}
                >
                  <TrendingUp size={15} style={{ color: '#7C5CFF' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Viral Coefficient: {stats.viralCoefficient}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    {stats.viralCoefficient >= 1
                      ? 'Each pool you create brings in more than one new user on average. Your pools are growing virally! 🚀'
                      : stats.viralCoefficient > 0
                      ? 'You\'re generating organic growth. Invite more friends to push your coefficient above 1.0.' :'Create pools and invite friends to start building your viral growth score.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <BarChart2 size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm font-semibold text-foreground">No stats available</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Sign in to see your pool activity metrics
            </p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

// Helper to compute entries count from join rate
function entries_count(stats: UserStatsData): number {
  if (stats.joinRate === 0) return 0;
  const total = stats.poolsCreated + Math.round((stats.joinRate / 100) * (stats.poolsCreated + 1));
  return Math.round((stats.joinRate / 100) * total);
}
