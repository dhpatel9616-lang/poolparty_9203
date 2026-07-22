'use client';
import React from 'react';
import Link from 'next/link';
import PublicFooter from './PublicFooter';

interface PublicPageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  accentColor?: string;
}

export default function PublicPageLayout({
  children,
  title,
  subtitle,
  accentColor = '#7C5CFF',
}: PublicPageLayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Top nav bar */}
      <header
        className="sticky top-0 z-20 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg, #0052FF, #7C5CFF, #00C9A7)' }}
            >
              🎱
            </div>
            <span className="text-sm font-bold text-foreground">PoolParty</span>
          </Link>
          <Link
            href="/sign-up-login-screen"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Page hero */}
      <div
        className="border-b"
        style={{ borderColor: 'var(--border)', background: `${accentColor}08` }}
      >
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <PublicFooter />
    </div>
  );
}
