'use client';
import React from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STEPS = [
  {
    num: '01',
    title: 'Create or Join a Group',
    body: 'Users create or join private groups with friends, coworkers, communities, or invite-only circles.',
  },
  {
    num: '02',
    title: 'Create or Browse Pools',
    body: 'A pool is a prediction topic with rules, outcomes, deadlines, and participation settings. Pools can be created by users, group admins, or PoolParty admins.',
  },
  {
    num: '03',
    title: 'Lock In Your Pick',
    body: 'Users select an outcome and lock in their entry before the deadline. Once locked, entries cannot be changed unless the pool rules allow it.',
  },
  {
    num: '04',
    title: 'Track the Pool',
    body: 'Participants can view entries, deadlines, group activity, and pool status.',
  },
  {
    num: '05',
    title: 'Resolve the Outcome',
    body: 'After the event is complete, the pool outcome is resolved by the group admin, pool creator, approved source, or admin review process.',
  },
  {
    num: '06',
    title: 'Reputation Updates',
    body: 'Completed pools affect user stats such as wins, participation history, reliability, disputes, and trust score.',
  },
];

export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
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
          <h1 className="text-xl font-bold text-foreground">How PoolParty Works</h1>
        </div>

        <div className="px-4 py-6 pb-24 overflow-y-auto space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            PoolParty is designed around private groups, prediction pools, locked picks, outcomes, and trust scores.
          </p>

          {STEPS?.map((step) => (
            <div
              key={step?.num}
              className="rounded-2xl p-5 flex gap-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}
              >
                {step?.num}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">{step?.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{step?.body}</p>
              </div>
            </div>
          ))}

          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.2)' }}
          >
            <p className="text-xs font-semibold text-foreground mb-1">Important</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              PoolParty tracks predictions and user-reported outcomes. PoolParty does not process payments, hold funds, or enforce outside agreements.
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
