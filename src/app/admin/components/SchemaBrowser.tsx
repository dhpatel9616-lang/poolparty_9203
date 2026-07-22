'use client';
import React, { useState } from 'react';
import { Database, ChevronDown, ChevronUp, Search, Table2, Hash, Type, ToggleLeft, Calendar, Link } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


// ─── Schema Data ──────────────────────────────────────────────────────────────

interface SchemaField {
  name: string;
  type: string;
  nullable: boolean;
  pk?: boolean;
  fk?: string;
}

interface SchemaTable {
  name: string;
  category: string;
  rowCount: string;
  fields: SchemaField[];
}

const SCHEMA_TABLES: SchemaTable[] = [
  { name: 'users', category: 'Auth', rowCount: '12.4K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'phone', type: 'text', nullable: false }, { name: 'display_name', type: 'text', nullable: true }, { name: 'username', type: 'text', nullable: true }, { name: 'profile_photo_url', type: 'text', nullable: true }, { name: 'bio', type: 'text', nullable: true }, { name: 'account_status', type: 'text', nullable: false }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'pools', category: 'Core', rowCount: '8.7K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'creator_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'group_id', type: 'uuid', nullable: true, fk: 'groups.id' }, { name: 'title', type: 'text', nullable: false }, { name: 'description', type: 'text', nullable: true }, { name: 'status', type: 'text', nullable: false }, { name: 'stake_note', type: 'text', nullable: true }, { name: 'rules', type: 'text', nullable: true }, { name: 'source_url', type: 'text', nullable: true }, { name: 'lock_time', type: 'timestamptz', nullable: true }, { name: 'resolved_at', type: 'timestamptz', nullable: true }, { name: 'winning_outcome_id', type: 'uuid', nullable: true }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'pool_outcomes', category: 'Core', rowCount: '21.3K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'pool_id', type: 'uuid', nullable: false, fk: 'pools.id' }, { name: 'label', type: 'text', nullable: false }, { name: 'weight', type: 'numeric', nullable: true }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'pool_entries', category: 'Core', rowCount: '47.2K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'pool_id', type: 'uuid', nullable: false, fk: 'pools.id' }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'outcome_id', type: 'uuid', nullable: false, fk: 'pool_outcomes.id' }, { name: 'amount', type: 'numeric', nullable: true }, { name: 'stake_note', type: 'text', nullable: true }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'pool_participants', category: 'Core', rowCount: '38.1K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'pool_id', type: 'uuid', nullable: false, fk: 'pools.id' }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'joined_at', type: 'timestamptz', nullable: false }] },
  { name: 'pool_resolutions', category: 'Core', rowCount: '3.2K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'pool_id', type: 'uuid', nullable: false, fk: 'pools.id' }, { name: 'winning_outcome_id', type: 'uuid', nullable: false }, { name: 'resolved_by', type: 'uuid', nullable: true, fk: 'users.id' }, { name: 'evidence_text', type: 'text', nullable: true }, { name: 'evidence_url', type: 'text', nullable: true }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'groups', category: 'Social', rowCount: '1.1K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'name', type: 'text', nullable: false }, { name: 'description', type: 'text', nullable: true }, { name: 'emoji', type: 'text', nullable: true }, { name: 'category', type: 'text', nullable: true }, { name: 'max_members', type: 'int4', nullable: true }, { name: 'creator_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'settings', type: 'jsonb', nullable: true }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'group_members', category: 'Social', rowCount: '9.8K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'group_id', type: 'uuid', nullable: false, fk: 'groups.id' }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'role', type: 'text', nullable: false }, { name: 'joined_at', type: 'timestamptz', nullable: false }] },
  { name: 'group_invites', category: 'Social', rowCount: '4.3K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'group_id', type: 'uuid', nullable: false, fk: 'groups.id' }, { name: 'invite_code', type: 'text', nullable: false }, { name: 'invited_by', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'phone', type: 'text', nullable: true }, { name: 'status', type: 'text', nullable: false }, { name: 'expires_at', type: 'timestamptz', nullable: true }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'settlement_items', category: 'Finance', rowCount: '18.6K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'pool_id', type: 'uuid', nullable: false, fk: 'pools.id' }, { name: 'payer_id', type: 'uuid', nullable: true, fk: 'users.id' }, { name: 'receiver_id', type: 'uuid', nullable: true, fk: 'users.id' }, { name: 'amount_note', type: 'text', nullable: true }, { name: 'return_amount', type: 'numeric', nullable: true }, { name: 'status', type: 'text', nullable: false }, { name: 'method_note', type: 'text', nullable: true }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'disputes', category: 'Finance', rowCount: '412', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'pool_id', type: 'uuid', nullable: false, fk: 'pools.id' }, { name: 'filed_by', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'respondent', type: 'uuid', nullable: true, fk: 'users.id' }, { name: 'reason', type: 'text', nullable: true }, { name: 'status', type: 'text', nullable: false }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'reputation_scores', category: 'Trust', rowCount: '12.4K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'score', type: 'int4', nullable: false }, { name: 'tier', type: 'text', nullable: false }, { name: 'updated_at', type: 'timestamptz', nullable: false }] },
  { name: 'settlement_reputation', category: 'Trust', rowCount: '31.7K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'delta', type: 'int4', nullable: false }, { name: 'reason', type: 'text', nullable: false }, { name: 'pool_id', type: 'uuid', nullable: true }, { name: 'score_before', type: 'int4', nullable: false }, { name: 'score_after', type: 'int4', nullable: false }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'user_badges', category: 'Trust', rowCount: '7.2K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'badge_id', type: 'uuid', nullable: false, fk: 'badges.id' }, { name: 'earned_at', type: 'timestamptz', nullable: false }] },
  { name: 'badges', category: 'Trust', rowCount: '24', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'name', type: 'text', nullable: false }, { name: 'description', type: 'text', nullable: true }, { name: 'icon', type: 'text', nullable: true }] },
  { name: 'activities', category: 'Events', rowCount: '94.1K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'activity_type', type: 'text', nullable: false }, { name: 'actor_id', type: 'uuid', nullable: true, fk: 'users.id' }, { name: 'pool_id', type: 'uuid', nullable: true, fk: 'pools.id' }, { name: 'group_id', type: 'uuid', nullable: true, fk: 'groups.id' }, { name: 'metadata', type: 'jsonb', nullable: true }, { name: 'read_at', type: 'timestamptz', nullable: true }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'notifications', category: 'Events', rowCount: '48.3K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'title', type: 'text', nullable: false }, { name: 'body', type: 'text', nullable: true }, { name: 'type', type: 'text', nullable: true }, { name: 'read_at', type: 'timestamptz', nullable: true }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'comments', category: 'Events', rowCount: '22.8K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'pool_id', type: 'uuid', nullable: false, fk: 'pools.id' }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'text', type: 'text', nullable: false }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'user_settings', category: 'Config', rowCount: '12.4K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'push_enabled', type: 'bool', nullable: false }, { name: 'sms_enabled', type: 'bool', nullable: false }, { name: 'payment_reminders_enabled', type: 'bool', nullable: false }, { name: 'dispute_alerts_enabled', type: 'bool', nullable: false }, { name: 'profile_public', type: 'bool', nullable: false }, { name: 'dark_mode_enabled', type: 'bool', nullable: false }, { name: 'updated_at', type: 'timestamptz', nullable: false }] },
  { name: 'user_behavior_profiles', category: 'Config', rowCount: '12.4K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'settlement_reliability', type: 'numeric', nullable: true }, { name: 'win_rate', type: 'numeric', nullable: true }, { name: 'dispute_rate', type: 'numeric', nullable: true }, { name: 'updated_at', type: 'timestamptz', nullable: false }] },
  { name: 'blacklist_entries', category: 'Trust', rowCount: '89', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'group_id', type: 'uuid', nullable: false, fk: 'groups.id' }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'reason', type: 'text', nullable: true }, { name: 'created_by', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'unpaid_flags', category: 'Finance', rowCount: '143', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'settlement_item_id', type: 'uuid', nullable: false, fk: 'settlement_items.id' }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'data_exports', category: 'Config', rowCount: '31', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'user_id', type: 'uuid', nullable: false, fk: 'users.id' }, { name: 'status', type: 'text', nullable: false }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
  { name: 'audit_logs', category: 'Admin', rowCount: '8.9K', fields: [{ name: 'id', type: 'uuid', nullable: false, pk: true }, { name: 'actor_id', type: 'uuid', nullable: true, fk: 'users.id' }, { name: 'action', type: 'text', nullable: false }, { name: 'table_name', type: 'text', nullable: true }, { name: 'record_id', type: 'uuid', nullable: true }, { name: 'severity', type: 'text', nullable: false }, { name: 'metadata', type: 'jsonb', nullable: true }, { name: 'created_at', type: 'timestamptz', nullable: false }] },
];

const CATEGORIES = ['All', ...Array.from(new Set(SCHEMA_TABLES.map(t => t.category)))];

const TYPE_ICON: Record<string, React.ElementType> = {
  uuid: Hash,
  text: Type,
  bool: ToggleLeft,
  timestamptz: Calendar,
  int4: Hash,
  numeric: Hash,
  jsonb: Database,
};

function FieldTypeIcon({ type }: { type: string }) {
  const Icon = TYPE_ICON[type] ?? Type;
  return <Icon size={11} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />;
}

// ─── Schema Browser ───────────────────────────────────────────────────────────

export default function SchemaBrowser() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SCHEMA_TABLES.filter(t => {
    const matchCat = category === 'All' || t.category === category;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,92,255,0.12)' }}>
            <Database size={20} style={{ color: '#7C5CFF' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{SCHEMA_TABLES.length} Tables</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>PoolParty public schema</p>
          </div>
        </div>
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search tables..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: category === cat ? 'var(--primary)' : 'var(--elevated)',
              color: category === cat ? '#fff' : 'var(--muted-foreground)',
              border: `1px solid ${category === cat ? 'var(--primary)' : 'var(--border)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(table => {
          const isExpanded = expanded === table.name;
          return (
            <div
              key={table.name}
              className="rounded-2xl overflow-hidden transition-all"
              style={{ background: 'var(--surface)', border: `1px solid ${isExpanded ? 'var(--primary)' : 'var(--border)'}` }}
            >
              {/* Table Header */}
              <button
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() => setExpanded(isExpanded ? null : table.name)}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,92,255,0.12)' }}>
                  <Table2 size={15} style={{ color: '#7C5CFF' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{table.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,92,255,0.1)', color: '#7C5CFF', fontSize: 10 }}>{table.category}</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{table.rowCount} rows</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />}
              </button>

              {/* Field List */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold pt-3 pb-1" style={{ color: 'var(--muted-foreground)' }}>
                    {table.fields.length} FIELDS
                  </p>
                  {table.fields.map(field => (
                    <div key={field.name} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: 'var(--elevated)' }}>
                      <FieldTypeIcon type={field.type} />
                      <span className="text-xs flex-1 truncate" style={{ color: 'var(--foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{field.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {field.pk && <span className="text-xs px-1 rounded" style={{ background: 'rgba(255,200,87,0.15)', color: '#FFC857', fontSize: 9 }}>PK</span>}
                        {field.fk && <Link size={9} style={{ color: '#00C9A7' }} />}
                        {field.nullable && <span className="text-xs" style={{ color: 'var(--muted-foreground)', fontSize: 9 }}>?</span>}
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}>{field.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
          <Database size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No tables match "{search}"</p>
        </div>
      )}
    </div>
  );
}
