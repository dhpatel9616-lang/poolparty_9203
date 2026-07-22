'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const FALLBACK_CATEGORIES: Category[] = [
  { id: '1', name: 'Sports', icon: '🏆' },
  { id: '2', name: 'Politics', icon: '🗳️' },
  { id: '3', name: 'Crypto', icon: '₿' },
  { id: '4', name: 'Stocks', icon: '📈' },
  { id: '5', name: 'Entertainment', icon: '🎬' },
  { id: '6', name: 'TV Shows', icon: '📺' },
  { id: '7', name: 'Personal Challenges', icon: '💪' },
  { id: '8', name: 'Fantasy Sports', icon: '🏅' },
  { id: '9', name: 'Office Pools', icon: '🏢' },
  { id: '10', name: 'Neighborhood Pools', icon: '🏘️' },
  { id: '11', name: 'Friends & Family', icon: '👨‍👩‍👧' },
  { id: '12', name: 'Custom', icon: '✨' },
];

interface CategoryBrowserProps {
  selectedCategory: string | null;
  onSelectCategory: (name: string) => void;
}

export default function CategoryBrowser({ selectedCategory, onSelectCategory }: CategoryBrowserProps) {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('pool_template_categories')
          .select('id, name, icon')
          .order('sort_order');
        if (data && data.length > 0) setCategories(data);
      } catch {}
    };
    fetch();
  }, [supabase]);

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-4 mb-2">
        <span className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>BROWSE BY CATEGORY</span>
      </div>
      <div className="flex gap-2 px-4 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => {
          const isActive = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className="flex flex-col items-center gap-1 flex-shrink-0 transition-all"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all"
                style={{
                  background: isActive ? 'var(--primary)' : 'var(--surface)',
                  border: `2px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                {cat.icon}
              </div>
              <span
                className="text-2xs font-medium text-center leading-tight max-w-[52px]"
                style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
              >
                {cat.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
