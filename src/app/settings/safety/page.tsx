'use client';
import React from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SafetyPage() {
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
          <h1 className="text-xl font-bold text-foreground">Safety & Trust Center</h1>
        </div>

        <div className="px-4 py-6 pb-24 overflow-y-auto space-y-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            PoolParty is built around trust, transparency, and responsible participation.
          </p>

          {/* Trust Score */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} style={{ color: 'var(--primary)' }} />
              <h3 className="text-base font-bold text-foreground">Trust Score</h3>
            </div>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--muted-foreground)' }}>
              A user's trust score reflects their history across PoolParty, including participation, completed pools, disputed activity, reliability, and account behavior.
            </p>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>Trust Score May Include</h4>
            <div className="space-y-1.5">
              {['Completed pools', 'Wins and losses', 'Participation history', 'Dispute history', 'Reliability', 'Profile completeness', 'Group behavior', 'Reports or violations']?.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Does Not Guarantee */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} style={{ color: '#F59E0B' }} />
              <h3 className="text-base font-bold text-foreground">Trust Score Does Not Guarantee</h3>
            </div>
            <div className="space-y-1.5">
              {['Payment', 'Honesty', 'Identity verification', 'Future behavior', 'Financial reliability']?.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F59E0B' }} />
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Disputes */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-bold text-foreground mb-2">Disputes</h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--muted-foreground)' }}>
              If users disagree about a pool outcome or user behavior, they may open a dispute. Disputes can move through:
            </p>
            <div className="flex gap-2">
              {['Open', 'In Review', 'Resolved']?.map((s) => (
                <span key={s} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Safety Rules */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-bold text-foreground mb-3">Safety Rules</h3>
            <div className="space-y-2">
              {[
                'Only join pools you understand.',
                'Do not create misleading pools.',
                'Do not harass or pressure users.',
                'Do not use PoolParty for illegal activity.',
                'Do not impersonate others.',
                'Do not attempt to manipulate outcomes.',
                'Report suspicious activity.',
              ]?.map((rule) => (
                <div key={rule} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--primary)' }} />
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{rule}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,77,141,0.06)', border: '1px solid rgba(255,77,141,0.2)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              PoolParty may remove content, restrict accounts, or suspend users who violate platform rules.
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
