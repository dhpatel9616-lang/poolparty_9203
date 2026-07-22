'use client';
import React, { useState } from 'react';
import { Bell, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationsRealtime } from '@/lib/supabase/realtime';

interface HomeHeaderProps {
  onSearchChange?: (query: string) => void;
}

export default function HomeHeader({ onSearchChange }: HomeHeaderProps) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadCount } = useNotificationsRealtime(user?.id);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    onSearchChange?.(val);
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    onSearchChange?.('');
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Welcome';

  if (searchOpen) {
    return (
      <div className="flex items-center gap-2 pt-2">
        <div
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Search size={14} style={{ color: 'var(--muted-foreground)' }} />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search contracts or groups..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none"
          />
        </div>
        <button
          onClick={handleCloseSearch}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <X size={16} style={{ color: 'var(--foreground)' }} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between pt-2">
      <Link href="/profile-screen" className="active:opacity-70">
        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          Good day 👋
        </p>
        <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          className="relative w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Bell size={18} style={{ color: 'var(--foreground)' }} />
          {unreadCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-2xs font-bold"
              style={{ background: 'var(--social)', color: '#fff', fontSize: '9px' }}
            >
              {unreadCount}
            </span>
          )}
        </Link>
        <button
          onClick={() => setSearchOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Search size={18} style={{ color: 'var(--foreground)' }} />
        </button>
      </div>
    </div>
  );
}