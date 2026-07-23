'use client';
import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function SmartSuggestion() {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState<string>(
    "You're on PoolParty! Create a pool or join one to get started."
  );

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    const fetchSuggestion = async () => {
      // Check for unpaid settlements
      const { data: unpaid } = await supabase?.from('settlements')?.select('amount')?.or(`payer_id.eq.${user?.id},recipient_id.eq.${user?.id}`)?.eq('settlement_status', 'pending')?.limit(1);

      if (unpaid && unpaid?.length > 0) {
        setSuggestion(`You have a pending payment of $${unpaid?.[0]?.amount}. Settle up to keep your trust score high!`);
        return;
      }

      // Check for open disputes
      const { count: disputeCount } = await supabase?.from('disputes')?.select('id', { count: 'exact', head: true })?.or(`opened_by.eq.${user?.id},against_user_id.eq.${user?.id}`)?.eq('dispute_status', 'open');

      if (disputeCount && disputeCount > 0) {
        setSuggestion(`You have ${disputeCount} open dispute${disputeCount > 1 ? 's' : ''}. Head to the Dispute Center to resolve them.`);
        return;
      }

      // Check for active pools
      const { count: poolCount } = await supabase?.from('pools')?.select('id', { count: 'exact', head: true })?.eq('status', 'open');

      if (poolCount && poolCount > 0) {
        setSuggestion(`There are ${poolCount} active pools right now. Join one to compete with friends!`);
        return;
      }

      setSuggestion("Create a pool or invite friends to get started on PoolParty!");
    };

    fetchSuggestion();
  }, [user]);

  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: 'rgba(124,92,255,0.08)',
        border: '1px solid rgba(124,92,255,0.2)',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(124,92,255,0.15)' }}
      >
        <Sparkles size={16} style={{ color: 'var(--primary)' }} />
      </div>
      <div>
        <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--primary)' }}>
          Smart Suggestion
        </p>
        <p className="text-sm text-foreground leading-snug">
          {suggestion}
        </p>
      </div>
    </div>
  );
}