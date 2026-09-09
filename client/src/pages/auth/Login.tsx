import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GoogleSignInButton, GoogleDivider } from '../../components/auth/GoogleSignInButton';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import { getApiErrorMessage } from '../../services/api';

export default function Login() {
  const location = useLocation();
  const returnTo = new URLSearchParams(location.search).get('redirect');
  const registerLink = returnTo ? `/register?redirect=${encodeURIComponent(returnTo)}` : '/register';
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Invalid email or password'));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Welcome back
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
        Sign in to continue your typing journey
      </p>

      {error && (
        <div
          className="rounded-input px-4 py-3 text-sm mb-6"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <p>{error}</p>
        </div>
      )}

      <GoogleSignInButton />
      <GoogleDivider />

      <form onSubmit={handleSubmit} className="space-y-5">
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
          autoComplete="current-password"
        />

        <div className="flex justify-end -mt-2">
          <Link
            to="/forgot-password"
            className="text-sm font-medium"
            style={{ color: 'var(--color-accent-text)' }}
          >
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
        Don't have an account?{' '}
        <Link to={registerLink} className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>
          Create one free
        </Link>
      </p>
    </div>
  );
}
