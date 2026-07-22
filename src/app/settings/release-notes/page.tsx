'use client';
import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ReleaseNote {
  id: string;
  version: string;
  release_date: string;
  title: string;
  description: string;
  bug_fixes: string;
  new_features: string;
  improvements: string;
}

export default function ReleaseNotesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('release_notes')
        .select('*')
        .eq('status', 'published')
        .order('release_date', { ascending: false });
      if (data) setNotes(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b"
          style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => router.push('/settings')}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <h1 className="text-xl font-bold text-foreground">Release Notes</h1>
        </div>

        <div className="px-4 py-6 pb-24 overflow-y-auto space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1,2].map(i => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--elevated)' }} />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No release notes yet.</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}
                  >
                    <Tag size={11} />
                    v{note.version}
                  </div>
                  {note.release_date && (
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {new Date(note.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{note.title}</h3>
                {note.description && (
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--muted-foreground)' }}>{note.description}</p>
                )}
                {note.new_features && (
                  <div className="mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#00C9A7' }}>New Features</p>
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{note.new_features}</p>
                  </div>
                )}
                {note.improvements && (
                  <div className="mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--primary)' }}>Improvements</p>
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{note.improvements}</p>
                  </div>
                )}
                {note.bug_fixes && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#F59E0B' }}>Bug Fixes</p>
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{note.bug_fixes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
