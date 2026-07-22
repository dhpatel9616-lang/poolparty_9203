'use client';
import React, { useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const REPORT_TYPES = [
  'Bug', 'Abuse', 'Harassment', 'Fraud', 'Fake Pool',
  'Misleading Outcome', 'Payment Dispute Outside App', 'Safety Concern', 'Other',
];

export default function ReportProblemPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();
  const [reportType, setReportType] = useState('');
  const [relatedUser, setRelatedUser] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!reportType) e.reportType = 'Please select a report type';
    if (!description.trim() || description.trim().length < 10) e.description = 'Description must be at least 10 characters';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await supabase.from('problem_reports').insert({
        reporter_user_id: user?.id || null,
        report_type: reportType,
        description: description.trim(),
        status: 'new',
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b"
          style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => router.push('/settings')}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <h1 className="text-xl font-bold text-foreground">Report a Problem</h1>
        </div>

        <div className="px-4 py-6 pb-24 overflow-y-auto">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(0,201,167,0.12)' }}
              >
                <CheckCircle size={32} style={{ color: '#00C9A7' }} />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Report Submitted</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Your report has been submitted. PoolParty may review and take action if needed.
              </p>
              <button
                onClick={() => router.push('/settings')}
                className="mt-6 px-6 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                Back to Settings
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--elevated)', border: `1.5px solid ${errors.reportType ? 'var(--social)' : 'var(--border)'}`, color: reportType ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                >
                  <option value="">Select report type</option>
                  {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.reportType && <p className="text-xs mt-1" style={{ color: 'var(--social)' }}>{errors.reportType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Related User <span style={{ color: 'var(--muted-foreground)' }}>(optional)</span></label>
                <input
                  type="text"
                  value={relatedUser}
                  onChange={(e) => setRelatedUser(e.target.value)}
                  placeholder="@username"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--elevated)', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the problem in detail..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--elevated)', border: `1.5px solid ${errors.description ? 'var(--social)' : 'var(--border)'}`, color: 'var(--foreground)' }}
                />
                {errors.description && <p className="text-xs mt-1" style={{ color: 'var(--social)' }}>{errors.description}</p>}
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(124,92,255,0.06)', border: '1px solid rgba(124,92,255,0.2)' }}
              >
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  Reports are reviewed by the PoolParty team. We may take action including removing content, restricting accounts, or suspending users who violate platform rules.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: loading ? 'var(--elevated)' : 'var(--primary)', color: loading ? 'var(--muted-foreground)' : '#fff' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : 'Submit Report'}
              </button>
            </form>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
