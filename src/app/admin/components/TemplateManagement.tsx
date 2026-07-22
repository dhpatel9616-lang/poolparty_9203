'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Edit3, Archive, Star, BarChart2, CheckCircle, Zap, Eye, Copy, Flame, BadgeCheck, ChevronDown, ChevronUp, Save,  } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface Template {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon: string;
  pool_type: string;
  is_featured: boolean;
  is_official: boolean;
  status: string;
  launch_count: number;
  participant_count: number;
  difficulty_score: number;
  default_expiration: string;
  category?: { name: string; icon: string } | null;
  analytics?: {
    views: number;
    clones: number;
    launches: number;
    invites: number;
    joins: number;
    completion_rate: number;
    viral_coefficient: number;
  } | null;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface ResolutionSource {
  id: string;
  name: string;
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: 'mock-1', title: 'NFL Weekly Picks', subtitle: 'Pick the winner of every NFL game this week',
    description: 'Classic NFL weekly prediction pool.', icon: '🏈', pool_type: 'prediction',
    is_featured: true, is_official: true, status: 'active', launch_count: 4821, participant_count: 32400,
    difficulty_score: 2, default_expiration: '7 days', category: { name: 'Sports', icon: '🏆' },
    analytics: { views: 24105, clones: 4821, launches: 4821, invites: 28926, joins: 32400, completion_rate: 87.5, viral_coefficient: 2.4 },
  },
  {
    id: 'mock-2', title: 'Bitcoin Price Prediction', subtitle: 'Will BTC hit $100K?',
    description: 'Predict whether Bitcoin will reach a target price.', icon: '₿', pool_type: 'prediction',
    is_featured: true, is_official: false, status: 'active', launch_count: 2478, participant_count: 14200,
    difficulty_score: 2, default_expiration: '30 days', category: { name: 'Crypto', icon: '₿' },
    analytics: { views: 12390, clones: 2478, launches: 2478, invites: 14868, joins: 14200, completion_rate: 78.3, viral_coefficient: 1.9 },
  },
  {
    id: 'mock-3', title: 'March Madness Bracket', subtitle: 'Fill out your NCAA bracket',
    description: 'Complete bracket challenge for March Madness.', icon: '🏀', pool_type: 'bracket',
    is_featured: false, is_official: true, status: 'active', launch_count: 1987, participant_count: 11600,
    difficulty_score: 4, default_expiration: '21 days', category: { name: 'Sports', icon: '🏆' },
    analytics: { views: 9935, clones: 1987, launches: 1987, invites: 11922, joins: 11600, completion_rate: 83.7, viral_coefficient: 2.0 },
  },
];

type AdminView = 'list' | 'analytics' | 'create';

export default function TemplateManagement() {
  const supabase = createClient();
  const [view, setView] = useState<AdminView>('list');
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const [categories, setCategories] = useState<Category[]>([]);
  const [resolutionSources, setResolutionSources] = useState<ResolutionSource[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create form state
  const [newTemplate, setNewTemplate] = useState({
    title: '', subtitle: '', description: '', icon: '🎯',
    pool_type: 'prediction', category_id: '', resolution_source_id: '',
    default_expiration: '7 days', difficulty_score: 2,
    is_featured: false, is_official: false, resolution_rules: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        supabase.from('pool_templates').select(`*, category:pool_template_categories(name, icon), analytics:pool_template_analytics(*)`).order('launch_count', { ascending: false }).limit(50),
        supabase.from('pool_template_categories').select('id, name, icon').order('sort_order'),
        supabase.from('verified_resolution_sources').select('id, name'),
      ]);
      if (tRes.data && tRes.data.length > 0) setTemplates(tRes.data as Template[]);
      if (cRes.data) setCategories(cRes.data);
      if (sRes.data) setResolutionSources(sRes.data);
    } catch {}
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await supabase.from('pool_templates').update({ is_featured: !current }).eq('id', id);
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_featured: !current } : t));
    } catch {}
  };

  const handleArchive = async (id: string) => {
    try {
      await supabase.from('pool_templates').update({ status: 'archived' }).eq('id', id);
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: 'archived' } : t));
    } catch {}
  };

  const handleCreate = async () => {
    if (!newTemplate.title.trim()) return;
    setIsLoading(true);
    try {
      const { data } = await supabase.from('pool_templates').insert({
        title: newTemplate.title,
        subtitle: newTemplate.subtitle || null,
        description: newTemplate.description || null,
        icon: newTemplate.icon,
        pool_type: newTemplate.pool_type,
        category_id: newTemplate.category_id || null,
        resolution_source_id: newTemplate.resolution_source_id || null,
        default_expiration: newTemplate.default_expiration,
        difficulty_score: newTemplate.difficulty_score,
        is_featured: newTemplate.is_featured,
        is_official: newTemplate.is_official,
        resolution_rules: newTemplate.resolution_rules || null,
        status: 'active',
      }).select().single();
      if (data) {
        setTemplates(prev => [data as Template, ...prev]);
        setView('list');
        setNewTemplate({
          title: '', subtitle: '', description: '', icon: '🎯',
          pool_type: 'prediction', category_id: '', resolution_source_id: '',
          default_expiration: '7 days', difficulty_score: 2,
          is_featured: false, is_official: false, resolution_rules: '',
        });
      }
    } catch {}
    setIsLoading(false);
  };

  // Analytics aggregates
  const totalViews = templates.reduce((s, t) => s + (t.analytics?.views ?? 0), 0);
  const totalClones = templates.reduce((s, t) => s + (t.analytics?.clones ?? 0), 0);
  const totalLaunches = templates.reduce((s, t) => s + (t.analytics?.launches ?? 0), 0);
  const avgCompletion = templates.length > 0
    ? (templates.reduce((s, t) => s + (t.analytics?.completion_rate ?? 0), 0) / templates.length).toFixed(1)
    : '0';

  return (
    <div>
      {/* Sub-nav */}
      <div className="flex gap-2 mb-6">
        {(['list', 'analytics', 'create'] as AdminView[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
            style={{
              background: view === v ? 'var(--primary)' : 'var(--surface)',
              color: view === v ? '#fff' : 'var(--muted-foreground)',
              border: '1px solid var(--border)',
            }}
          >
            {v === 'list' ? 'Templates' : v === 'analytics' ? 'Analytics' : 'Create New'}
          </button>
        ))}
      </div>

      {/* ANALYTICS VIEW */}
      {view === 'analytics' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: '#7C5CFF' },
              { label: 'Total Clones', value: totalClones.toLocaleString(), icon: Copy, color: '#FF4D8D' },
              { label: 'Total Launches', value: totalLaunches.toLocaleString(), icon: Zap, color: '#00C9A7' },
              { label: 'Avg Completion', value: `${avgCompletion}%`, icon: CheckCircle, color: '#00C853' },
            ].map(kpi => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="rounded-2xl p-4"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} style={{ color: kpi.color }} />
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{kpi.label}</span>
                  </div>
                  <p className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>{kpi.value}</p>
                </div>
              );
            })}
          </div>

          {/* Most Cloned */}
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Copy size={14} style={{ color: 'var(--primary)' }} /> Most Cloned Templates
            </h3>
            <div className="space-y-2">
              {[...templates].sort((a, b) => (b.analytics?.clones ?? 0) - (a.analytics?.clones ?? 0)).slice(0, 5).map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span className="text-sm font-black w-5 text-center" style={{ color: 'var(--muted-foreground)' }}>
                    {i + 1}
                  </span>
                  <span className="text-lg">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{t.title}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{t.category?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black" style={{ color: 'var(--primary)' }}>
                      {(t.analytics?.clones ?? 0).toLocaleString()}
                    </p>
                    <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>clones</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Viral Coefficient */}
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Flame size={14} color="#FF6B35" /> Highest Viral Coefficient
            </h3>
            <div className="space-y-2">
              {[...templates].sort((a, b) => (b.analytics?.viral_coefficient ?? 0) - (a.analytics?.viral_coefficient ?? 0)).slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span className="text-lg">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{t.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{
                          background: '#FF6B35',
                          width: `${Math.min(100, ((t.analytics?.viral_coefficient ?? 0) / 3) * 100)}%`,
                        }} />
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-black" style={{ color: '#FF6B35' }}>
                    {t.analytics?.viral_coefficient ?? 0}x
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Performance */}
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <BarChart2 size={14} style={{ color: '#00C9A7' }} /> Category Performance
            </h3>
            <div className="space-y-2">
              {Object.entries(
                templates.reduce((acc, t) => {
                  const cat = t.category?.name ?? 'Uncategorized';
                  if (!acc[cat]) acc[cat] = { launches: 0, clones: 0, icon: t.category?.icon ?? '🎯' };
                  acc[cat].launches += t.launch_count;
                  acc[cat].clones += t.analytics?.clones ?? 0;
                  return acc;
                }, {} as Record<string, { launches: number; clones: number; icon: string }>)
              ).sort((a, b) => b[1].launches - a[1].launches).map(([cat, data]) => (
                <div key={cat} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span className="text-xl">{data.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{cat}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{data.clones.toLocaleString()} clones</p>
                  </div>
                  <p className="text-sm font-black" style={{ color: 'var(--primary)' }}>
                    {data.launches.toLocaleString()} launches
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE VIEW */}
      {view === 'create' && (
        <div className="space-y-4">
          <h3 className="text-base font-black" style={{ color: 'var(--foreground)' }}>Create New Template</h3>

          {[
            { label: 'Title *', key: 'title', placeholder: 'Template title...' },
            { label: 'Subtitle', key: 'subtitle', placeholder: 'Short description...' },
            { label: 'Icon (emoji)', key: 'icon', placeholder: '🎯' },
            { label: 'Default Expiration', key: 'default_expiration', placeholder: '7 days' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                {field.label.toUpperCase()}
              </label>
              <input
                type="text"
                value={(newTemplate as Record<string, unknown>)[field.key] as string}
                onChange={e => setNewTemplate(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          ))}

          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--muted-foreground)' }}>DESCRIPTION</label>
            <textarea
              value={newTemplate.description}
              onChange={e => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Full description..."
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--muted-foreground)' }}>POOL TYPE</label>
            <select
              value={newTemplate.pool_type}
              onChange={e => setNewTemplate(prev => ({ ...prev, pool_type: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              {['prediction', 'challenge', 'agreement', 'group_pool', 'fantasy', 'bracket'].map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {categories.length > 0 && (
            <div>
              <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--muted-foreground)' }}>CATEGORY</label>
              <select
                value={newTemplate.category_id}
                onChange={e => setNewTemplate(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <option value="">Select category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          )}

          {resolutionSources.length > 0 && (
            <div>
              <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--muted-foreground)' }}>VERIFIED RESOLUTION SOURCE</label>
              <select
                value={newTemplate.resolution_source_id}
                onChange={e => setNewTemplate(prev => ({ ...prev, resolution_source_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <option value="">None</option>
                {resolutionSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--muted-foreground)' }}>RESOLUTION RULES</label>
            <textarea
              value={newTemplate.resolution_rules}
              onChange={e => setNewTemplate(prev => ({ ...prev, resolution_rules: e.target.value }))}
              rows={3}
              placeholder="How will this pool be resolved?"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
              DIFFICULTY (1-5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setNewTemplate(prev => ({ ...prev, difficulty_score: n }))}
                  className="w-10 h-10 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: newTemplate.difficulty_score === n ? 'var(--primary)' : 'var(--surface)',
                    color: newTemplate.difficulty_score === n ? '#fff' : 'var(--muted-foreground)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {[
              { key: 'is_featured', label: 'Featured' },
              { key: 'is_official', label: 'Official' },
            ].map(toggle => (
              <label key={toggle.key} className="flex items-center gap-2 cursor-pointer">
                <div
                  className="w-10 h-6 rounded-full relative transition-all"
                  style={{
                    background: (newTemplate as Record<string, unknown>)[toggle.key] ? 'var(--primary)' : 'var(--border)',
                  }}
                  onClick={() => setNewTemplate(prev => ({ ...prev, [toggle.key]: !(prev as Record<string, unknown>)[toggle.key] }))}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: (newTemplate as Record<string, unknown>)[toggle.key] ? '22px' : '2px' }}
                  />
                </div>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{toggle.label}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleCreate}
            disabled={isLoading || !newTemplate.title.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'var(--primary)', color: '#fff',
              opacity: isLoading || !newTemplate.title.trim() ? 0.6 : 1,
            }}
          >
            <Save size={16} />
            {isLoading ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              >
                <span className="text-2xl flex-shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>{t.title}</p>
                    {t.is_official && <BadgeCheck size={13} color="#7C5CFF" />}
                    {t.is_featured && <Star size={13} color="#FFD700" fill="#FFD700" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-2xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: t.status === 'active' ? 'rgba(0,200,83,0.15)' : 'rgba(255,107,53,0.15)',
                        color: t.status === 'active' ? '#00C853' : '#FF6B35',
                      }}
                    >
                      {t.status}
                    </span>
                    <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                      {t.category?.name}
                    </span>
                    <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                      {t.launch_count.toLocaleString()} launches
                    </span>
                  </div>
                </div>
                {expandedId === t.id ? (
                  <ChevronUp size={16} style={{ color: 'var(--muted-foreground)' }} />
                ) : (
                  <ChevronDown size={16} style={{ color: 'var(--muted-foreground)' }} />
                )}
              </div>

              {expandedId === t.id && (
                <div className="px-3 pb-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  {/* Analytics mini */}
                  {t.analytics && (
                    <div className="grid grid-cols-4 gap-2 py-3">
                      {[
                        { label: 'Views', value: t.analytics.views.toLocaleString() },
                        { label: 'Clones', value: t.analytics.clones.toLocaleString() },
                        { label: 'Join Rate', value: `${t.analytics.completion_rate}%` },
                        { label: 'Viral', value: `${t.analytics.viral_coefficient}x` },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <p className="text-sm font-black" style={{ color: 'var(--foreground)' }}>{s.value}</p>
                          <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleToggleFeatured(t.id, t.is_featured)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: t.is_featured ? 'rgba(255,215,0,0.15)' : 'var(--elevated)',
                        color: t.is_featured ? '#FFD700' : 'var(--muted-foreground)',
                        border: `1px solid ${t.is_featured ? '#FFD700' : 'var(--border)'}`,
                      }}
                    >
                      <Star size={12} fill={t.is_featured ? '#FFD700' : 'none'} />
                      {t.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => setEditingId(t.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                    {t.status === 'active' && (
                      <button
                        onClick={() => handleArchive(t.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.3)' }}
                      >
                        <Archive size={12} /> Archive
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
