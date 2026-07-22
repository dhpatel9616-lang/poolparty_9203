'use client';
import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,  } from 'recharts';
import { DollarSign, TrendingUp, Zap, Star } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


// ─── Mock Data ────────────────────────────────────────────────────────────────

function generateMRR() {
  const data = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let mrr = 4200;
  for (const m of months) {
    mrr = Math.round(mrr * (1 + (Math.random() * 0.12 - 0.02)));
    data.push({ month: m, mrr, arr: mrr * 12 });
  }
  return data;
}

const MRR_DATA = generateMRR();

const REVENUE_MIX = [
  { name: 'Premium Subscriptions', value: 58, fill: '#7C5CFF' },
  { name: 'API Access', value: 22, fill: '#00C9A7' },
  { name: 'Group Upgrades', value: 12, fill: '#FFC857' },
  { name: 'Data Exports', value: 8, fill: '#FF4D8D' },
];

const PREMIUM_FEATURES = [
  { feature: 'Unlimited Groups', users: 1847, pct: 64.8 },
  { feature: 'Advanced Analytics', users: 1203, pct: 42.2 },
  { feature: 'Custom Pool Rules', users: 987, pct: 34.6 },
  { feature: 'Priority Resolution', users: 743, pct: 26.1 },
  { feature: 'API Access', users: 312, pct: 10.9 },
  { feature: 'White-label Groups', users: 89, pct: 3.1 },
];

function generateAPIVolume() {
  const data = [];
  const now = new Date();
  let base = 8400;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    base = Math.max(4000, Math.min(18000, base + Math.floor((Math.random() - 0.4) * 1200)));
    data.push({ date: label, calls: base, errors: Math.floor(base * (0.01 + Math.random() * 0.02)) });
  }
  return data;
}

const API_VOLUME = generateAPIVolume();

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

interface KpiProps { label: string; value: string; icon: React.ElementType; color: string; bg: string; trend?: string; trendUp?: boolean; }
function KpiTile({ label, value, icon: Icon, color, bg, trend, trendUp }: KpiProps) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: trendUp ? 'rgba(0,230,118,0.12)' : 'rgba(255,77,141,0.12)', color: trendUp ? '#00E676' : '#FF4D8D' }}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      </div>
    </div>
  );
}

const CUSTOM_LABEL = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Monetization Module ──────────────────────────────────────────────────────

export default function Monetization() {
  const currentMRR = MRR_DATA[MRR_DATA.length - 1].mrr;
  const prevMRR = MRR_DATA[MRR_DATA.length - 2].mrr;
  const mrrGrowth = (((currentMRR - prevMRR) / prevMRR) * 100).toFixed(1);

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Monthly Recurring Revenue" value={`$${currentMRR.toLocaleString()}`} icon={DollarSign} color="#00C9A7" bg="rgba(0,201,167,0.12)" trend={`+${mrrGrowth}%`} trendUp={true} />
        <KpiTile label="Annual Run Rate" value={`$${(currentMRR * 12).toLocaleString()}`} icon={TrendingUp} color="#7C5CFF" bg="rgba(124,92,255,0.12)" trend="+18.4%" trendUp={true} />
        <KpiTile label="Premium Subscribers" value="2,851" icon={Star} color="#FFC857" bg="rgba(255,200,87,0.12)" trend="+142 MoM" trendUp={true} />
        <KpiTile label="API Calls (30d)" value="284K" icon={Zap} color="#FF4D8D" bg="rgba(255,77,141,0.12)" trend="+31.2%" trendUp={true} />
      </div>

      {/* MRR Chart + Revenue Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Trend */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-5" style={{ color: 'var(--foreground)' }}>MRR Trend — 12 Months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MRR_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C9A7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C9A7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,68,0.5)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#B8B4C8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'MRR']} />
              <Area type="monotone" dataKey="mrr" stroke="#00C9A7" strokeWidth={2.5} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Mix Pie */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Revenue Mix</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={REVENUE_MIX} cx="50%" cy="50%" outerRadius={80} dataKey="value" labelLine={false} label={CUSTOM_LABEL}>
                {REVENUE_MIX.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }} formatter={(v: number) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {REVENUE_MIX.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.fill }} />
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.name}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Feature Usage + API Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Premium Feature Usage */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Star size={16} style={{ color: '#FFC857' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Premium Feature Usage</h3>
          </div>
          <div className="space-y-4">
            {PREMIUM_FEATURES.map(f => (
              <div key={f.feature}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{f.feature}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{f.users.toLocaleString()} users</span>
                    <span className="text-xs font-bold" style={{ color: '#7C5CFF' }}>{f.pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--elevated)' }}>
                  <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: 'linear-gradient(90deg, #7C5CFF, #B8A3FF)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Volume */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Zap size={16} style={{ color: '#FF4D8D' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>API Volume — 30 Days</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={API_VOLUME} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,56,68,0.5)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
              <YAxis tick={{ fill: '#B8B4C8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#2C2C34', border: '1px solid #3A3844', borderRadius: 12, color: '#F5F5F7', fontSize: 12 }} />
              <Bar dataKey="calls" name="API Calls" fill="rgba(255,77,141,0.7)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="errors" name="Errors" fill="rgba(255,200,87,0.7)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full" style={{ background: 'rgba(255,77,141,0.7)' }} /><span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Calls</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full" style={{ background: 'rgba(255,200,87,0.7)' }} /><span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Errors</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
