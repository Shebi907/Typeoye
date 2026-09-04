import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Activity, Award, CalendarClock, Camera, Eye, EyeOff, Gauge,
  Mail, Target, Trash2, Trophy, User,
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { StatCard } from '../components/ui/StatCard';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/user.service';
import type { Profile, UserProgress } from '../types';

const AVATAR_MAX_SIZE = 256;

/** Resize an image file to a small square JPEG data URL before upload. */
function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const side = Math.max(img.width, img.height);
        canvas.width = AVATAR_MAX_SIZE;
        canvas.height = AVATAR_MAX_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas unsupported')); return; }
        // Cover-crop the centered square.
        const scale = AVATAR_MAX_SIZE / side;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (AVATAR_MAX_SIZE - w) / 2, (AVATAR_MAX_SIZE - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** Format an ISO date string as "Jan 2026". */
function formatMemberSince(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export default function ProfilePage() {
  const { id = '' } = useParams();
  const { user, profile: myProfile, setProfile } = useAuthStore();
  const isOwner = !!user && id === user._id;

  const [data, setData] = useState<{ profile: Profile; progress: UserProgress } | null>(null);
  const [error, setError] = useState('');
  const [photoMsg, setPhotoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pwFields, setPwFields] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const [showPw, setShowPw] = useState<{ current: boolean; next: boolean; confirm: boolean }>({
    current: false, next: false, confirm: false,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    userService.getProfile(id)
      .then(setData)
      .catch(() => setError('Profile unavailable.'));

  useEffect(() => {
    setData(null);
    setError('');
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoMsg({ type: 'err', text: 'Please choose an image file.' });
      return;
    }
    setUploading(true);
    setPhotoMsg(null);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const { profile } = await userService.updateAvatar(dataUrl);
      setProfile(profile);
      setData((d) => (d ? { ...d, profile } : d));
      setPhotoMsg({ type: 'ok', text: 'Profile picture updated.' });
    } catch {
      setPhotoMsg({ type: 'err', text: 'Could not upload the picture. Try again.' });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    setUploading(true);
    setPhotoMsg(null);
    try {
      const { profile } = await userService.removeAvatar();
      setProfile(profile);
      setData((d) => (d ? { ...d, profile } : d));
      setPhotoMsg({ type: 'ok', text: 'Profile picture removed.' });
    } catch {
      setPhotoMsg({ type: 'err', text: 'Could not remove the picture. Try again.' });
    } finally {
      setUploading(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwFields.newPassword.length < 8) { setPwMsg({ type: 'err', text: 'New password must be at least 8 characters.' }); return; }
    if (pwFields.newPassword !== pwFields.confirmPassword) { setPwMsg({ type: 'err', text: 'New passwords do not match.' }); return; }
    setPwBusy(true);
    setPwMsg(null);
    try {
      await userService.changePassword(pwFields.currentPassword, pwFields.newPassword);
      setPwFields({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwMsg({ type: 'ok', text: 'Password updated.' });
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err?.response?.data?.error ?? 'Could not update password.' });
    } finally {
      setPwBusy(false);
    }
  };

  if (error) return <PageWrapper title="Profile"><div className="card p-6 max-w-2xl">{error}</div></PageWrapper>;
  if (!data) return <PageWrapper title="Profile"><div className="card p-6 max-w-2xl animate-pulse">Loading profile…</div></PageWrapper>;

  const { profile, progress } = data;

  const togglePw = (field: 'current' | 'next' | 'confirm') =>
    setShowPw((s) => ({ ...s, [field]: !s[field] }));

  const pwInputStyle: React.CSSProperties = {
    backgroundColor: 'rgba(127, 127, 127, 0.06)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
  };

  return (
    <PageWrapper title={profile.displayName} description="Typing profile and progress." noHeader className="py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* ── Profile header banner ── */}
        <section
          className="relative overflow-hidden rounded-2xl px-6 py-6 sm:px-8 sm:py-7"
          style={{ background: 'linear-gradient(135deg, #3730A3 0%, #4361EE 52%, #8B5CF6 100%)', boxShadow: '0 14px 34px -10px rgba(67, 97, 238, 0.5), 0 3px 10px rgba(27, 35, 64, 0.14)' }}
          data-testid="profile-hero"
        >
          <span className="navbar-gradient-circle w-48 h-48 -right-14 -top-20" aria-hidden="true" />
          <span className="navbar-gradient-circle w-36 h-36 -left-12 -bottom-24" style={{ opacity: 0.5 }} aria-hidden="true" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-center justify-between gap-5">
            {/* Left — avatar + identity */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative shrink-0">
                <div
                  className={`rounded-full grid place-items-center font-bold text-white overflow-hidden ${profile.avatarUrl ? '' : 'border border-white/40'}`}
                  style={{
                    width: 64,
                    height: 64,
                    fontSize: 26,
                    backgroundColor: undefined,
                    background: profile.avatarUrl ? undefined : 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12))',
                  }}
                  data-testid="profile-avatar"
                >
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    (profile.displayName || 'U')[0].toUpperCase()
                  )}
                </div>
                {isOwner && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    title="Change profile picture"
                    data-testid="avatar-change"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full grid place-items-center text-white border-2 border-white bg-[var(--color-accent)] hover:opacity-90"
                  >
                    <Camera size={13} />
                  </button>
                )}
              </div>
              <div className="min-w-0 text-white">
                <p className="text-xl sm:text-2xl font-bold leading-tight truncate drop-shadow-sm">{profile.displayName}</p>
                <p className="text-sm text-white/85 mt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Award size={13} /> Level {profile.level} · {profile.levelTitle} · {profile.totalXP} XP earned
                  </span>
                </p>
              </div>
            </div>

            {/* Right — motivational section */}
            <div className="flex items-center gap-3 text-white shrink-0">
              <div
                className="w-12 h-12 rounded-full grid place-items-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
              >
                <Trophy size={22} />
              </div>
              <div>
                <p className="text-sm font-bold drop-shadow-sm">Keep Going!</p>
                <p className="text-xs text-white/75">Stay consistent — every keystroke counts.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Performance stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="profile-stats">
          <StatCard label="Total Sessions" value={progress?.totalSessions ?? 0} icon={Activity} tone="indigo" />
          <StatCard label="Best WPM" value={progress?.bestWpm ?? '—'} icon={Gauge} tone="amber" />
          <StatCard label="Accuracy" value={progress ? `${progress.avgAccuracy}%` : '—'} icon={Target} tone="green" />
        </div>

        {/* Photo controls + bio (owner only for photo) */}
        {isOwner && (
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" data-testid="avatar-file" onChange={onPickPhoto} />
            {profile.avatarUrl && (
              <button onClick={() => void removePhoto()} disabled={uploading} data-testid="avatar-remove" className="btn btn-ghost btn-sm px-3 py-1.5">
                <Trash2 size={14} /> Remove picture
              </button>
            )}
            {uploading && <span className="text-xs text-secondary">Uploading…</span>}
            {photoMsg && (
              <p className={`text-sm ${photoMsg.type === 'ok' ? 'text-[var(--color-accent-text)]' : 'text-[var(--color-error)]'}`}>
                {photoMsg.text}
              </p>
            )}
          </div>
        )}

        {profile.bio && <p className="text-secondary">{profile.bio}</p>}

        {/* ── Account section (two-column) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left — account information */}
          <div className="card p-6" data-testid="account-info-card">
            <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">Account Information</h2>
            <p className="text-sm mt-0.5 mb-5" style={{ color: 'var(--color-text-secondary)' }}>
              Manage your profile and account details
            </p>
            <div className="flex flex-col gap-3">
              <InfoRow icon={User} label="Name / Username" value={isOwner ? user?.username ?? profile.displayName : profile.displayName} />
              {isOwner ? (
                <InfoRow icon={Mail} label="Email Address" value={user?.email ?? '—'} />
              ) : null}
              <InfoRow icon={CalendarClock} label="Member Since" value={formatMemberSince(user?.createdAt)} />
            </div>
          </div>

          {/* Right — change password */}
          {isOwner && (
            <div className="card p-6" data-testid="change-password-card">
              <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">Change Password</h2>
              <p className="text-sm mt-0.5 mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                Keep your account secure
              </p>
              <form onSubmit={submitPassword} className="space-y-4">
                <PasswordField
                  label="Current Password"
                  value={pwFields.currentPassword}
                  onChange={(v) => setPwFields((f) => ({ ...f, currentPassword: v }))}
                  testid="pw-current"
                  autoComplete="current-password"
                  inputStyle={pwInputStyle}
                  visible={showPw.current}
                  onToggle={() => togglePw('current')}
                />
                <PasswordField
                  label="New Password"
                  value={pwFields.newPassword}
                  onChange={(v) => setPwFields((f) => ({ ...f, newPassword: v }))}
                  testid="pw-new"
                  autoComplete="new-password"
                  inputStyle={pwInputStyle}
                  visible={showPw.next}
                  onToggle={() => togglePw('next')}
                />
                <PasswordField
                  label="Confirm New Password"
                  value={pwFields.confirmPassword}
                  onChange={(v) => setPwFields((f) => ({ ...f, confirmPassword: v }))}
                  testid="pw-confirm"
                  autoComplete="new-password"
                  inputStyle={pwInputStyle}
                  visible={showPw.confirm}
                  onToggle={() => togglePw('confirm')}
                />
                {pwMsg && (
                  <p className={`text-sm ${pwMsg.type === 'ok' ? 'text-[var(--color-accent-text)]' : 'text-[var(--color-error)]'}`}>{pwMsg.text}</p>
                )}
                <button
                  type="submit"
                  disabled={pwBusy}
                  data-testid="pw-submit"
                  className="btn w-full justify-center px-5 py-2.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.35)' }}
                >
                  {pwBusy ? 'Saving…' : 'Update password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

/** A labeled info row with a small pastel icon. */
function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number | string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
        style={{ backgroundColor: 'rgba(67, 97, 238, 0.10)', color: 'var(--color-accent)' }}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

/** A labelled password input with a visibility toggle. */
function PasswordField({
  label, value, onChange, testid, autoComplete, inputStyle, visible, onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testid: string;
  autoComplete: string;
  inputStyle: React.CSSProperties;
  visible: boolean;
  onToggle: () => void;
}) {
  const Icon = visible ? EyeOff : Eye;
  return (
    <label className="block text-sm font-medium">
      {label}
      <span className="relative block mt-1">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-testid={testid}
          className="block w-full p-2 pr-10 border rounded-lg"
          style={inputStyle}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          data-testid={`${testid}-toggle`}
          onClick={onToggle}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <Icon size={17} />
        </button>
      </span>
    </label>
  );
}
