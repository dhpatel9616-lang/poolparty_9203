'use client';
import React, { useState } from 'react';
import { FileText, AlertTriangle, Shield, Info, AlertCircle, Search } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';


// ─── Mock Data ────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'info';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  table: string;
  recordId: string;
  severity: Severity;
  metadata: string;
}

const AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'a001', timestamp: '2026-05-05 02:41:18', actor: 'admin@poolparty', actorRole: 'superadmin', action: 'DELETE_USER', table: 'users', recordId: 'usr_8f2a...', severity: 'critical', metadata: 'Soft delete — account_status=deleted' },
  { id: 'a002', timestamp: '2026-05-05 02:38:04', actor: 'system', actorRole: 'service', action: 'UNPAID_FLAG_CREATED', table: 'unpaid_flags', recordId: 'flg_3c1d...', severity: 'warning', metadata: '7 days unpaid — trust deducted 30pts' },
  { id: 'a003', timestamp: '2026-05-05 02:31:55', actor: 'mod_jkelly', actorRole: 'moderator', action: 'POOL_CANCELLED', table: 'pools', recordId: 'pool_9a4e...', severity: 'warning', metadata: 'Admin cancel — reason: duplicate pool' },
  { id: 'a004', timestamp: '2026-05-05 02:28:12', actor: 'system', actorRole: 'service', action: 'TRUST_SCORE_UPDATED', table: 'reputation_scores', recordId: 'rep_2b7f...', severity: 'info', metadata: 'delta=-30, reason=unpaid_flag' },
  { id: 'a005', timestamp: '2026-05-05 02:19:47', actor: 'admin@poolparty', actorRole: 'superadmin', action: 'BLACKLIST_ADDED', table: 'blacklist_entries', recordId: 'blk_5e9c...', severity: 'warning', metadata: 'Group: Sunday Ballers — reason: repeated non-payment' },
  { id: 'a006', timestamp: '2026-05-05 02:14:33', actor: 'system', actorRole: 'service', action: 'POOL_RESOLVED', table: 'pools', recordId: 'pool_1f3b...', severity: 'info', metadata: 'winning_outcome_id=out_7d2a, settlements_created=8' },
  { id: 'a007', timestamp: '2026-05-05 02:09:21', actor: 'mod_jkelly', actorRole: 'moderator', action: 'DISPUTE_RESOLVED', table: 'disputes', recordId: 'dsp_4c8e...', severity: 'info', metadata: 'status=resolved, outcome=in_favor_of_filer' },
  { id: 'a008', timestamp: '2026-05-05 01:58:44', actor: 'system', actorRole: 'service', action: 'MEMBER_REMOVED', table: 'group_members', recordId: 'gm_6a1d...', severity: 'warning', metadata: 'Removed by pool admin — pool: NBA Finals G7' },
  { id: 'a009', timestamp: '2026-05-05 01:47:09', actor: 'admin@poolparty', actorRole: 'superadmin', action: 'SCHEMA_MIGRATION', table: 'system', recordId: 'mig_001...', severity: 'critical', metadata: 'Migration 20260505_add_leagues applied' },
  { id: 'a010', timestamp: '2026-05-05 01:39:52', actor: 'system', actorRole: 'service', action: 'BADGE_AWARDED', table: 'user_badges', recordId: 'ubg_9f3c...', severity: 'info', metadata: 'badge=Perfect Payer, user=TDking88' },
  { id: 'a011', timestamp: '2026-05-05 01:28:17', actor: 'mod_jkelly', actorRole: 'moderator', action: 'POOL_LOCKED_EARLY', table: 'pools', recordId: 'pool_2e5a...', severity: 'warning', metadata: 'Admin early lock — 2h before deadline' },
  { id: 'a012', timestamp: '2026-05-05 01:14:03', actor: 'system', actorRole: 'service', action: 'SMS_SENT', table: 'notifications', recordId: 'ntf_7b4e...', severity: 'info', metadata: 'Plivo nudge — payment reminder #3' },
  { id: 'a013', timestamp: '2026-05-05 01:02:38', actor: 'admin@poolparty', actorRole: 'superadmin', action: 'ROLE_CHANGED', table: 'users', recordId: 'usr_3d9f...', severity: 'critical', metadata: 'role: user → moderator' },
  { id: 'a014', timestamp: '2026-05-04 23:51:14', actor: 'system', actorRole: 'service', action: 'DATA_EXPORT_CREATED', table: 'data_exports', recordId: 'exp_1a8c...', severity: 'info', metadata: 'User-requested GDPR export' },
  { id: 'a015', timestamp: '2026-05-04 23:44:29', actor: 'system', actorRole: 'service', action: 'DISPUTE_OPENED', table: 'disputes', recordId: 'dsp_8e2b...', severity: 'warning', metadata: 'filed_by=GoalMachine, respondent=LuckyDraw' },
];

// ─── Severity Config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; icon: React.ElementType; border: string }> = {
  critical: { label: 'Critical', color: '#FF4D8D', bg: 'rgba(255,77,141,0.15)', icon: AlertCircle, border: 'rgba(255,77,141,0.3)' },
  warning: { label: 'Warning', color: '#FFC857', bg: 'rgba(255,200,87,0.15)', icon: AlertTriangle, border: 'rgba(255,200,87,0.3)' },
  info: { label: 'Info', color: '#00C9A7', bg: 'rgba(0,201,167,0.15)', icon: Info, border: 'rgba(0,201,167,0.3)' },
};

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ─── Audit Log Module ─────────────────────────────────────────────────────────

export default function AuditLog() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [entries, setEntries] = useState<AuditEntry[]>(AUDIT_ENTRIES);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('audit_logs')
      .select('*, user:user_id(full_name, username)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setEntries(
            data.map((log: any) => ({
              id: log.id,
              timestamp: new Date(log.created_at).toLocaleString(),
              actor: log.user?.username || log.user?.full_name || 'system',
              actorRole: log.user ? 'user' : 'service',
              action: log.action,
              table: log.resource_type || 'system',
              recordId: log.resource_id ? log.resource_id.slice(0, 8) + '...' : 'N/A',
              severity: (log.severity === 'critical' || log.severity === 'warning' || log.severity === 'info')
                ? log.severity as Severity
                : 'info',
              metadata: log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : '',
            }))
          );
        }
      });
  }, []);

  const criticalCount = entries.filter(e => e.severity === 'critical').length;
  const warningCount = entries.filter(e => e.severity === 'warning').length;

  const filtered = entries.filter(entry => {
    const matchSev = severityFilter === 'all' || entry.severity === severityFilter;
    const matchSearch = search === '' ||
      entry.action.toLowerCase().includes(search.toLowerCase()) ||
      entry.actor.toLowerCase().includes(search.toLowerCase()) ||
      entry.table.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      {criticalCount > 0 && (
        <div className="rounded-2xl px-5 py-4 flex items-start gap-3" style={{ background: 'rgba(255,77,141,0.08)', border: '1px solid rgba(255,77,141,0.3)' }}>
          <AlertCircle size={18} style={{ color: '#FF4D8D', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#FF4D8D' }}>
              {criticalCount} critical action{criticalCount > 1 ? 's' : ''} in the last 24 hours
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Review all critical entries below. This log is immutable — entries cannot be edited or deleted.
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Entries', value: entries.length, icon: FileText, color: '#7C5CFF', bg: 'rgba(124,92,255,0.12)' },
          { label: 'Critical Actions', value: criticalCount, icon: AlertCircle, color: '#FF4D8D', bg: 'rgba(255,77,141,0.12)' },
          { label: 'Warnings', value: warningCount, icon: AlertTriangle, color: '#FFC857', bg: 'rgba(255,200,87,0.12)' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: k.bg }}>
              <k.icon size={20} style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{k.value}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search by action, actor, or table..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
          {(['all', 'critical', 'warning', 'info'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                background: severityFilter === s ? (s === 'all' ? 'var(--primary)' : SEVERITY_CONFIG[s as Severity]?.bg ?? 'var(--primary)') : 'transparent',
                color: severityFilter === s ? (s === 'all' ? '#fff' : SEVERITY_CONFIG[s as Severity]?.color ?? '#fff') : 'var(--muted-foreground)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Immutable Notice */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.15)' }}>
        <Shield size={14} style={{ color: '#7C5CFF' }} />
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          This log is <strong style={{ color: 'var(--foreground)' }}>append-only and immutable</strong>. No entries can be edited or removed.
        </p>
      </div>

      {/* Log Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-semibold" style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2">Actor</div>
          <div className="col-span-2">Action</div>
          <div className="col-span-1">Table</div>
          <div className="col-span-2">Severity</div>
          <div className="col-span-3">Metadata</div>
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {filtered.map(entry => {
            const cfg = SEVERITY_CONFIG[entry.severity];
            return (
              <div
                key={entry.id}
                className="grid grid-cols-12 gap-2 px-5 py-3.5 items-start"
                style={{ borderLeft: `3px solid ${entry.severity !== 'info' ? cfg.color : 'transparent'}` }}
              >
                <div className="col-span-2">
                  <p className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {entry.timestamp.split(' ')[0]}
                  </p>
                  <p className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {entry.timestamp.split(' ')[1]}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{entry.actor}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{entry.actorRole}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{entry.action}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>{entry.recordId}</p>
                </div>
                <div className="col-span-1">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,92,255,0.1)', color: '#7C5CFF', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                    {entry.table}
                  </span>
                </div>
                <div className="col-span-2">
                  <SeverityBadge severity={entry.severity} />
                </div>
                <div className="col-span-3">
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{entry.metadata}</p>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
            <FileText size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No entries match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
