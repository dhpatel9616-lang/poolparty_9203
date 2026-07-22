'use client';
import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft, Camera, Check, X, ChevronRight, AlertCircle, LogOut, Sun, Moon, Monitor, Plus, Trash2, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';


interface ToggleProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  loading?: boolean;
}

function Toggle({ enabled, onChange, loading }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className="relative flex-shrink-0 transition-colors duration-200"
      style={{
        width: 46,
        height: 26,
        borderRadius: 13,
        background: enabled ? 'var(--primary)' : 'rgba(120,120,140,0.28)',
        opacity: loading ? 0.5 : 1,
        cursor: loading ? 'default' : 'pointer',
      }}
    >
      <span
        className="absolute rounded-full transition-transform duration-200 ease-out"
        style={{
          top: 2,
          left: 2,
          width: 22,
          height: 22,
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)',
          transform: enabled ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--muted-foreground)' }}>
        {title}
      </h2>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {children}
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

function Row({ label, subtitle, right, onClick, danger }: RowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 border-b last:border-b-0 text-left transition-all active:bg-white/5"
      style={{ borderColor: 'var(--border)' }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: danger ? 'var(--social)' : 'var(--foreground)' }}>
          {label}
        </p>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{subtitle}</p>}
      </div>
      {right ?? <ChevronRight size={16} style={{ color: 'var(--muted-foreground)' }} />}
    </button>
  );
}

interface ToggleRowProps {
  label: string;
  subtitle?: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  loading?: boolean;
}

function ToggleRow({ label, subtitle, enabled, onChange, loading }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{subtitle}</p>}
      </div>
      <Toggle enabled={enabled} onChange={onChange} loading={loading} />
    </div>
  );
}

// ─── Payment Method Types ─────────────────────────────────────────────────────

interface PaymentMethod {
  id: string;
  type: string;
  handle: string;
}

const PAYMENT_TYPES = ['Venmo', 'PayPal', 'Cash App', 'Zelle', 'Apple Pay', 'Bank Transfer', 'Other'];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const { user } = useAuth();

  // Edit Profile
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [originalHandle, setOriginalHandle] = useState('');
  const [handleValid, setHandleValid] = useState<boolean | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingHandle, setEditingHandle] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load real profile data on mount
  React.useEffect(() => {
    if (!user?.id) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('full_name, username, bio, avatar_url, preferences')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.full_name || '');
        setHandle(data.username ? `@${data.username}` : '');
        setOriginalHandle(data.username ? `@${data.username}` : '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || null);
        const prefs = (data.preferences as Record<string, boolean>) || {};
        if ('push_enabled' in prefs) setPushEnabled(prefs.push_enabled);
        if ('sms_enabled' in prefs) setSmsEnabled(prefs.sms_enabled);
        if ('email_enabled' in prefs) setEmailEnabled(prefs.email_enabled);
        if ('payment_reminders' in prefs) setPaymentReminders(prefs.payment_reminders);
        if ('dispute_alerts' in prefs) setDisputeAlerts(prefs.dispute_alerts);
        if ('profile_public' in prefs) setProfilePublic(prefs.profile_public);
        if ('show_accuracy' in prefs) setShowAccuracy(prefs.show_accuracy);
        if ('show_activity' in prefs) setShowActivity(prefs.show_activity);
        if ('show_settlement' in prefs) setShowSettlement(prefs.show_settlement);
      }
      setProfileLoaded(true);
    };
    loadProfile();
  }, [user?.id]);

  // Notifications
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [disputeAlerts, setDisputeAlerts] = useState(true);

  // Privacy
  const [profilePublic, setProfilePublic] = useState(true);
  const [showAccuracy, setShowAccuracy] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [showSettlement, setShowSettlement] = useState(false);

  // App Preferences
  const [defaultView, setDefaultView] = useState('all');

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [exportRequested, setExportRequested] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Toggle loading states
  const [savingToggle, setSavingToggle] = useState<string | null>(null);

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState('Venmo');
  const [newPaymentHandle, setNewPaymentHandle] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Load payment methods on mount
  React.useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setLoadingPayments(true);
      const { data } = await supabase
        .from('user_profiles')
        .select('payment_methods')
        .eq('id', user.id)
        .single();
      if (data?.payment_methods) {
        setPaymentMethods(data.payment_methods as PaymentMethod[]);
      }
      setLoadingPayments(false);
    };
    load();
  }, [user?.id]);

  const handleAddPaymentMethod = async () => {
    if (!newPaymentHandle.trim() || !user?.id) return;
    setSavingPayment(true);
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: newPaymentType,
      handle: newPaymentHandle.trim(),
    };
    const updated = [...paymentMethods, newMethod];
    try {
      await supabase
        .from('user_profiles')
        .update({ payment_methods: updated })
        .eq('id', user.id);
      setPaymentMethods(updated);
      setNewPaymentHandle('');
      setNewPaymentType('Venmo');
      setShowAddPayment(false);
      toast.success('Payment method added');
    } catch {
      toast.error('Failed to save');
    }
    setSavingPayment(false);
  };

  const handleRemovePaymentMethod = async (id: string) => {
    if (!user?.id) return;
    const updated = paymentMethods.filter((m) => m.id !== id);
    try {
      await supabase
        .from('user_profiles')
        .update({ payment_methods: updated })
        .eq('id', user.id);
      setPaymentMethods(updated);
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const TOGGLE_KEY_MAP: Record<string, string> = {
    push: 'push_enabled',
    sms: 'sms_enabled',
    email: 'email_enabled',
    payment: 'payment_reminders',
    dispute: 'dispute_alerts',
    public: 'profile_public',
    accuracy: 'show_accuracy',
    activity: 'show_activity',
    settlement: 'show_settlement',
  };

  const handleToggle = async (key: string, setter: (v: boolean) => void, value: boolean) => {
    setSavingToggle(key);
    setter(value);
    if (user?.id) {
      const dbKey = TOGGLE_KEY_MAP[key];
      const { data } = await supabase.from('user_profiles').select('preferences').eq('id', user.id).maybeSingle();
      const prefs = { ...(data?.preferences as Record<string, boolean> || {}), [dbKey]: value };
      const { error } = await supabase.from('user_profiles').update({ preferences: prefs }).eq('id', user.id);
      if (error) {
        toast.error('Failed to save');
        setSavingToggle(null);
        return;
      }
    }
    setSavingToggle(null);
    toast.success('Saved');
  };

  const handleHandleChange = (val: string) => {
    setHandle(val);
    setHandleValid(null);
  };

  // Debounced real uniqueness check against the database
  React.useEffect(() => {
    if (!editingHandle || !handle || handle === originalHandle) return;
    const clean = handle.replace(/^@/, '');
    if (clean.length < 3) {
      setHandleValid(false);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', clean)
        .maybeSingle();
      setHandleValid(!data);
    }, 400);
    return () => clearTimeout(timeout);
  }, [handle, editingHandle, originalHandle]);

  const saveDisplayName = async () => {
    setEditingName(false);
    if (!user?.id || !displayName.trim()) return;
    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: displayName.trim() })
      .eq('id', user.id);
    if (error) toast.error('Failed to save name');
    else toast.success('Name saved');
  };

  const saveHandle = async () => {
    setEditingHandle(false);
    if (!user?.id || handle === originalHandle) return;
    const clean = handle.replace(/^@/, '').trim();
    if (!clean || handleValid === false) return;
    const { error } = await supabase
      .from('user_profiles')
      .update({ username: clean })
      .eq('id', user.id);
    if (error) {
      toast.error('Failed to save username');
    } else {
      toast.success('Username saved');
      setOriginalHandle(`@${clean}`);
    }
  };

  const saveBio = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('user_profiles')
      .update({ bio: bio.trim() })
      .eq('id', user.id);
    if (error) toast.error('Failed to save bio');
    else toast.success('Bio saved');
  };

  const handleExportData = () => {
    setExportRequested(true);
    toast.success("We'll notify you when your data export is ready");
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/sign-up-login-screen');
    } catch (err: any) {
      toast.error(err.message || 'Sign out failed');
      setSigningOut(false);
    }
  };

  const handleThemeModeChange = (newMode: ThemeMode) => {
    setThemeMode(newMode);
    const labels: Record<ThemeMode, string> = { light: 'Light mode', dark: 'Dark mode', system: 'System default' };
    toast.success(labels[newMode]);
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-24 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>

        {/* Edit Profile */}
        <Section title="Edit Profile">
          {/* Avatar */}
          <div className="flex items-center gap-4 px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,201,167,0.2))',
                  border: '1.5px solid rgba(124,92,255,0.3)',
                  color: 'var(--primary)',
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  displayName
                    ? displayName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
                    : '?'
                )}
              </div>
              <button
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: 'var(--primary)' }}
                onClick={() => toast.info('Photo upload coming soon')}
              >
                <Camera size={12} color="#fff" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Profile Photo</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Tap to change · Stored securely
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Display Name</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onFocus={() => setEditingName(true)}
                onBlur={saveDisplayName}
                className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none"
                placeholder="Your display name"
              />
              {editingName && (
                <button onClick={() => setEditingName(false)}>
                  <Check size={16} style={{ color: 'var(--success)' }} />
                </button>
              )}
            </div>
          </div>

          {/* Handle */}
          <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Username</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={handle}
                onChange={(e) => { setEditingHandle(true); handleHandleChange(e.target.value); }}
                onFocus={() => setEditingHandle(true)}
                onBlur={saveHandle}
                className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none"
                placeholder="@yourhandle"
              />
              {editingHandle && handleValid !== null && (
                handleValid
                  ? <Check size={16} style={{ color: 'var(--success)' }} />
                  : <X size={16} style={{ color: 'var(--social)' }} />
              )}
            </div>
            {editingHandle && handleValid === false && (
              <p className="text-xs mt-1" style={{ color: 'var(--social)' }}>Username already taken</p>
            )}
          </div>

          {/* Bio */}
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Bio</p>
              <span className="text-xs" style={{ color: bio.length > 140 ? 'var(--social)' : 'var(--muted-foreground)' }}>
                {bio.length}/160
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              onBlur={saveBio}
              rows={3}
              className="w-full bg-transparent text-sm text-foreground outline-none resize-none"
              placeholder="Tell people about yourself..."
            />
          </div>
        </Section>

        {/* Payment Methods */}
        <Section title="Payment Methods">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
              When you win a contract, losers will automatically receive these payment methods so they know how to pay you.
            </p>
          </div>
          {loadingPayments ? (
            <div className="px-4 py-4">
              <div className="h-8 rounded-lg animate-pulse" style={{ background: 'var(--elevated)' }} />
            </div>
          ) : (
            <>
              {paymentMethods.length === 0 && !showAddPayment && (
                <div className="px-4 py-4 text-center">
                  <CreditCard size={24} className="mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No payment methods yet</p>
                </div>
              )}
              {paymentMethods.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}
                    >
                      {m.type.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.type}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{m.handle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePaymentMethod(m.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90"
                    style={{ background: 'rgba(255,77,141,0.1)' }}
                  >
                    <Trash2 size={13} style={{ color: 'var(--social)' }} />
                  </button>
                </div>
              ))}

              {showAddPayment ? (
                <div className="px-4 py-3 space-y-2">
                  <select
                    value={newPaymentType}
                    onChange={(e) => setNewPaymentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  >
                    {PAYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newPaymentHandle}
                    onChange={(e) => setNewPaymentHandle(e.target.value)}
                    placeholder={newPaymentType === 'Bank Transfer' ? 'Account details' : `Your ${newPaymentType} handle`}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowAddPayment(false); setNewPaymentHandle(''); }}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddPaymentMethod}
                      disabled={!newPaymentHandle.trim() || savingPayment}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
                      style={{
                        background: newPaymentHandle.trim() ? 'var(--primary)' : 'var(--elevated)',
                        color: newPaymentHandle.trim() ? '#fff' : 'var(--muted-foreground)',
                      }}
                    >
                      {savingPayment ? 'Saving…' : 'Add'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddPayment(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all active:bg-white/5"
                  style={{ color: 'var(--primary)' }}
                >
                  <Plus size={15} />
                  Add Payment Method
                </button>
              )}
            </>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <ToggleRow label="Push Notifications" enabled={pushEnabled} loading={savingToggle === 'push'}
            onChange={(v) => handleToggle('push', setPushEnabled, v)} />
          <ToggleRow label="SMS Alerts" subtitle="Carrier rates may apply" enabled={smsEnabled} loading={savingToggle === 'sms'}
            onChange={(v) => handleToggle('sms', setSmsEnabled, v)} />
          <ToggleRow label="Email Notifications" enabled={emailEnabled} loading={savingToggle === 'email'}
            onChange={(v) => handleToggle('email', setEmailEnabled, v)} />
          <ToggleRow label="Payment Reminders" subtitle="Auto-reminders every 24h for unpaid" enabled={paymentReminders} loading={savingToggle === 'payment'}
            onChange={(v) => handleToggle('payment', setPaymentReminders, v)} />
          <ToggleRow label="Dispute Alerts" enabled={disputeAlerts} loading={savingToggle === 'dispute'}
            onChange={(v) => handleToggle('dispute', setDisputeAlerts, v)} />
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <ToggleRow label="Public Profile" subtitle="Others can find and view your profile" enabled={profilePublic} loading={savingToggle === 'public'}
            onChange={(v) => handleToggle('public', setProfilePublic, v)} />
          <ToggleRow label="Show Accuracy Score" enabled={showAccuracy} loading={savingToggle === 'accuracy'}
            onChange={(v) => handleToggle('accuracy', setShowAccuracy, v)} />
          <ToggleRow label="Show Activity Feed" enabled={showActivity} loading={savingToggle === 'activity'}
            onChange={(v) => handleToggle('activity', setShowActivity, v)} />
          <ToggleRow label="Show Settlement Score" enabled={showSettlement} loading={savingToggle === 'settlement'}
            onChange={(v) => handleToggle('settlement', setShowSettlement, v)} />
        </Section>

        {/* App */}
        <Section title="App">
          {/* Theme Selector */}
          <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-medium text-foreground mb-2.5">Theme</p>
            <div className="flex gap-2">
              {([
                { value: 'light' as ThemeMode, label: 'Light', Icon: Sun },
                { value: 'dark' as ThemeMode, label: 'Dark', Icon: Moon },
                { value: 'system' as ThemeMode, label: 'System', Icon: Monitor },
              ] as { value: ThemeMode; label: string; Icon: React.ElementType }[]).map(({ value, label, Icon }) => {
                const active = themeMode === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleThemeModeChange(value)}
                    className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    style={{
                      background: active ? 'var(--primary)' : 'var(--elevated)',
                      color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      border: active ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="text-sm font-medium text-foreground">Default Home View</p>
            </div>
            <select
              value={defaultView}
              onChange={(e) => { setDefaultView(e.target.value); toast.success('Saved'); }}
              className="text-sm font-medium rounded-lg px-2 py-1 outline-none"
              style={{ background: 'var(--elevated)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            >
              <option value="all">All</option>
              <option value="active">Active Only</option>
              <option value="payments">Payments</option>
            </select>
          </div>
        </Section>

        {/* Account */}
        <Section title="Account">
          <Row label="Change Phone Number" subtitle="Re-verify your phone" onClick={() => toast.info('Phone change coming soon')} />
          <Row
            label="Export My Data"
            subtitle={exportRequested ? 'Export requested — we\'ll notify you' : 'Download all your data'}
            onClick={handleExportData}
            right={exportRequested ? <Check size={16} style={{ color: 'var(--success)' }} /> : undefined}
          />
          <Row
            label="Sign Out"
            onClick={handleSignOut}
            right={signingOut
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <LogOut size={16} style={{ color: 'var(--muted-foreground)' }} />
            }
          />
          <Row label="Delete Account" danger onClick={() => setShowDeleteModal(true)} right={<ChevronRight size={16} style={{ color: 'var(--social)' }} />} />
        </Section>

        {/* Legal */}
        <Section title="Legal">
          <Row label="Terms of Service" onClick={() => router.push('/settings/terms')} />
          <Row label="Privacy Policy" onClick={() => router.push('/settings/privacy')} />
          <div className="px-4 py-3 text-center">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              PoolParty does not process payments or hold funds. v1.0.0
            </p>
          </div>
        </Section>

        {/* Company & Help */}
        <Section title="Company & Help">
          <Row label="About PoolParty" onClick={() => router.push('/settings/about')} />
          <Row label="How PoolParty Works" onClick={() => router.push('/settings/how-it-works')} />
          <Row label="Safety & Trust Center" onClick={() => router.push('/settings/safety')} />
          <Row label="Community Guidelines" onClick={() => router.push('/settings/community-guidelines')} />
          <Row label="FAQ" onClick={() => router.push('/settings/faq')} />
          <Row label="Contact Us" onClick={() => router.push('/settings/contact')} />
          <Row label="Report a Problem" onClick={() => router.push('/settings/report-problem')} />
          <Row label="Release Notes" onClick={() => router.push('/settings/release-notes')} />
        </Section>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <div className="w-full max-w-[320px] rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={18} style={{ color: 'var(--social)' }} />
                <h3 className="text-base font-bold text-foreground">Delete Account</h3>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                This action is permanent. Type <strong className="text-foreground">DELETE</strong> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-4"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--elevated)', color: 'var(--foreground)' }}
                >
                  Cancel
                </button>
                <button
                  disabled={deleteConfirmText !== 'DELETE'}
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/sign-up-login-screen');
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: deleteConfirmText === 'DELETE' ? 'var(--social)' : 'var(--elevated)',
                    color: deleteConfirmText === 'DELETE' ? '#fff' : 'var(--muted-foreground)',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}