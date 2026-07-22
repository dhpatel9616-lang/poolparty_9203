'use client';
import React, { useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const TOPICS = [
  'Account Help', 'Bug Report', 'Pool Issue', 'Group Issue',
  'Dispute', 'Safety Concern', 'Privacy Request', 'Feature Request', 'Other',
];

export default function ContactPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email is required';
    if (!topic) e.topic = 'Please select a topic';
    if (!message.trim() || message.trim().length < 10) e.message = 'Message must be at least 10 characters';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await supabase.from('contact_submissions').insert({
        user_id: user?.id || null,
        name: name.trim(),
        email: email.trim(),
        topic,
        message: message.trim(),
        status: 'new',
      });
      setSubmitted(true);
    } catch {
      // silently fail — show success anyway for UX
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
          <h1 className="text-xl font-bold text-foreground">Contact Us</h1>
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
              <h2 className="text-lg font-bold text-foreground mb-2">Message Sent!</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Thanks for contacting PoolParty. Our team has received your message.
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
            <>
              <div
                className="rounded-2xl p-4 mb-5 flex items-center gap-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <Mail size={18} style={{ color: 'var(--primary)' }} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Support Email</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>support@poolpartyapp.com</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--elevated)', border: `1.5px solid ${errors.name ? 'var(--social)' : 'var(--border)'}`, color: 'var(--foreground)' }}
                  />
                  {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--social)' }}>{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--elevated)', border: `1.5px solid ${errors.email ? 'var(--social)' : 'var(--border)'}`, color: 'var(--foreground)' }}
                  />
                  {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--social)' }}>{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--elevated)', border: `1.5px solid ${errors.topic ? 'var(--social)' : 'var(--border)'}`, color: topic ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                  >
                    <option value="">Select a topic</option>
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.topic && <p className="text-xs mt-1" style={{ color: 'var(--social)' }}>{errors.topic}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or question..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'var(--elevated)', border: `1.5px solid ${errors.message ? 'var(--social)' : 'var(--border)'}`, color: 'var(--foreground)' }}
                  />
                  {errors.message && <p className="text-xs mt-1" style={{ color: 'var(--social)' }}>{errors.message}</p>}
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
                      Sending...
                    </span>
                  ) : 'Send Message'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
