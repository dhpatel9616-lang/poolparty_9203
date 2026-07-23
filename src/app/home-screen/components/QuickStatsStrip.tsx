'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export type HomeFilter = 'active' | 'owed' | 'you-owe' | 'disputes' | null;

interface QuickStatsStripProps {
  activeFilter: HomeFilter;
  onFilterChange: (filter: HomeFilter) => void;
}

interface Stats {
  active: number;
  owed: number;
  youOwe: number;
  disputes: number;
}

export default function QuickStatsStrip({ activeFilter, onFilterChange }: QuickStatsStripProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ active: 0, owed: 0, youOwe: 0, disputes: 0 });

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    const fetchStats = async () => {
      const [poolsRes, settlementsRes, disputesRes] = await Promise.all([
        supabase.from('pools').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('settlements').select('*').or(`payer_id.eq.${user.id},recipient_id.eq.${user.id}`).in('settlement_status', ['pending', 'claimed_paid', 'overdue']),
        supabase.from('disputes').select('id', { count: 'exact', head: true }).or(`opened_by.eq.${user.id},against_user_id.eq.${user.id}`).eq('dispute_status', 'open'),
      ]);

      const settlements = settlementsRes.data ?? [];
      const owedToMe = settlements.filter((s: any) => s.recipient_id === user.id);
      const youOwe = settlements.filter((s: any) => s.payer_id === user.id);
      const owedTotal = owedToMe.reduce((sum: number, s: any) => sum + Number(s.amount), 0);

      setStats({
        active: poolsRes.count ?? 0,
        owed: owedTotal,
        youOwe: youOwe.reduce((sum: number, s: any) => sum + Number(s.amount), 0),
        disputes: disputesRes.count ?? 0,
      });
    };

    fetchStats();
  }, [user]);

  const STATS = [
    { id: 'active' as HomeFilter, label: 'Active', value: String(stats.active), color: '#7C5CFF', bg: 'rgba(124,92,255,0.15)' },
    { id: 'owed' as HomeFilter, label: 'Owed to You', value: stats.owed > 0 ? `$${Math.round(stats.owed)}` : '$0', color: '#00E676', bg: 'rgba(0,230,118,0.15)' },
    { id: 'you-owe' as HomeFilter, label: 'You Owe', value: stats.youOwe > 0 ? `$${Math.round(stats.youOwe)}` : '$0', color: '#FF4D8D', bg: 'rgba(255,77,141,0.15)' },
    { id: 'disputes' as HomeFilter, label: 'Disputes', value: String(stats.disputes), color: '#FFC857', bg: 'rgba(255,200,87,0.15)' },
  ];

  const handleTap = (id: HomeFilter) => {
    onFilterChange(activeFilter === id ? null : id);
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {STATS.map((stat) => {
        const isActive = activeFilter === stat.id;
        return (
          <button
            key={stat.id}
            onClick={() => handleTap(stat.id)}
            className="rounded-xl p-3 flex flex-col items-center gap-0.5 transition-all active:scale-95"
            style={{
              background: isActive ? stat.bg : 'var(--surface)',
              border: isActive ? `1.5px solid ${stat.color}` : '1px solid var(--border)',
            }}
          >
            <span
              className="text-base font-bold"
              style={{ color: stat.color, fontVariantNumeric: 'tabular-nums' }}
            >
              {stat.value}
            </span>
            <span
              className="text-2xs font-medium text-center leading-tight"
              style={{ color: isActive ? stat.color : 'var(--muted-foreground)' }}
            >
              {stat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}