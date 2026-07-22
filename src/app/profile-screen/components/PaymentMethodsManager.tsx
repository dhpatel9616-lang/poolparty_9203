'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, GripVertical, Upload, CheckCircle, Star } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: string;
  username: string | null;
  payment_url: string | null;
  qr_code_url: string | null;
  priority: number;
  is_active: boolean;
}

const METHOD_OPTIONS = [
  { value: 'zelle', label: 'Zelle', color: '#6C1CD1' },
  { value: 'venmo', label: 'Venmo', color: '#3D95CE' },
  { value: 'cash_app', label: 'Cash App', color: '#00D64F' },
  { value: 'apple_pay', label: 'Apple Pay', color: '#555' },
  { value: 'paypal', label: 'PayPal', color: '#003087' },
  { value: 'other', label: 'Other', color: '#7C5CFF' },
];

const METHOD_COLORS: Record<string, string> = Object.fromEntries(METHOD_OPTIONS.map(m => [m.value, m.color]));

interface AddMethodFormProps {
  onAdd: (method: Omit<PaymentMethod, 'id' | 'user_id' | 'is_active'>) => void;
  onCancel: () => void;
  existingCount: number;
}

function AddMethodForm({ onAdd, onCancel, existingCount }: AddMethodFormProps) {
  const [methodType, setMethodType] = useState('venmo');
  const [username, setUsername] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!username && !paymentUrl) {
      toast.error('Enter a username or payment URL');
      return;
    }
    setUploading(true);
    let qrUrl: string | null = null;

    if (qrFile && user) {
      const path = `qr-codes/${user.id}/${Date.now()}_${qrFile.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('settlement-proofs')
        .upload(path, qrFile, { upsert: true });
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('settlement-proofs').getPublicUrl(path);
        qrUrl = publicUrl;
      }
    }

    onAdd({
      method_type: methodType,
      username: username || null,
      payment_url: paymentUrl || null,
      qr_code_url: qrUrl,
      priority: existingCount + 1,
    });
    setUploading(false);
  };

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm font-semibold text-foreground">Add Payment Method</p>

      {/* Method type selector */}
      <div className="grid grid-cols-3 gap-2">
        {METHOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMethodType(opt.value)}
            className="py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: methodType === opt.value ? `${opt.color}20` : 'var(--surface)',
              border: `1px solid ${methodType === opt.value ? opt.color : 'var(--border)'}`,
              color: methodType === opt.value ? opt.color : 'var(--muted-foreground)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Username / Handle (e.g. @yourname)"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
      />
      <input
        type="url"
        placeholder="Payment URL (optional)"
        value={paymentUrl}
        onChange={(e) => setPaymentUrl(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
      />

      <label
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm cursor-pointer"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
      >
        <Upload size={14} />
        {qrFile ? qrFile.name : 'Upload QR Code (optional)'}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setQrFile(e.target.files?.[0] ?? null)} />
      </label>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: 'var(--primary)', color: '#fff', opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? 'Saving...' : 'Add Method'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PaymentMethodsManager() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const supabase = createClient();

  const fetchMethods = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });
    setMethods(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMethods();
  }, [user]);

  const handleAdd = async (method: Omit<PaymentMethod, 'id' | 'user_id' | 'is_active'>) => {
    if (!user) return;
    const { error } = await supabase
      .from('payment_methods')
      .insert({ ...method, user_id: user.id, is_active: true });
    if (error) {
      toast.error('Failed to add payment method');
    } else {
      toast.success('Payment method added!');
      setShowAdd(false);
      fetchMethods();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);
    if (error) {
      toast.error('Failed to remove');
    } else {
      toast.success('Removed');
      fetchMethods();
    }
  };

  const handleSetPreferred = async (id: string) => {
    // Set this method to priority 1, bump others
    const updated = methods.map((m, idx) => ({
      id: m.id,
      priority: m.id === id ? 1 : idx + 2,
    }));
    for (const u of updated) {
      await supabase.from('payment_methods').update({ priority: u.priority }).eq('id', u.id).eq('user_id', user?.id);
    }
    toast.success('Preferred method updated!');
    fetchMethods();
  };

  if (loading) {
    return (
      <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="animate-pulse h-4 w-32 rounded" style={{ background: 'var(--elevated)' }} />
        <div className="animate-pulse h-12 rounded-xl" style={{ background: 'var(--elevated)' }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Payment Methods</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Shown to payers when you win a pool
          </p>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(124,92,255,0.12)', color: '#7C5CFF', border: '1px solid rgba(124,92,255,0.25)' }}
          >
            <Plus size={13} />
            Add
          </button>
        )}
      </div>

      {showAdd && (
        <AddMethodForm
          onAdd={handleAdd}
          onCancel={() => setShowAdd(false)}
          existingCount={methods.length}
        />
      )}

      {methods.length === 0 && !showAdd ? (
        <div className="text-center py-6">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No payment methods yet. Add one so payers can send you money.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {methods.map((m, idx) => {
            const color = METHOD_COLORS[m.method_type] ?? '#7C5CFF';
            const label = METHOD_OPTIONS.find(o => o.value === m.method_type)?.label ?? m.method_type;
            const isPreferred = m.priority === 1;
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--elevated)', border: `1px solid ${isPreferred ? color + '40' : 'var(--border)'}` }}
              >
                <GripVertical size={14} style={{ color: 'var(--muted-foreground)' }} />
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${color}20`, color }}
                >
                  {label.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    {isPreferred && (
                      <span
                        className="text-2xs px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: `${color}20`, color }}
                      >
                        Preferred
                      </span>
                    )}
                  </div>
                  {m.username && <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{m.username}</p>}
                  {m.payment_url && (
                    <a href={m.payment_url} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color }}>
                      {m.payment_url.length > 30 ? m.payment_url.slice(0, 30) + '…' : m.payment_url}
                    </a>
                  )}
                </div>
                {m.qr_code_url && (
                  <img src={m.qr_code_url} alt={`${label} QR code`} className="w-8 h-8 rounded-lg object-cover" />
                )}
                <div className="flex items-center gap-1">
                  {!isPreferred && (
                    <button
                      onClick={() => handleSetPreferred(m.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--surface)' }}
                      title="Set as preferred"
                    >
                      <Star size={12} style={{ color: 'var(--muted-foreground)' }} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--surface)' }}
                  >
                    <Trash2 size={12} style={{ color: '#FF4D8D' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reputation badges */}
      <ReputationBadges userId={user?.id} />
    </div>
  );
}

function ReputationBadges({ userId }: { userId?: string }) {
  const [rep, setRep] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;
    supabase.from('user_reputation').select('*').eq('user_id', userId).maybeSingle().then(({ data }) => setRep(data));
  }, [userId]);

  if (!rep) return null;

  const badges = [];
  if (rep.on_time_percentage >= 100 && rep.total_paid > 0) badges.push({ label: '100% Paid', color: '#00E676' });
  if (rep.reliability_score >= 95) badges.push({ label: 'Trusted Payer', color: '#7C5CFF' });
  if (rep.trust_score >= 95) badges.push({ label: 'Trusted Winner', color: '#00C9A7' });
  if (rep.on_time_percentage >= 90 && rep.total_paid > 0) badges.push({ label: 'Fast Payer', color: '#FFC857' });
  if (rep.dispute_count === 0 && rep.total_paid > 0) badges.push({ label: 'Verified Settler', color: '#00C9A7' });
  if (rep.total_paid > 500) badges.push({ label: 'High Volume Player', color: '#FF9632' });

  if (badges.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>SETTLEMENT BADGES</p>
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => (
          <span
            key={b.label}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${b.color}18`, color: b.color, border: `1px solid ${b.color}30` }}
          >
            <CheckCircle size={10} />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
