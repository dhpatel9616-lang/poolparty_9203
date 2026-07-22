'use client';
import React, { useState, useEffect, useRef } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ArrowLeft, Camera, X, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileEditPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('user_profiles')
        .select('full_name, bio, avatar_url')
        .eq('id', user.id)
        .single();
      if (data) {
        setFullName(data.full_name || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || null);
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5MB');
      return;
    }
    setAvatarFile(file);
    setRemovePhoto(false);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemovePhoto(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!fullName.trim()) {
      toast.error('Display name is required');
      return;
    }
    if (bio.length > 200) {
      toast.error('Bio must be 200 characters or less');
      return;
    }

    setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;

      // Upload new photo
      if (avatarFile) {
        setUploadingPhoto(true);
        const ext = avatarFile.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });
        setUploadingPhoto(false);
        if (uploadError) {
          toast.error('Failed to upload photo');
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        newAvatarUrl = urlData.publicUrl;
      }

      // Remove photo
      if (removePhoto) {
        newAvatarUrl = null;
        // Attempt to delete from storage (best effort)
        if (avatarUrl) {
          const pathMatch = avatarUrl.match(/avatars\/(.+)$/);
          if (pathMatch) {
            await supabase.storage.from('avatars').remove([pathMatch[1]]).catch(() => {});
          }
        }
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName.trim(),
          bio: bio.trim() || null,
          avatar_url: newAvatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      setRemovePhoto(false);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const currentPhoto = avatarPreview || (removePhoto ? null : avatarUrl);
  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

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
          <h1 className="text-xl font-bold text-foreground flex-1">Edit Profile</h1>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{
              background: saving || loading ? 'var(--elevated)' : 'var(--primary)',
              color: saving || loading ? 'var(--muted-foreground)' : '#fff',
            }}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--elevated)' }} />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Profile Photo */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Profile Photo
              </p>
              <div className="flex items-center gap-4">
                {/* Avatar preview */}
                <div className="relative flex-shrink-0">
                  {currentPhoto ? (
                    <img
                      src={currentPhoto}
                      alt="Profile photo"
                      className="w-20 h-20 rounded-2xl object-cover"
                      style={{ border: '2px solid var(--border)' }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
                      style={{
                        background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,201,167,0.2))',
                        border: '2px solid rgba(124,92,255,0.3)',
                        color: 'var(--primary)',
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  {uploadingPhoto && (
                    <div
                      className="absolute inset-0 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.5)' }}
                    >
                      <Loader2 size={20} color="#fff" className="animate-spin" />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                    style={{
                      background: 'var(--elevated)',
                      border: '1.5px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <Camera size={15} />
                    {currentPhoto ? 'Change Photo' : 'Add Photo'}
                  </button>
                  {currentPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                      style={{
                        background: 'rgba(255,77,141,0.08)',
                        border: '1.5px solid rgba(255,77,141,0.25)',
                        color: '#FF4D8D',
                      }}
                    >
                      <X size={14} />
                      Remove Photo
                    </button>
                  )}
                  <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                    JPG, PNG, GIF or WebP · Max 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Display Name <span style={{ color: '#FF4D8D' }}>*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your display name"
                maxLength={80}
                className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                style={{
                  background: 'var(--elevated)',
                  border: !fullName.trim() ? '1.5px solid #FF4D8D' : '1.5px solid var(--border)',
                }}
              />
              {!fullName.trim() && (
                <p className="text-xs mt-1.5" style={{ color: '#FF4D8D' }}>Display name is required</p>
              )}
            </div>

            {/* Bio */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Bio <span className="normal-case font-normal">(optional)</span>
                </label>
                <span
                  className="text-xs font-medium"
                  style={{ color: bio.length > 180 ? '#FF4D8D' : 'var(--muted-foreground)' }}
                >
                  {bio.length}/200
                </span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                placeholder="Tell people about yourself..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none"
                style={{
                  background: 'var(--elevated)',
                  border: '1.5px solid var(--border)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
