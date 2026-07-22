'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Archive, FileText, Search } from 'lucide-react';

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  status: string;
  version: number;
  published_at: string | null;
  updated_at: string;
}

interface PageEditorProps {
  page: CmsPage | null;
  onClose: () => void;
  onSaved: () => void;
}

function PageEditor({ page, onClose, onSaved }: PageEditorProps) {
  const supabase = createClient();
  const [title, setTitle] = useState(page?.title || '');
  const [slug, setSlug] = useState(page?.slug || '');
  const [body, setBody] = useState('');
  const [metaDesc, setMetaDesc] = useState(page?.meta_description || '');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (page) {
      const load = async () => {
        const { data } = await supabase.from('cms_pages').select('body').eq('id', page.id).single();
        if (data) setBody(data.body || '');
      };
      load();
    }
  }, [page?.id]);

  const saveVersion = async (pageId: string, currentTitle: string, currentBody: string, version: number) => {
    await supabase.from('cms_page_versions').insert({ page_id: pageId, title: currentTitle, body: currentBody, version });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      if (page) {
        await saveVersion(page.id, page.title, body, page.version);
        await supabase.from('cms_pages').update({ title, slug, body, meta_description: metaDesc, status: 'draft', version: page.version + 1, updated_at: new Date().toISOString() }).eq('id', page.id);
      } else {
        await supabase.from('cms_pages').insert({ title, slug, body, meta_description: metaDesc, status: 'draft' });
      }
      onSaved();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      if (page) {
        await saveVersion(page.id, page.title, body, page.version);
        await supabase.from('cms_pages').update({ title, slug, body, meta_description: metaDesc, status: 'published', version: page.version + 1, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', page.id);
      } else {
        await supabase.from('cms_pages').insert({ title, slug, body, meta_description: metaDesc, status: 'published', published_at: new Date().toISOString() });
      }
      onSaved();
    } catch { /* ignore */ }
    setPublishing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl my-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-bold text-foreground">{page ? 'Edit Page' : 'New Page'}</h3>
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)' }}>Cancel</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Slug</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Meta Description</label>
            <input type="text" value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Body Content</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none font-mono" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={handleSaveDraft} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--elevated)', color: 'var(--foreground)' }}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={handlePublish} disabled={publishing} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  published: '#00C9A7',
  draft: '#F59E0B',
  archived: 'var(--muted-foreground)',
};

export default function ContentPages() {
  const supabase = createClient();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editPage, setEditPage] = useState<CmsPage | null | 'new'>('new' as any);
  const [showEditor, setShowEditor] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('cms_pages').select('id,title,slug,meta_description,status,version,published_at,updated_at').order('updated_at', { ascending: false });
    if (data) setPages(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = pages.filter((p) => search === '' || p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

  const handleArchive = async (id: string) => {
    await supabase.from('cms_pages').update({ status: 'archived' }).eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Content Pages</h2>
        <button
          onClick={() => { setEditPage(null); setShowEditor(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          <Plus size={15} /> New Page
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pages..." className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--elevated)' }} />)}</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center"><p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No pages found</p></div>
          ) : (
            filtered.map((page, i) => (
              <div key={page.id} className={`flex items-center justify-between px-4 py-3.5 ${i < filtered.length - 1 ? 'border-b' : ''}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{page.title}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>/{page.slug} · v{page.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[page.status]}20`, color: STATUS_COLORS[page.status] }}>
                    {page.status}
                  </span>
                  <button onClick={() => { setEditPage(page); setShowEditor(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
                    <Edit2 size={13} style={{ color: 'var(--foreground)' }} />
                  </button>
                  <button onClick={() => handleArchive(page.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
                    <Archive size={13} style={{ color: 'var(--muted-foreground)' }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showEditor && (
        <PageEditor
          page={editPage as CmsPage | null}
          onClose={() => setShowEditor(false)}
          onSaved={() => { setShowEditor(false); load(); }}
        />
      )}
    </div>
  );
}
