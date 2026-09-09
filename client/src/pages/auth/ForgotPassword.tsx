import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/auth.service';
import { getApiErrorMessage } from '../../services/api';

type Step = 1 | 2 | 3 | 4;

const GENERIC_MESSAGE = 'If an account matches these details, you can continue with account recovery.';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>(1);
  const [identifier, setIdentifier] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const handleIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(identifier);
      if (res.securityQuestion) {
        setSecurityQuestion(res.securityQuestion);
        setStep(2);
      } else {
        // Backwards-compatible fallback — backend now always returns a question
        // on success, but keep the step intact rather than erroring out.
        setNotice(res.message ?? GENERIC_MESSAGE);
      }
    } catch (err) {
      // Unknown email/username (or locked/no security question) surfaces here as
      // an error box on step 1 so the user can enter a different identifier.
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await authService.verifySecurityAnswer(identifier, answer);
      setResetToken(res.resetToken);
      setStep(3);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword(resetToken, newPassword);
      setStep(4);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const backToStart = () => {
    setStep(1);
    setError('');
    setNotice('');
    setAnswer('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const errorBox = error ? (
    <div
      className="rounded-input px-4 py-3 text-sm mb-6"
      style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.2)' }}
    >
      <p>{error}</p>
    </div>
  ) : null;

  const noticeBox = notice ? (
    <div
      className="rounded-input px-4 py-3 text-sm mb-6"
      style={{ backgroundColor: 'rgba(67,97,238,0.08)', color: 'var(--color-text-secondary)', border: '1px solid rgba(67,97,238,0.2)' }}
    >
      <p>{notice}</p>
    </div>
  ) : null;

  return (
    <div>
      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Forgot Password
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Recover your account using your security question
          </p>

          {errorBox}
          {noticeBox}

          <form onSubmit={handleIdentifier} className="space-y-5">
            <Input
              label="Email or Username"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or typist123"
              prefixIcon={<Mail size={16} />}
              required
              autoComplete="username"
            />

            <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
              Continue
            </Button>
          </form>

          <p className="mt-6 text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>
              Sign in
            </Link>
          </p>
        </>
      )}

      {step === 2 && (
        <>
          <button
            type="button"
            onClick={backToStart}
            className="text-sm mb-4 inline-flex items-center gap-1 font-medium"
            style={{ color: 'var(--color-accent-text)' }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Verify Your Account
          </h1>
          <div className="text-sm mb-6 mt-4 rounded-input px-4 py-3"
            style={{ backgroundColor: 'rgba(67,97,238,0.08)', border: '1px solid rgba(67,97,238,0.2)', color: 'var(--color-text-primary)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Security Question:</p>
            <p className="font-medium">{securityQuestion}</p>
          </div>

          {errorBox}

          <form onSubmit={handleVerifyAnswer} className="space-y-5">
            <Input
              label="Your Answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer"
              prefixIcon={<ShieldCheck size={16} />}
              autoComplete="off"
              required
            />

            <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
              Verify Answer
            </Button>
          </form>
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Create New Password
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Set a new password for your account
          </p>

          {errorBox}

          <form onSubmit={handleResetPassword} className="space-y-5">
            <Input
              label="New Password"
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
            <Input
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              prefixIcon={<Lock size={16} />}
              suffixIcon={
                <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
              autoComplete="new-password"
            />

            <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
              Reset Password
            </Button>
          </form>
        </>
      )}

      {step === 4 && (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
            <CheckCircle2 size={36} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Password Reset Successfully
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Link to="/login">
            <Button variant="primary" size="lg" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
