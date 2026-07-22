'use client';
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Users, Activity, CheckCircle, TrendingUp, BarChart2, Zap, RefreshCw } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';


// ─── Mock Data ────────────────────────────────────────────────────────────────

function generateDAUData(days: number) {
  const data = [];
  const now = new Date();
  let base = 420;
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    base = Math.max(200, Math.min(900, base + Math.floor((Math.random() - 0.45) * 60)));
    data.push({ date: label, dau: base });
  }
  return data;
}

const DAU_30D = generateDAUData(30);
const DAU_7D = DAU_30D.slice(-7);
const DAU_90D = generateDAUData(90);

const KPI_DATA = {
  dau: 634,
  wau: 2841,
  poolsCreated: 187,
  entriesPlaced: 1423,
  inviteConversion: 38.4,
  settlementRate: 91.2,
  viralCoefficient: 1.34,
  disputeRate: 3.1,
  trackedStakeVolume: '$48,200',
  avgPoolSize: 8.3,
};

// ─── Ticker Messages ──────────────────────────────────────────────────────────

const TICKER_MESSAGES = [
  '🟢 All systems operational',
  '📊 634 daily active users today',
  '🏆 187 pools created this week',
  '✅ Settlement rate: 91.2%',
  '🚀 Viral coefficient: 1.34',
  '⚡ 1,423 entries placed today',
  '🔒 3.1% dispute rate — within target',
];

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((prev) => (prev + 1) % TICKER_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3 mb-6"
      style={{ background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.2)' }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
        style={{ background: '#00E676' }}
      />
      <p
        className="text-sm font-medium transition-opacity duration-300"
        style={{
          color: 'var(--foreground)',
          opacity: visible ? 1 : 0,
        }}
      >
        {TICKER_MESSAGES[idx]}
      </p>
    </div>
  );
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

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
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: bg }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              background: trendUp ? 'rgba(0,230,118,0.12)' : 'rgba(255,77,141,0.12)',
              color: trendUp ? '#00E676' : '#FF4D8D',
            }}
          >
            {trend}
          </span>
        )}
      </div>
      <div>
        <p
          className="text-2xl font-bold"
          style={{ color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── DAU Chart ────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d';

function DAUChart({ period }: { period: Period }) {
  const data = period === '7d' ? DAU_7D : period === '90d' ? DAU_90D : DAU_30D;
  const tickInterval = period === '90d' ? 14 : period === '30d' ? 6 : 1;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,68,0.5)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#B8B4C8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={tickInterval}
        />
        <YAxis
          tick={{ fill: '#B8B4C8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{
            background: '#2C2C34',
            border: '1px solid #3A3844',
            borderRadius: 12,
            color: '#F5F5F7',
            fontSize: 12,
          }}
          labelStyle={{ color: '#B8B4C8', marginBottom: 4 }}
          formatter={(value: number) => [value.toLocaleString(), 'DAU']}
        />
        <Line
          type="monotone"
          dataKey="dau"
          stroke="#7C5CFF"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: '#7C5CFF', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Executive Overview ───────────────────────────────────────────────────────

export default function ExecutiveOverview() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [kpis, setKpis] = useState(KPI_DATA);
  const [dauData, setDauData] = useState(DAU_30D);

  useEffect(() => {
    const supabase = createClient();
    // Fetch viral metrics for KPI data
    supabase
      .from('viral_metrics')
      .select('*')
      .order('period_date', { ascending: false })
      .limit(90)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const latest = data[0];
          setKpis((prev) => ({
            ...prev,
            viralCoefficient: Number(latest.viral_coefficient) || prev.viralCoefficient,
          }));
          // Build DAU chart from viral metrics
          const chartData = [...data].reverse().map((d: any) => ({
            date: new Date(d.period_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            dau: d.new_signups || 0,
          }));
          if (chartData.length > 0) {
            setDauData(chartData);
          }
        }
      });
  }, []);

  const displayData = range === '7d' ? dauData.slice(-7) : range === '90d' ? dauData : dauData.slice(-30);

  const [period, setPeriod] = useState<Period>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastUpdatedStr, setLastUpdatedStr] = useState<string>('');

  useEffect(() => {
    const d = new Date();
    setLastUpdated(d);
    setLastUpdatedStr(d.toLocaleTimeString());
  }, []);

  const handleRefresh = () => {
    const d = new Date();
    setLastUpdated(d);
    setLastUpdatedStr(d.toLocaleTimeString());
  };

  const kpiTiles: KpiTileProps[] = [
    {
      label: 'Daily Active Users',
      value: KPI_DATA.dau.toLocaleString(),
      icon: Users,
      color: '#7C5CFF',
      bg: 'rgba(124,92,255,0.12)',
      trend: '+8.2%',
      trendUp: true,
    },
    {
      label: 'Weekly Active Users',
      value: KPI_DATA.wau.toLocaleString(),
      icon: Activity,
      color: '#00C9A7',
      bg: 'rgba(0,201,167,0.12)',
      trend: '+5.1%',
      trendUp: true,
    },
    {
      label: 'Pools Created',
      value: KPI_DATA.poolsCreated.toLocaleString(),
      icon: BarChart2,
      color: '#FF4D8D',
      bg: 'rgba(255,77,141,0.12)',
      trend: '+12.4%',
      trendUp: true,
    },
    {
      label: 'Entries Placed',
      value: KPI_DATA.entriesPlaced.toLocaleString(),
      icon: Zap,
      color: '#FFC857',
      bg: 'rgba(255,200,87,0.12)',
      trend: '+3.7%',
      trendUp: true,
    },
    {
      label: 'Settlement Rate',
      value: `${KPI_DATA.settlementRate}%`,
      icon: CheckCircle,
      color: '#00E676',
      bg: 'rgba(0,230,118,0.12)',
      trend: '+1.2%',
      trendUp: true,
    },
    {
      label: 'Viral Coefficient',
      value: KPI_DATA.viralCoefficient,
      icon: TrendingUp,
      color: '#7C5CFF',
      bg: 'rgba(124,92,255,0.12)',
      trend: '+0.08',
      trendUp: true,
    },
    {
      label: 'Invite Conversion',
      value: `${KPI_DATA.inviteConversion}%`,
      icon: Users,
      color: '#00C9A7',
      bg: 'rgba(0,201,167,0.12)',
      trend: '-1.1%',
      trendUp: false,
    },
    {
      label: 'Dispute Rate',
      value: `${KPI_DATA.disputeRate}%`,
      icon: Activity,
      color: '#FF4D8D',
      bg: 'rgba(255,77,141,0.12)',
      trend: '-0.4%',
      trendUp: true,
    },
    {
      label: 'Tracked Stake Volume',
      value: KPI_DATA.trackedStakeVolume,
      icon: BarChart2,
      color: '#FFC857',
      bg: 'rgba(255,200,87,0.12)',
      trend: '+18.9%',
      trendUp: true,
    },
    {
      label: 'Avg Pool Size',
      value: KPI_DATA.avgPoolSize,
      icon: Users,
      color: '#7C5CFF',
      bg: 'rgba(124,92,255,0.12)',
      trend: '+0.6',
      trendUp: true,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Executive Overview</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Last updated: {lastUpdatedStr}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period filter */}
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-4 py-2 text-sm font-medium transition-all"
                style={{
                  background: period === p ? 'var(--primary)' : 'var(--surface)',
                  color: period === p ? '#fff' : 'var(--muted-foreground)',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            title="Refresh"
          >
            <RefreshCw size={16} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>
      </div>

      {/* Live Ticker */}
      <LiveTicker />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        {kpiTiles.map((tile) => (
          <KpiTile key={tile.label} {...tile} />
        ))}
      </div>

      {/* DAU Chart */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Daily Active Users</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#7C5CFF' }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              DAU
            </span>
          </div>
        </div>
        <DAUChart period={period} />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Settlement Health */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Platform Health</h3>
          <div className="space-y-3">
            {[
              { label: 'Settlement Rate', value: 91.2, color: '#00E676' },
              { label: 'D7 Retention', value: 64, color: '#7C5CFF' },
              { label: 'Accuracy Score', value: 73, color: '#00C9A7' },
              { label: 'Viral Coefficient', value: Math.min(100, KPI_DATA.viralCoefficient * 50), color: '#FF4D8D' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {item.label}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {item.label === 'Viral Coefficient'
                      ? KPI_DATA.viralCoefficient
                      : `${item.value}%`}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--elevated)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.value}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Stats */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Quick Stats</h3>
          <div className="space-y-3">
            {[
              { label: 'Avg Pool Size', value: `${KPI_DATA.avgPoolSize} members` },
              { label: 'Tracked Stake Volume', value: KPI_DATA.trackedStakeVolume },
              { label: 'Invite Conversion', value: `${KPI_DATA.inviteConversion}%` },
              { label: 'Dispute Rate', value: `${KPI_DATA.disputeRate}%` },
              { label: 'WAU / DAU Ratio', value: `${(KPI_DATA.wau / KPI_DATA.dau).toFixed(1)}x` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { time: '2m ago', event: 'Pool resolved: Lakers playoffs', type: 'resolve' },
              { time: '8m ago', event: 'New user joined via invite', type: 'join' },
              { time: '15m ago', event: 'Settlement confirmed: $50', type: 'settle' },
              { time: '23m ago', event: 'Dispute opened: BTC contract', type: 'dispute' },
              { time: '41m ago', event: 'Badge earned: Perfect Payer', type: 'badge' },
            ].map((item, i) => {
              const colors: Record<string, string> = {
                resolve: '#00E676',
                join: '#7C5CFF',
                settle: '#00C9A7',
                dispute: '#FF4D8D',
                badge: '#FFC857',
              };
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: colors[item.type] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{item.event}</p>
                    <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                      {item.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
