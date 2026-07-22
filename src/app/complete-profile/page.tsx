'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [checking, setChecking] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  // If they already have a username, this page has nothing to do — skip straight through.
  useEffect(() => {
    if (!user?.id) return;
    const check = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('user_profiles')
        .select('full_name, username, bio, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.username) {
        router.replace('/home-screen');
        return;
      }

      setDisplayName(data?.full_name || '');
      setBio(data?.bio || '');
      setAvatarUrl(data?.avatar_url || null);
      setChecking(false);
    };
    check();
  }, [user?.id, router]);

  // Debounced username uniqueness check
  useEffect(() => {
    const clean = username.trim();
    if (clean.length < 3) {
      setUsernameValid(null);
      return;
    }
    const timeout = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', clean)
        .maybeSingle();
      setUsernameValid(!data);
    }, 400);
    return () => clearTimeout(timeout);
  }, [username]);

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

  const handleSubmit = async () => {
    if (!user?.id) return;
    const clean = username.trim();
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }
    if (clean.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    if (usernameValid === false) {
      toast.error('That username is already taken');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    let finalAvatarUrl = avatarUrl;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        finalAvatarUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: displayName.trim(),
        username: clean,
        bio: bio.trim(),
        avatar_url: finalAvatarUrl,
      })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      toast.error(error.message.includes('duplicate') ? 'That username is already taken' : 'Failed to save profile');
      return;
    }

    toast.success('Profile complete! 🎉');
    router.push('/onboarding-add-friends');
  };

  if (checking) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-4 pt-8 pb-24">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Complete your profile</h1>
          <p className="text-sm px-6" style={{ color: 'var(--muted-foreground)' }}>
            Just a couple more things before you jump in.
          </p>
        </div>

        {/* Photo */}
        <div className="flex justify-center mb-6">
          <label className="relative cursor-pointer">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,201,167,0.2))',
                border: '1.5px dashed var(--border)',
              }}
            >
              {avatarPreview || avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview || avatarUrl || ''} alt="Preview" className="w-full h-full object-cover" />
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

        {/* Display Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            style={{ background: 'var(--elevated)', border: '1.5px solid var(--border)' }}
          />
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted-foreground)' }}>@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="yourhandle"
              className="w-full pl-8 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{
                background: 'var(--elevated)',
                border: usernameValid === false ? '1.5px solid #FF4D8D' : '1.5px solid var(--border)',
              }}
            />
          </div>
          {usernameValid === false && (
            <p className="text-xs mt-1.5" style={{ color: '#FF4D8D' }}>That username is taken</p>
          )}
          {usernameValid === true && (
            <p className="text-xs mt-1.5" style={{ color: 'var(--success, #00C9A7)' }}>Available</p>
          )}
        </div>

        {/* Bio */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-foreground">Bio <span style={{ color: 'var(--muted-foreground)' }}>(optional)</span></label>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{bio.length}/160</span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            placeholder="Tell people a bit about yourself..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            style={{ background: 'var(--elevated)', border: '1.5px solid var(--border)' }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{
            background: saving ? 'var(--primary-muted, rgba(124,92,255,0.5))' : 'var(--primary)',
            color: '#fff',
            opacity: saving ? 0.8 : 1,
          }}
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </MobileLayout>
  );
}
