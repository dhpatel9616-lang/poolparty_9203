import React from 'react';
import type { TrustHistoryEntry } from '@/lib/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrustHistoryLogProps {
  history: TrustHistoryEntry[];
}

export default function TrustHistoryLog({ history }: TrustHistoryLogProps) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-foreground mb-3">Trust Score History</h2>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {history.map((entry) => {
            const isPositive = entry.delta > 0;
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: 'var(--surface)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isPositive ? 'rgba(0,230,118,0.12)' : 'rgba(255,77,141,0.12)',
                  }}
                >
                  {isPositive ? (
                    <TrendingUp size={14} style={{ color: 'var(--success)' }} />
                  ) : (
                    <TrendingDown size={14} style={{ color: 'var(--social)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{entry.reason}</p>
                  <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {entry.date} · Score: {entry.newScore}
                  </p>
                </div>
                <span
                  className="text-sm font-bold flex-shrink-0"
                  style={{
                    color: isPositive ? 'var(--success)' : 'var(--social)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {isPositive ? '+' : ''}{entry.delta}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}