import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GoogleSignInButton, GoogleDivider } from '../../components/auth/GoogleSignInButton';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../services/api';

export default function Register() {
  const location = useLocation();
  const returnTo = new URLSearchParams(location.search).get('redirect');
  const loginLink = returnTo ? `/login?redirect=${encodeURIComponent(returnTo)}` : '/login';
  const { register, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(username, email, password);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Registration failed'));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Create an account
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
        Start your journey to becoming a faster typist
      </p>

      {error && (
        <div
          className="rounded-input px-4 py-3 text-sm mb-6"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </div>
      )}

      <GoogleSignInButton />
      <GoogleDivider />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="typist123"
          prefixIcon={<UserIcon size={16} />}
          required
          autoComplete="username"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          prefixIcon={<Mail size={16} />}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type={showPass ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          prefixIcon={<Lock size={16} />}
          suffixIcon={
            <button type="button" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          required
          autoComplete="new-password"
        />

        <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
          Sign Up Free
        </Button>
      </form>

      <p className="mt-6 text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
        Already have an account?{' '}
        <Link to={loginLink} className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
