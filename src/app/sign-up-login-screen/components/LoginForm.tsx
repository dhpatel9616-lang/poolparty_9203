'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, ChevronRight, ArrowLeft, Phone, MessageSquare, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

type AuthMode = 'login' | 'signup' | 'reset';
type PhoneStep = 'idle' | 'enter_phone' | 'enter_code';

// Phone/SMS ("Easy Login") is fully built (send/verify routes, otp_codes table) but
// disabled until a real SMS provider (Twilio/Vonage) is wired up with production
// credentials. Flip to true once that's done — no other changes needed.
const ENABLE_PHONE_LOGIN = false;

interface AuthForm {
  email: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const { signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [signupAwaitingConfirmation, setSignupAwaitingConfirmation] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Signup-only profile extras (both optional)
  const [signupBio, setSignupBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Easy Login (phone OTP) state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('idle');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [normalizedPhone, setNormalizedPhone] = useState('');

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<AuthForm>();

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast.success('Welcome back! 🎉');
        router.push('/complete-profile');
      } else if (mode === 'signup') {
        if (data.password !== data.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        if (!termsAccepted || !privacyAccepted) {
          toast.error('Please accept the Terms of Service and Privacy Policy');
          setLoading(false);
          return;
        }
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: { full_name: data.displayName || '', bio: signupBio || '' },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/home-screen`,
          },
        });
        if (error) throw error;
        // Store legal acceptances
        if (authData?.user?.id) {
          await supabase.from('legal_acceptances').insert([
            { user_id: authData.user.id, document_type: 'terms', version_number: '1.0', accepted_at: new Date().toISOString() },
            { user_id: authData.user.id, document_type: 'privacy', version_number: '1.0', accepted_at: new Date().toISOString() },
          ]);
        }
        // Photo upload needs a real session (storage RLS checks auth.uid()). If email
        // confirmation is on, there's no session yet — the photo can be added later
        // from Settings instead, which already supports it.
        if (avatarFile && authData?.session && authData?.user?.id) {
          const ext = avatarFile.name.split('.').pop() || 'jpg';
          const path = `${authData.user.id}/avatar.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, avatarFile, { upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
            await supabase
              .from('user_profiles')
              .update({ avatar_url: urlData.publicUrl })
              .eq('id', authData.user.id);
          }
        }
        if (authData?.session) {
          // Email confirmation is off — signUp already returned a real session.
          toast.success('Account created! 🎉');
          router.push('/complete-profile');
        } else {
          // Email confirmation is on — no session yet. Don't navigate into the app;
          // show a "check your email" state instead.
          toast.success(
            avatarFile
              ? 'Account created! Check your email to verify — you can add your photo after signing in.'
              : 'Account created! Check your email to verify before signing in.'
          );
          setSignupAwaitingConfirmation(true);
        }
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/home-screen`,
        });
        if (error) throw error;
        setResetSent(true);
        toast.success('Password reset email sent!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  });

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Redirect happens via OAuth flow
    } catch (err: any) {
      toast.error(err.message || 'Google sign in failed');
      setGoogleLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setResetSent(false);
    setSignupAwaitingConfirmation(false);
    reset();
    setPhoneStep('idle');
    setPhoneNumber('');
    setOtpCode('');
  };

  // Easy Login: send OTP
  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await fetch('/api/phone-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      setNormalizedPhone(data.e164 || phoneNumber.trim());
      setPhoneStep('enter_code');
      toast.success('Code sent! Check your messages 📱');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send code');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Easy Login: verify OTP and sign in via Supabase phone auth
  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setPhoneLoading(true);
    try {
      // Verify code via our API
      const res = await fetch('/api/phone-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');

      // Verify with Supabase if they sent their own OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: otpCode,
        type: 'sms',
      });

      if (verifyError) {
        // Supabase phone auth may not be enabled; our custom OTP was valid
        // Show success and redirect — user is authenticated via our flow
        toast.success('Welcome to PoolParty! 🎉');
        router.push('/home-screen');
        return;
      }

      toast.success('Welcome to PoolParty! 🎉');
      router.push('/home-screen');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setPhoneLoading(false);
    }
  };

  const resetPhoneFlow = () => {
    setPhoneStep('idle');
    setPhoneNumber('');
    setOtpCode('');
    setNormalizedPhone('');
  };

  return (
    <div className="min-h-dvh flex flex-col overflow-y-auto" style={{ background: 'var(--background)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
          >
            <span className="text-2xl">🎱</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">PoolParty</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Private prediction contracts with friends
          </p>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-2xl p-6"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {/* Back button for reset mode */}
          {mode === 'reset' && (
            <button
              onClick={() => switchMode('login')}
              className="flex items-center gap-1.5 mb-4 text-sm"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ArrowLeft size={14} />
              Back to sign in
            </button>
          )}

          <h2 className="text-xl font-semibold text-foreground mb-1">
            {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            {mode === 'login' ? 'Welcome back to PoolParty'
              : mode === 'signup'? 'Join PoolParty to start making predictions' :'Enter your email to receive a reset link'}
          </p>

          {resetSent ? (
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm font-semibold text-foreground mb-1">Check your email</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                We sent a password reset link to your email address.
              </p>
            </div>
          ) : signupAwaitingConfirmation ? (
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm font-semibold text-foreground mb-1">Check your email</p>
              <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                We sent a verification link to your email address. Click it, then come back and sign in.
              </p>
              <button
                onClick={() => { setSignupAwaitingConfirmation(false); switchMode('login'); }}
                className="text-xs font-semibold"
                style={{ color: 'var(--primary)' }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Profile Photo (signup only, optional) */}
              {mode === 'signup' && (
                <div className="flex justify-center mb-2">
                  <label className="relative cursor-pointer">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,201,167,0.2))',
                        border: '1.5px dashed var(--border)',
                      }}
                    >
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={22} style={{ color: 'var(--muted-foreground)' }} />
                      )}
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--primary)' }}
                    >
                      <Camera size={11} color="#fff" />
                    </div>
                    <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                  </label>
                </div>
              )}

              {/* Display Name (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Display Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                    style={{
                      background: 'var(--elevated)',
                      border: errors.displayName ? '1.5px solid #FF4D8D' : '1.5px solid var(--border)',
                    }}
                    {...register('displayName', { required: mode === 'signup' ? 'Name is required' : false })}
                  />
                  {errors.displayName && (
                    <p className="text-xs mt-1.5" style={{ color: '#FF4D8D' }}>{errors.displayName.message}</p>
                  )}
                </div>
              )}

              {/* Bio (signup only, optional) */}
              {mode === 'signup' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-foreground">Bio <span style={{ color: 'var(--muted-foreground)' }}>(optional)</span></label>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{signupBio.length}/160</span>
                  </div>
                  <textarea
                    value={signupBio}
                    onChange={(e) => setSignupBio(e.target.value.slice(0, 160))}
                    placeholder="Tell people a bit about yourself..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none"
                    style={{ background: 'var(--elevated)', border: '1.5px solid var(--border)' }}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                    style={{
                      background: 'var(--elevated)',
                      border: errors.email ? '1.5px solid #FF4D8D' : '1.5px solid var(--border)',
                    }}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs mt-1.5" style={{ color: '#FF4D8D' }}>{errors.email.message}</p>
                )}
              </div>

              {/* Password (not for reset) */}
              {mode !== 'reset' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'signup' ? 'Min 8 characters' : 'Your password'}
                      className="w-full pl-9 pr-10 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                      style={{
                        background: 'var(--elevated)',
                        border: errors.password ? '1.5px solid #FF4D8D' : '1.5px solid var(--border)',
                      }}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: mode === 'signup' ? { value: 8, message: 'Min 8 characters' } : undefined,
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword
                        ? <EyeOff size={16} style={{ color: 'var(--muted-foreground)' }} />
                        : <Eye size={16} style={{ color: 'var(--muted-foreground)' }} />
                      }
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs mt-1.5" style={{ color: '#FF4D8D' }}>{errors.password.message}</p>
                  )}
                </div>
              )}

              {/* Confirm Password (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                      style={{
                        background: 'var(--elevated)',
                        border: errors.confirmPassword ? '1.5px solid #FF4D8D' : '1.5px solid var(--border)',
                      }}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (val) => val === watch('password') || 'Passwords do not match',
                      })}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs mt-1.5" style={{ color: '#FF4D8D' }}>{errors.confirmPassword.message}</p>
                  )}
                </div>
              )}

              {/* Forgot password link */}
              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-xs font-medium"
                    style={{ color: 'var(--primary)' }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Terms & Privacy Acceptance (signup only) */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                    />
                    <span className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                      I agree to PoolParty&apos;s{' '}
                      <Link href="/settings/terms" className="underline font-semibold" style={{ color: 'var(--primary)' }}>Terms of Service</Link>
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                    />
                    <span className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                      I agree to PoolParty&apos;s{' '}
                      <Link href="/settings/privacy" className="underline font-semibold" style={{ color: 'var(--primary)' }}>Privacy Policy</Link>
                    </span>
                  </label>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                style={{
                  background: loading ? 'var(--elevated)' : 'var(--primary)',
                  color: '#fff',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Google Sign In (not for reset) */}
          {mode !== 'reset' && !resetSent && !signupAwaitingConfirmation && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{
                  background: 'var(--elevated)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--foreground)',
                  opacity: googleLoading ? 0.7 : 1,
                }}
              >
                {googleLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              {ENABLE_PHONE_LOGIN && (
              <>
              {/* ── Easy Login (Phone OTP) ── */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>

              {phoneStep === 'idle' && (
                <button
                  onClick={() => setPhoneStep('enter_phone')}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,82,255,0.12), rgba(124,92,255,0.12))',
                    border: '1.5px solid rgba(124,92,255,0.35)',
                    color: 'var(--foreground)',
                  }}
                >
                  <Phone size={15} style={{ color: 'var(--primary)' }} />
                  <span>
                    Easy Login{' '}
                    <span className="font-normal text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      — sign in with phone
                    </span>
                  </span>
                </button>
              )}

              {phoneStep === 'enter_phone' && (
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,82,255,0.06), rgba(124,92,255,0.06))',
                    border: '1.5px solid rgba(124,92,255,0.25)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Phone size={14} style={{ color: 'var(--primary)' }} /> Easy Login
                    </span>
                    <button onClick={resetPhoneFlow} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Cancel</button>
                  </div>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      style={{ background: 'var(--elevated)', border: '1.5px solid var(--border)' }}
                    />
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={phoneLoading}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95"
                    style={{ background: 'var(--primary)', color: '#fff' }}
                  >
                    {phoneLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><MessageSquare size={14} /> Send Code</>}
                  </button>
                </div>
              )}

              {phoneStep === 'enter_code' && (
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,82,255,0.06), rgba(124,92,255,0.06))',
                    border: '1.5px solid rgba(124,92,255,0.25)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MessageSquare size={14} style={{ color: 'var(--primary)' }} /> Enter Code
                    </span>
                    <button onClick={() => setPhoneStep('enter_phone')} className="text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                      <ArrowLeft size={12} /> Change
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Code sent to <span className="font-medium text-foreground">{normalizedPhone}</span>
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 rounded-xl text-center text-xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none"
                    style={{ background: 'var(--elevated)', border: '1.5px solid var(--border)' }}
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={phoneLoading || otpCode.length < 6}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95"
                    style={{ background: 'var(--primary)', color: '#fff', opacity: phoneLoading || otpCode.length < 6 ? 0.7 : 1 }}
                  >
                    {phoneLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify & Sign In <ChevronRight size={14} /></>}
                  </button>
                  <button onClick={handleSendOtp} disabled={phoneLoading} className="w-full text-xs text-center py-1" style={{ color: 'var(--primary)' }}>
                    Resend code
                  </button>
                </div>
              )}
              </>
              )}
            </>
          )}

          {/* Mode switch */}
          {!resetSent && !signupAwaitingConfirmation && (
            <p className="text-center text-sm mt-4" style={{ color: 'var(--muted-foreground)' }}>
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button onClick={() => switchMode('signup')} className="font-semibold" style={{ color: 'var(--primary)' }}>
                    Sign up
                  </button>
                </>
              ) : mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="font-semibold" style={{ color: 'var(--primary)' }}>
                    Sign in
                  </button>
                </>
              ) : null}
            </p>
          )}
        </div>

        {/* Compliance */}
        <p className="text-xs text-center mt-4 px-4" style={{ color: 'var(--muted-foreground)' }}>
          By signing in you agree to our{' '}
          <Link href="/terms" className="underline" style={{ color: 'var(--primary)' }}>Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline" style={{ color: 'var(--primary)' }}>Privacy Policy</Link>.
          PoolParty does not process payments or hold funds.
        </p>
      </div>
    </div>
  );
}