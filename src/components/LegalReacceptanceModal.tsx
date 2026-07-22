'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Shield } from 'lucide-react';

interface LegalDoc {
  document_type: string;
  version_number: string;
  title: string;
  requires_reacceptance: boolean;
}

interface LegalReacceptanceModalProps {
  onAccepted: () => void;
}

export default function LegalReacceptanceModal({ onAccepted }: LegalReacceptanceModalProps) {
  const supabase = createClient();
  const { user } = useAuth();
  const [pendingDocs, setPendingDocs] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    checkPendingAcceptances();
  }, [user?.id]);

  const checkPendingAcceptances = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get latest published legal docs that require reacceptance
      const { data: docs } = await supabase
        .from('legal_documents')
        .select('document_type, version_number, title, requires_reacceptance')
        .eq('status', 'published')
        .eq('requires_reacceptance', true)
        .order('created_at', { ascending: false });

      if (!docs || docs.length === 0) {
        setPendingDocs([]);
        setLoading(false);
        onAccepted();
        return;
      }

      // Get user's existing acceptances
      const { data: acceptances } = await supabase
        .from('legal_acceptances')
        .select('document_type, version_number')
        .eq('user_id', user.id);

      const acceptedSet = new Set(
        (acceptances || []).map((a) => `${a.document_type}:${a.version_number}`)
      );

      // Find docs that haven't been accepted yet (latest version per type)
      const latestByType: Record<string, LegalDoc> = {};
      for (const doc of docs) {
        if (!latestByType[doc.document_type]) {
          latestByType[doc.document_type] = doc;
        }
      }

      const pending = Object.values(latestByType).filter(
        (doc) => !acceptedSet.has(`${doc.document_type}:${doc.version_number}`)
      );

      setPendingDocs(pending);
      if (pending.length === 0) onAccepted();
    } catch {
      onAccepted(); // On error, don't block user
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!user?.id) return;
    const hasTerms = pendingDocs.some((d) => d.document_type === 'terms');
    const hasPrivacy = pendingDocs.some((d) => d.document_type === 'privacy');
    if (hasTerms && !termsChecked) return;
    if (hasPrivacy && !privacyChecked) return;

    setAccepting(true);
    try {
      const inserts = pendingDocs.map((doc) => ({
        user_id: user.id,
        document_type: doc.document_type,
        version_number: doc.version_number,
        accepted_at: new Date().toISOString(),
      }));
      await supabase.from('legal_acceptances').insert(inserts);
      onAccepted();
    } catch {
      onAccepted(); // On error, don't block user
    }
    setAccepting(false);
  };

  if (loading || pendingDocs.length === 0) return null;

  const hasTerms = pendingDocs.some((d) => d.document_type === 'terms');
  const hasPrivacy = pendingDocs.some((d) => d.document_type === 'privacy');
  const canAccept = (!hasTerms || termsChecked) && (!hasPrivacy || privacyChecked);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(124,92,255,0.12)' }}
          >
            <Shield size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Updated Policies</h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Review and accept to continue</p>
          </div>
        </div>

        <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          PoolParty has updated its policies. Please review and accept to continue using the app.
        </p>

        <div className="space-y-3 mb-5">
          {hasTerms && (
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
              />
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                I accept the updated{' '}
                <Link href="/settings/terms" target="_blank" className="underline font-semibold" style={{ color: 'var(--primary)' }}>
                  Terms of Service
                </Link>
              </span>
            </label>
          )}
          {hasPrivacy && (
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <input
                type="checkbox"
                checked={privacyChecked}
                onChange={(e) => setPrivacyChecked(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
              />
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                I accept the updated{' '}
                <Link href="/settings/privacy" target="_blank" className="underline font-semibold" style={{ color: 'var(--primary)' }}>
                  Privacy Policy
                </Link>
              </span>
            </label>
          )}
        </div>

        <button
          onClick={handleAccept}
          disabled={!canAccept || accepting}
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: canAccept ? 'var(--primary)' : 'var(--elevated)',
            color: canAccept ? '#fff' : 'var(--muted-foreground)',
          }}
        >
          {accepting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : 'Accept and Continue'}
        </button>
      </div>
    </div>
  );
}
