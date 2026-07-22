'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, AlertTriangle } from 'lucide-react';

interface ProblemReport {
  id: string;
  reporter_user_id: string | null;
  report_type: string;
  description: string;
  status: string;
  admin_notes: string;
  action_taken: string;
  created_at: string;
}

const STATUS_OPTIONS = ['new', 'in_review', 'action_taken', 'no_action_needed', 'closed'];
const STATUS_COLORS: Record<string, string> = {
  new: '#FF4D8D',
  in_review: '#F59E0B',
  action_taken: '#00C9A7',
  no_action_needed: 'var(--muted-foreground)',
  closed: 'var(--muted-foreground)',
};

export default function ProblemReports() {
  const supabase = createClient();
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selected, setSelected] = useState<ProblemReport | null>(null);
  const [notes, setNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('problem_reports').select('*').order('created_at', { ascending: false });
    if (data) setReports(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reportTypes = ['all', ...Array.from(new Set(reports.map((r) => r.report_type)))];

  const filtered = reports.filter((r) => {
    const matchSearch = search === '' || r.report_type.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchType = filterType === 'all' || r.report_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from('problem_reports').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase.from('problem_reports').update({ admin_notes: notes, action_taken: actionTaken, updated_at: new Date().toISOString() }).eq('id', selected.id);
    setSaving(false);
    load();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Problem Reports</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports..." className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
          {reportTypes.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--elevated)' }} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center" style={{ background: 'var(--surface)' }}><p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No reports found</p></div>
          ) : (
            filtered.map((report, i) => (
              <button
                key={report.id}
                onClick={() => { setSelected(report); setNotes(report.admin_notes || ''); setActionTaken(report.action_taken || ''); }}
                className={`w-full flex items-start justify-between px-4 py-3.5 text-left ${i < filtered.length - 1 ? 'border-b' : ''}`}
                style={{ background: selected?.id === report.id ? 'rgba(124,92,255,0.08)' : 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" style={{ color: STATUS_COLORS[report.status] }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{report.report_type}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{report.description.slice(0, 60)}...</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 whitespace-nowrap" style={{ background: `${STATUS_COLORS[report.status]}20`, color: STATUS_COLORS[report.status] }}>
                  {report.status.replace(/_/g, ' ')}
                </span>
              </button>
            ))
          )}
        </div>

        {selected ? (
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">{selected.report_type}</h3>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <select
                value={selected.status}
                onChange={(e) => handleUpdateStatus(selected.id, e.target.value)}
                className="px-2 py-1 rounded-lg text-xs font-semibold outline-none"
                style={{ background: `${STATUS_COLORS[selected.status]}20`, color: STATUS_COLORS[selected.status], border: `1px solid ${STATUS_COLORS[selected.status]}40` }}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>DESCRIPTION</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{selected.description}</p>
            </div>
            <div className="mb-3">
              <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>ADMIN NOTES</p>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
            </div>
            <div className="mb-3">
              <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>ACTION TAKEN</p>
              <input type="text" value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="Describe action taken..." className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
            </div>
            <button onClick={handleSaveNotes} disabled={saving} className="w-full py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', minHeight: '200px' }}>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Select a report to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
