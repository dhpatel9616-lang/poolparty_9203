'use client';
import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

export default function FaqPage() {
  const router = useRouter();
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
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        <div
          className="sticky top-0 z-10 px-4 py-4 border-b"
          style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.push('/settings')}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
            >
              <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
            </button>
            <h1 className="text-xl font-bold text-foreground">FAQ</h1>
          </div>
          {/* Search */}
          <div className="relative">
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
        </div>

        <div className="px-4 py-4 pb-24 overflow-y-auto">
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
              {/* Featured */}
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
        </div>
      </div>
    </MobileLayout>
  );
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
