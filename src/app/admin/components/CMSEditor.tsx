'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Phone,
  Shield,
  Scale,
  BookOpen,
  HelpCircle,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface CmsPage {
  id: string;
  title: string;
  slug: string;
  body: string;
  meta_description: string;
  status: string;
  version: number;
  published_at: string | null;
  updated_at: string;
}

const CMS_PAGES_CONFIG = [
  { slug: 'about', label: 'About Us', icon: FileText, color: '#7C5CFF' },
  { slug: 'contact', label: 'Contact Us', icon: Phone, color: '#00C9A7' },
  { slug: 'privacy', label: 'Privacy Policy', icon: Shield, color: '#3B82F6' },
  { slug: 'terms', label: 'Terms of Service', icon: Scale, color: '#F59E0B' },
  { slug: 'community-guidelines', label: 'Community Guidelines', icon: BookOpen, color: '#EC4899' },
  { slug: 'faq', label: 'FAQ', icon: HelpCircle, color: '#8B5CF6' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function CMSEditor() {
  const supabase = createClient();
  const [pages, setPages] = useState<Record<string, CmsPage>>({});
  const [activeSlug, setActiveSlug] = useState<string>('about');
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editMeta, setEditMeta] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const loadPages = useCallback(async () => {
    setLoading(true);
    const slugs = CMS_PAGES_CONFIG.map((p) => p.slug);
    const { data, error } = await supabase
      .from('cms_pages')
      .select('id,title,slug,body,meta_description,status,version,published_at,updated_at')
      .in('slug', slugs);
    if (!error && data) {
      const map: Record<string, CmsPage> = {};
      data.forEach((p) => { map[p.slug] = p; });
      setPages(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // Populate editor when active page changes
  useEffect(() => {
    const page = pages[activeSlug];
    if (page) {
      setEditTitle(page.title);
      setEditBody(page.body || '');
      setEditMeta(page.meta_description || '');
    } else {
      const config = CMS_PAGES_CONFIG.find((p) => p.slug === activeSlug);
      setEditTitle(config?.label || '');
      setEditBody('');
      setEditMeta('');
    }
    setSaveStatus('idle');
    setPreview(false);
  }, [activeSlug, pages]);

  const saveVersion = async (pageId: string, title: string, body: string, version: number) => {
    await supabase.from('cms_page_versions').insert({ page_id: pageId, title, body, version });
  };

  const handleSave = async (publish = false) => {
    setSaveStatus('saving');
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    try {
      const existing = pages[activeSlug];
      const now = new Date().toISOString();
      if (existing) {
        await saveVersion(existing.id, existing.title, existing.body, existing.version);
        const { error } = await supabase
          .from('cms_pages')
          .update({
            title: editTitle,
            body: editBody,
            meta_description: editMeta,
            status: publish ? 'published' : 'draft',
            version: existing.version + 1,
            updated_at: now,
            ...(publish ? { published_at: now } : {}),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cms_pages').insert({
          title: editTitle,
          slug: activeSlug,
          body: editBody,
          meta_description: editMeta,
          status: publish ? 'published' : 'draft',
          version: 1,
          ...(publish ? { published_at: now } : {}),
        });
        if (error) throw error;
      }
      setSaveStatus('saved');
      await loadPages();
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Auto-save draft after 3s of inactivity
  const handleBodyChange = (val: string) => {
    setEditBody(val);
    setSaveStatus('idle');
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const t = setTimeout(() => { handleSave(false); }, 3000);
    setAutoSaveTimer(t);
  };

  const activePage = pages[activeSlug];
  const activeConfig = CMS_PAGES_CONFIG.find((p) => p.slug === activeSlug)!;

  const statusColor = (status: string) => {
    if (status === 'published') return '#00C9A7';
    if (status === 'draft') return '#F59E0B';
    return 'var(--muted-foreground)';
  };

  return (
    <div className="flex gap-0 h-full" style={{ minHeight: '70dvh' }}>
      {/* Page Selector Sidebar */}
      <div
        className="w-52 flex-shrink-0 rounded-2xl mr-5 overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', alignSelf: 'flex-start' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
            CMS Pages
          </p>
        </div>
        <div className="py-2">
          {CMS_PAGES_CONFIG.map((cfg) => {
            const page = pages[cfg.slug];
            const isActive = activeSlug === cfg.slug;
            const Icon = cfg.icon;
            return (
              <button
                key={cfg.slug}
                onClick={() => setActiveSlug(cfg.slug)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{
                  background: isActive ? 'rgba(124,92,255,0.10)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${cfg.color}` : '3px solid transparent',
                }}
              >
                <Icon size={15} style={{ color: isActive ? cfg.color : 'var(--muted-foreground)', flexShrink: 0 }} />
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                  >
                    {cfg.label}
                  </p>
                  {page && (
                    <p className="text-2xs mt-0.5" style={{ color: statusColor(page.status) }}>
                      {page.status} · v{page.version}
                    </p>
                  )}
                  {!page && !loading && (
                    <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      not created
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--elevated)' }} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {/* Editor Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${activeConfig.color}18` }}
                >
                  <activeConfig.icon size={16} style={{ color: activeConfig.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{activeConfig.label}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                    /settings/{activeSlug}
                    {activePage && ` · v${activePage.version}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Save status indicator */}
                {saveStatus === 'saving' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(124,92,255,0.1)' }}>
                    <RefreshCw size={12} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>Saving…</span>
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,201,167,0.1)' }}>
                    <CheckCircle size={12} style={{ color: '#00C9A7' }} />
                    <span className="text-xs font-medium" style={{ color: '#00C9A7' }}>Saved</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <AlertCircle size={12} style={{ color: '#EF4444' }} />
                    <span className="text-xs font-medium" style={{ color: '#EF4444' }}>Error</span>
                  </div>
                )}
                <button
                  onClick={() => setPreview(!preview)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: preview ? 'rgba(124,92,255,0.12)' : 'var(--elevated)',
                    color: preview ? 'var(--primary)' : 'var(--muted-foreground)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                  {preview ? 'Edit' : 'Preview'}
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'var(--elevated)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                >
                  <Save size={13} />
                  Draft
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  Publish
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Page Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-semibold"
                  style={{
                    background: 'var(--elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Meta Description
                  <span className="ml-2 font-normal" style={{ color: 'var(--muted-foreground)' }}>
                    ({editMeta.length}/160)
                  </span>
                </label>
                <input
                  type="text"
                  value={editMeta}
                  onChange={(e) => setEditMeta(e.target.value)}
                  maxLength={160}
                  placeholder="Brief description for search engines…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              {/* Body — Editor or Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                    Page Content
                    <span className="ml-2 font-normal">(Markdown supported)</span>
                  </label>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {editBody.length} chars · auto-saves after 3s
                  </span>
                </div>

                {preview ? (
                  <div
                    className="w-full px-4 py-4 rounded-xl text-sm overflow-auto"
                    style={{
                      background: 'var(--elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                      minHeight: '420px',
                      maxHeight: '600px',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.7',
                    }}
                  >
                    {editBody || <span style={{ color: 'var(--muted-foreground)' }}>Nothing to preview yet…</span>}
                  </div>
                ) : (
                  <textarea
                    value={editBody}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    rows={22}
                    placeholder="Write page content here… Markdown is supported."
                    className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-y font-mono leading-relaxed"
                    style={{
                      background: 'var(--elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                      minHeight: '420px',
                    }}
                  />
                )}
              </div>

              {/* Status bar */}
              {activePage && (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: statusColor(activePage.status) }}
                      />
                      <span className="text-xs font-semibold capitalize" style={{ color: statusColor(activePage.status) }}>
                        {activePage.status}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Version {activePage.version}
                    </span>
                    {activePage.published_at && (
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        Published {new Date(activePage.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Updated {new Date(activePage.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
