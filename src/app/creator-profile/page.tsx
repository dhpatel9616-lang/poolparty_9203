'use client';
import React, { Suspense } from 'react';
import CreatorProfileContent from './components/CreatorProfileContent';

export default function CreatorProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--background)' }}><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <CreatorProfileContent />
    </Suspense>
  );
}
