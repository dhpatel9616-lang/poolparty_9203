'use client';
import React, { useEffect, useState } from 'react';
import BottomTabBar from './BottomTabBar';

interface MobileLayoutProps {
  children: React.ReactNode;
  hideTabBar?: boolean;
  modalOpen?: boolean;
}

export default function MobileLayout({ children, hideTabBar = false, modalOpen = false }: MobileLayoutProps) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const heightRatio = vv.height / window.innerHeight;
      setKeyboardOpen(heightRatio < 0.75);
    };

    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  const showTabBar = !hideTabBar && !keyboardOpen && !modalOpen;

  return (
    <div className="min-h-dvh" style={{ background: 'var(--background)' }}>
      <div className="mobile-container">
        <main className={showTabBar ? 'pb-24' : 'min-h-dvh'}>
          {children}
        </main>
        {showTabBar && <BottomTabBar />}
      </div>
    </div>
  );
}