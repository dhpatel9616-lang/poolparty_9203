'use client';
import React from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        {/* Sticky Header */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b"
          style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => router?.push('/settings')}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <h1 className="text-xl font-bold text-foreground">About PoolParty</h1>
        </div>

        <div className="px-4 py-6 pb-24 overflow-y-auto space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center py-6">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mb-4"
              style={{ background: 'linear-gradient(135deg, #0052FF, #7C5CFF, #00C9A7)' }}
            >
              🎱
            </div>
            <h2 className="text-2xl font-bold text-foreground">PoolParty</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Version 1.0.0</p>
          </div>

          {/* Description */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
              PoolParty is a private group prediction and agreement-tracking app built for friends, communities, teams, and groups that want to make predictions, track outcomes, and build trust through reputation.
            </p>
            <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--foreground)' }}>
              PoolParty helps users create private pools around sports, entertainment, life events, pop culture, business, and everyday predictions. Users can join groups, make picks, lock in entries, track results, resolve outcomes, and build a visible trust score over time.
            </p>
            <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--muted-foreground)' }}>
              PoolParty is not a gambling platform, sportsbook, casino, trading platform, escrow service, or payment processor. The app does not process wagers, hold funds, move money, or guarantee payment between users.
            </p>
          </div>

          {/* Mission */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-base font-bold text-foreground mb-2">Mission</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              To make friendly predictions, group accountability, and social reputation more transparent, fun, and trustworthy.
            </p>
          </div>

          {/* Core Principles */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-base font-bold text-foreground mb-3">Core Principles</h3>
            <div className="space-y-2">
              {[
                'Private groups first',
                'Trust and reputation matter',
                'Clear rules before participation',
                'Transparent outcomes',
                'Fair dispute handling',
                'No in-app money movement',
                'User safety and accountability',
              ]?.map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{p}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.2)' }}
          >
            <p className="text-xs leading-relaxed text-center" style={{ color: 'var(--muted-foreground)' }}>
              PoolParty does not process payments, hold funds, or enforce outside agreements. Any outside arrangement between users happens outside of PoolParty.
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
