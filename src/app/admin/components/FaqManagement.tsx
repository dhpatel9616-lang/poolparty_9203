'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, Star } from 'lucide-react';

interface FaqCategory {
  id: string;
  name: string;
  sort_order: number;
  status: string;
}

interface Faq {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  sort_order: number;
  featured: boolean;
  status: string;
}

export default function FaqManagement() {
  const supabase = createClient();
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showFaqEditor, setShowFaqEditor] = useState(false);
  const [editFaq, setEditFaq] = useState<Faq | null>(null);
  const [showCatEditor, setShowCatEditor] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('');
  const [faqFeatured, setFaqFeatured] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [catRes, faqRes] = await Promise.all([
      supabase.from('faq_categories').select('*').order('sort_order'),
      supabase.from('faqs').select('*').order('sort_order'),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (faqRes.data) setFaqs(faqRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openFaqEditor = (faq: Faq | null) => {
    setEditFaq(faq);
    setFaqQuestion(faq?.question || '');
    setFaqAnswer(faq?.answer || '');
    setFaqCategory(faq?.category_id || '');
    setFaqFeatured(faq?.featured || false);
    setShowFaqEditor(true);
  };

  const handleSaveFaq = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    setSaving(true);
    if (editFaq) {
      await supabase.from('faqs').update({ question: faqQuestion, answer: faqAnswer, category_id: faqCategory || null, featured: faqFeatured }).eq('id', editFaq.id);
    } else {
      await supabase.from('faqs').insert({ question: faqQuestion, answer: faqAnswer, category_id: faqCategory || null, featured: faqFeatured, status: 'active' });
    }
    setSaving(false);
    setShowFaqEditor(false);
    load();
  };

  const handleDeleteFaq = async (id: string) => {
    await supabase.from('faqs').delete().eq('id', id);
    load();
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await supabase.from('faq_categories').insert({ name: newCatName.trim(), sort_order: categories.length + 1, status: 'active' });
    setNewCatName('');
    setShowCatEditor(false);
    load();
  };

  const filteredFaqs = activeCategory === 'all' ? faqs : faqs.filter((f) => f.category_id === activeCategory);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">FAQ Management</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowCatEditor(true)} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--elevated)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
            + Category
          </button>
          <button onClick={() => openFaqEditor(null)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
            <Plus size={15} /> New FAQ
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        <button onClick={() => setActiveCategory('all')} className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0" style={{ background: activeCategory === 'all' ? 'var(--primary)' : 'var(--elevated)', color: activeCategory === 'all' ? '#fff' : 'var(--muted-foreground)', border: '1px solid var(--border)' }}>All</button>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0" style={{ background: activeCategory === cat.id ? 'var(--primary)' : 'var(--elevated)', color: activeCategory === cat.id ? '#fff' : 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--elevated)' }} />)}</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center" style={{ background: 'var(--surface)' }}><p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No FAQs found</p></div>
          ) : (
            filteredFaqs.map((faq, i) => (
              <div key={faq.id} className={`flex items-start justify-between px-4 py-3.5 ${i < filteredFaqs.length - 1 ? 'border-b' : ''}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    {faq.featured && <Star size={12} style={{ color: '#F59E0B', fill: '#F59E0B' }} />}
                    <p className="text-sm font-semibold text-foreground truncate">{faq.question}</p>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{faq.answer}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => openFaqEditor(faq)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
                    <Edit2 size={13} style={{ color: 'var(--foreground)' }} />
                  </button>
                  <button onClick={() => handleDeleteFaq(faq.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,77,141,0.1)' }}>
                    <Trash2 size={13} style={{ color: 'var(--social)' }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* FAQ Editor Modal */}
      {showFaqEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-base font-bold text-foreground">{editFaq ? 'Edit FAQ' : 'New FAQ'}</h3>
              <button onClick={() => setShowFaqEditor(false)} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)' }}>Cancel</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Question</label>
                <input type="text" value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Answer</label>
                <textarea value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} rows={4} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Category</label>
                <select value={faqCategory} onChange={(e) => setFaqCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="featured" checked={faqFeatured} onChange={(e) => setFaqFeatured(e.target.checked)} className="w-4 h-4 rounded" />
                <label htmlFor="featured" className="text-sm font-medium text-foreground cursor-pointer">Featured FAQ</label>
              </div>
            </div>
            <div className="p-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={handleSaveFaq} disabled={saving} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                {saving ? 'Saving...' : 'Save FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Editor Modal */}
      {showCatEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="p-5">
              <h3 className="text-base font-bold text-foreground mb-4">New Category</h3>
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Category name" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-4" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
              <div className="flex gap-3">
                <button onClick={() => setShowCatEditor(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--elevated)', color: 'var(--foreground)' }}>Cancel</button>
                <button onClick={handleAddCategory} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
