'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, User, Compass, Plus } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const TABS = [
  { id: 'tab-home', label: 'Home', icon: Home, href: '/home-screen' },
  { id: 'tab-discover', label: 'Discover', icon: Compass, href: '/discover-pools' },
  { id: 'tab-create', label: '', icon: Plus, href: '/create-screen', isFab: true },
  { id: 'tab-groups', label: 'Groups', icon: Users, href: '/groups-screen' },
  { id: 'tab-profile', label: 'Profile', icon: User, href: '/profile-screen' },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-50"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-1 py-2">
        {TABS?.map((tab) => {
          const isActive =
            pathname === tab?.href ||
            (tab?.href !== '/home-screen' && pathname?.startsWith(tab?.href));
          const Icon = tab?.icon;

          if (tab?.isFab) {
            return (
              <Link key={tab?.id} href={tab?.href} className="flex flex-col items-center -mt-5">
                <div className="fab-button">
                  <Icon size={24} color="#fff" strokeWidth={2.5} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={tab?.id}
              href={tab?.href}
              className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all duration-150"
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
                />
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: 'var(--primary)' }}
                  />
                )}
              </div>
              <span
                className="text-2xs font-medium"
                style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
              >
                {tab?.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}