'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Tag } from 'lucide-react';

interface ReleaseNote {
  id: string;
  version: string;
  release_date: string;
  title: string;
  description: string;
  bug_fixes: string;
  new_features: string;
  improvements: string;
  status: string;
  published_at: string | null;
}

interface EditorProps {
  note: ReleaseNote | null;
  onClose: () => void;
  onSaved: () => void;
}

function ReleaseNoteEditor({ note, onClose, onSaved }: EditorProps) {
  const supabase = createClient();
  const [version, setVersion] = useState(note?.version || '');
  const [releaseDate, setReleaseDate] = useState(note?.release_date || new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState(note?.title || '');
  const [description, setDescription] = useState(note?.description || '');
  const [newFeatures, setNewFeatures] = useState(note?.new_features || '');
  const [improvements, setImprovements] = useState(note?.improvements || '');
  const [bugFixes, setBugFixes] = useState(note?.bug_fixes || '');
  const [saving, setSaving] = useState(false);

  const save = async (publish: boolean) => {
    setSaving(true);
    const payload = { version, release_date: releaseDate, title, description, new_features: newFeatures, improvements, bug_fixes: bugFixes, status: publish ? 'published' : 'draft', ...(publish ? { published_at: new Date().toISOString() } : {}) };
    if (note) {
      await supabase.from('release_notes').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', note.id);
    } else {
      await supabase.from('release_notes').insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl my-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-bold text-foreground">{note ? 'Edit Release Note' : 'New Release Note'}</h3>
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)' }}>Cancel</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Version</label>
              <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Release Date</label>
              <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#00C9A7' }}>New Features</label>
            <textarea value={newFeatures} onChange={(e) => setNewFeatures(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--primary)' }}>Improvements</label>
            <textarea value={improvements} onChange={(e) => setImprovements(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#F59E0B' }}>Bug Fixes</label>
            <textarea value={bugFixes} onChange={(e) => setBugFixes(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => save(false)} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--elevated)', color: 'var(--foreground)' }}>Save Draft</button>
          <button onClick={() => save(true)} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReleaseNotesAdmin() {
  const supabase = createClient();
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editNote, setEditNote] = useState<ReleaseNote | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('release_notes').select('*').order('release_date', { ascending: false });
    if (data) setNotes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUnpublish = async (id: string) => {
    await supabase.from('release_notes').update({ status: 'draft', published_at: null }).eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Release Notes</h2>
        <button onClick={() => { setEditNote(null); setShowEditor(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
          <Plus size={15} /> New Release
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--elevated)' }} />)}</div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}>
                    <Tag size={11} /> v{note.version}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: note.status === 'published' ? 'rgba(0,201,167,0.12)' : 'rgba(245,158,11,0.12)', color: note.status === 'published' ? '#00C9A7' : '#F59E0B' }}>
                    {note.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditNote(note); setShowEditor(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
                    <Edit2 size={13} style={{ color: 'var(--foreground)' }} />
                  </button>
                  {note.status === 'published' && (
                    <button onClick={() => handleUnpublish(note.id)} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)' }}>Unpublish</button>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">{note.title}</p>
              {note.description && <p className="text-xs mt-1 truncate" style={{ color: 'var(--muted-foreground)' }}>{note.description}</p>}
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <ReleaseNoteEditor note={editNote} onClose={() => setShowEditor(false)} onSaved={() => { setShowEditor(false); load(); }} />
      )}
    </div>
  );
}
