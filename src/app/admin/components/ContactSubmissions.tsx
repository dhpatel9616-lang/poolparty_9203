'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, MessageSquare } from 'lucide-react';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: string;
  admin_notes: string;
  created_at: string;
}

const STATUS_OPTIONS = ['new', 'open', 'in_progress', 'resolved', 'closed'];
const STATUS_COLORS: Record<string, string> = {
  new: '#7C5CFF',
  open: '#0052FF',
  in_progress: '#F59E0B',
  resolved: '#00C9A7',
  closed: 'var(--muted-foreground)',
};

export default function ContactSubmissions() {
  const supabase = createClient();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });
    if (data) setSubmissions(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const topics = ['all', ...Array.from(new Set(submissions.map((s) => s.topic)))];

  const filtered = submissions.filter((s) => {
    const matchSearch = search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()) || s.topic.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchTopic = filterTopic === 'all' || s.topic === filterTopic;
    return matchSearch && matchStatus && matchTopic;
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from('contact_submissions').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase.from('contact_submissions').update({ admin_notes: notes, updated_at: new Date().toISOString() }).eq('id', selected.id);
    setSaving(false);
    load();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Contact Submissions</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
          {topics.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Topics' : t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--elevated)' }} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center" style={{ background: 'var(--surface)' }}><p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No submissions found</p></div>
          ) : (
            filtered.map((sub, i) => (
              <button
                key={sub.id}
                onClick={() => { setSelected(sub); setNotes(sub.admin_notes || ''); }}
                className={`w-full flex items-start justify-between px-4 py-3.5 text-left transition-all ${i < filtered.length - 1 ? 'border-b' : ''} ${selected?.id === sub.id ? 'bg-white/5' : ''}`}
                style={{ background: selected?.id === sub.id ? 'rgba(124,92,255,0.08)' : 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <MessageSquare size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{sub.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sub.topic} · {new Date(sub.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2" style={{ background: `${STATUS_COLORS[sub.status]}20`, color: STATUS_COLORS[sub.status] }}>
                  {sub.status}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">{selected.name}</h3>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{selected.email}</p>
              </div>
              <select
                value={selected.status}
                onChange={(e) => handleUpdateStatus(selected.id, e.target.value)}
                className="px-2 py-1 rounded-lg text-xs font-semibold outline-none"
                style={{ background: `${STATUS_COLORS[selected.status]}20`, color: STATUS_COLORS[selected.status], border: `1px solid ${STATUS_COLORS[selected.status]}40` }}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>TOPIC</p>
              <p className="text-sm text-foreground">{selected.topic}</p>
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>MESSAGE</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{selected.message}</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>ADMIN NOTES</p>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none mb-2" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
              <button onClick={handleSaveNotes} disabled={saving} className="w-full py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', minHeight: '200px' }}>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Select a submission to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
