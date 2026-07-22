'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PublicPageLayout from '@/components/PublicPageLayout';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface FaqCategory {
  id: string;
  name: string;
  sort_order: number;
}

interface Faq {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  featured: boolean;
  sort_order: number;
}

function FaqItem({ faq, openId, setOpenId }: { faq: Faq; openId: string | null; setOpenId: (id: string | null) => void }) {
  const isOpen = openId === faq.id;
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <button
        onClick={() => setOpenId(isOpen ? null : faq.id)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <p className="text-sm font-semibold text-foreground pr-3">{faq.question}</p>
        {isOpen ? (
          <ChevronUp size={16} className="flex-shrink-0" style={{ color: 'var(--primary)' }} />
        ) : (
          <ChevronDown size={16} className="flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm leading-relaxed pt-3" style={{ color: 'var(--muted-foreground)' }}>{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function PublicFaqPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [catRes, faqRes] = await Promise.all([
        supabase.from('faq_categories').select('*').eq('status', 'active').order('sort_order'),
        supabase.from('faqs').select('*').eq('status', 'active').order('sort_order'),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (faqRes.data) setFaqs(faqRes.data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = faqs.filter((f) => {
    const matchesSearch = search === '' || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'all' || f.category_id === activeCategory;
    return matchesSearch && matchesCat;
  });

  const featured = filtered.filter((f) => f.featured);
  const regular = filtered.filter((f) => !f.featured);

  return (
    <PublicPageLayout
      title="Frequently Asked Questions"
      subtitle="Find answers to common questions about PoolParty"
      accentColor="#8B5CF6"
    >
      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </div>

      {/* Category Filter */}
      {!loading && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: activeCategory === 'all' ? 'var(--primary)' : 'var(--elevated)',
              color: activeCategory === 'all' ? '#fff' : 'var(--muted-foreground)',
              border: '1px solid var(--border)',
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: activeCategory === cat.id ? 'var(--primary)' : 'var(--elevated)',
                color: activeCategory === cat.id ? '#fff' : 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: 'var(--elevated)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No results found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {featured.length > 0 && search === '' && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider px-1" style={{ color: 'var(--muted-foreground)' }}>Featured</p>
              {featured.map((faq) => (
                <FaqItem key={faq.id} faq={faq} openId={openId} setOpenId={setOpenId} />
              ))}
              {regular.length > 0 && (
                <p className="text-xs font-bold uppercase tracking-wider px-1 pt-2" style={{ color: 'var(--muted-foreground)' }}>All Questions</p>
              )}
            </>
          )}
          {(search !== '' ? filtered : regular).map((faq) => (
            <FaqItem key={faq.id} faq={faq} openId={openId} setOpenId={setOpenId} />
          ))}
        </div>
      )}
    </PublicPageLayout>
  );
}
