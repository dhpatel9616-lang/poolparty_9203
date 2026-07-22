'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FOOTER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Community Guidelines', href: '/community-guidelines' },
];

export default function PublicFooter() {
  const pathname = usePathname();
  const [year, setYear] = useState('');

  useEffect(() => {
    setYear(String(new Date()?.getFullYear()));
  }, []);

  return (
    <footer
      className="w-full border-t py-6 px-4"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Logo row */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg, #0052FF, #7C5CFF, #00C9A7)' }}
          >
            🎱
          </div>
          <span className="text-sm font-bold text-foreground">PoolParty</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4">
          {FOOTER_LINKS?.map((link) => {
            const isActive = pathname === link?.href;
            return (
              <Link
                key={link?.href}
                href={link?.href}
                className="text-xs font-medium transition-colors"
                style={{
                  color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                  textDecoration: isActive ? 'underline' : 'none',
                }}
              >
                {link?.label}
              </Link>
            );
          })}
        </nav>

        {/* Disclaimer */}
        <p className="text-center text-2xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          PoolParty does not process payments, hold funds, or facilitate gambling.
          {year && <><br />© {year} PoolParty. All rights reserved.</>}
        </p>
      </div>
    </footer>
  );
}
