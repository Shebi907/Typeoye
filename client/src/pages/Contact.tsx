import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Heart,
  Loader2,
  Mail,
  Send,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';
import { SUPPORT_EMAIL } from '../config';
import { contactService } from '../services/contact.service';
import type { ContactTopic } from '../services/contact.service';

const TOPICS: ContactTopic[] = [
  'General question',
  'Bug report',
  'Feature request',
  'Account issue',
  'Other',
];

interface FormState {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
}

const INITIAL: FormState = { name: '', email: '', topic: 'General question', message: '' };

export default function Contact() {
  useEffect(() => {
    document.title = 'Contact Us — Typeoye';
  }, []);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successLeaving, setSuccessLeaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [topicOpen, setTopicOpen] = useState(false);
  const topicRef = useRef<HTMLDivElement>(null);
  const successTimers = useRef<number[]>([]);

  useEffect(() => {
    return () => successTimers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    if (!topicOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (topicRef.current && !topicRef.current.contains(e.target as Node)) setTopicOpen(false);
    };
    const onDocKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTopicOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onDocKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onDocKeyDown);
    };
  }, [topicOpen]);

  const set = (field: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
    setSubmitError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = 'Please enter your name.';
    if (!form.email.trim()) nextErrors.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      nextErrors.email = 'Please enter a valid email address.';
    if (!form.message.trim()) nextErrors.message = 'Please write a message.';

    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await contactService.submit(form);
      // Backend confirmed success — only now reset the form.
      setForm(INITIAL);
      setErrors({});
      setSuccess(false);
      setSuccessLeaving(false);
      successTimers.current.forEach((t) => window.clearTimeout(t));
      successTimers.current.push(
        window.setTimeout(() => {
          setSuccess(true);
          successTimers.current.push(
            window.setTimeout(() => {
              setSuccessLeaving(true);
              successTimers.current.push(window.setTimeout(() => setSuccess(false), 450));
            }, 4500)
          );
        }, 50)
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearForm = () => {
    setForm(INITIAL);
    setErrors({});
    setSubmitError(null);
    setTopicOpen(false);
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="mx-auto max-w-3xl pb-10 pt-6 text-center sm:pt-8">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
          style={{
            background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
            boxShadow: '0 8px 20px -6px rgba(67, 97, 238, 0.5)',
          }}
        >
          <Mail size={26} strokeWidth={2} />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--color-text-primary)' }}>
          Contact Us
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
          We'd love to hear from you. Send us a message and we'll get back to you soon.
        </p>
        <div
          className="mx-auto mt-5 h-1 w-16 rounded-full"
          style={{ background: 'linear-gradient(90deg, #4361EE 0%, #7C3AED 100%)' }}
        />
      </section>

      {/* Main two-column layout */}
      <section
        className="mx-auto grid max-w-6xl items-start gap-8 md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[390px_minmax(0,1fr)]"
        data-testid="contact-layout"
      >
        {/* Left — Get in Touch */}
        <div className="card rounded-[24px] p-6 sm:p-8" data-testid="contact-info-panel">
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Get in Touch
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Have a question, feedback, or suggestion? We're here to help!
          </p>

          <div className="mt-7 flex flex-col gap-3.5">
            <ContactItem
              icon={Mail}
              title="Email Us"
              testId="contact-card-mail"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--color-accent-text)' }}>
                {SUPPORT_EMAIL}
              </span>
            </ContactItem>

            <ContactItem
              icon={Clock}
              title="Response Time"
              testId="contact-card-response"
            >
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Usually within 24–48 hours
              </span>
            </ContactItem>

            <ContactItem
              icon={BookOpen}
              title="Help & Resources"
              testId="contact-card-help"
              href="/faq"
            >
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Check our FAQ and Guides
              </span>
            </ContactItem>
          </div>

          <div
            className="mt-7 flex items-start gap-3 rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(67, 97, 238, 0.1) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.18)',
            }}
          >
            <Heart size={18} className="mt-0.5 shrink-0" style={{ color: '#7C3AED' }} />
            <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--color-accent-text)' }}>
              Your feedback helps us
              <br />
              make Typeoye better!
            </p>
          </div>
        </div>

        {/* Right — Send Us a Message */}
          <div
            className="card rounded-[24px] p-6 sm:p-8"
            style={{ boxShadow: '0 16px 40px -18px rgba(23, 23, 31, 0.28)' }}
            data-testid="contact-form-card"
          >
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Send Us a Message
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Fill out the form below and we'll get back to you as soon as possible.
            </p>

            {success && (
              <div
                className={cn(
                  'mt-4 flex items-start gap-3 rounded-2xl border p-4 contact-success-card',
                  successLeaving && 'contact-success-leave'
                )}
                data-testid="contact-success"
                role="status"
                aria-live="polite"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16A34A' }}
                >
                  <CheckCircle2 size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Message sent successfully!
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Thank you for contacting us. We'll get back to you soon.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-5 lg:grid-cols-2">
                  <Field label="Name" error={errors.name}>
                    <input
                      className={cn('input-base', errors.name && 'input-error')}
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => set('name')(e.target.value)}
                      aria-invalid={!!errors.name}
                    />
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <input
                      type="email"
                      className={cn('input-base', errors.email && 'input-error')}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => set('email')(e.target.value)}
                      aria-invalid={!!errors.email}
                    />
                  </Field>
                </div>

                <Field label="Subject" className="mt-5" error={undefined}>
                  <div ref={topicRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setTopicOpen((o) => !o)}
                      aria-haspopup="listbox"
                      aria-expanded={topicOpen}
                      className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-card)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {form.topic}
                      <ChevronDown
                        size={16}
                        className={cn('transition-transform', topicOpen && 'rotate-180')}
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                    </button>
                    {topicOpen && (
                      <ul
                        role="listbox"
                        className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: '0 16px 36px -16px rgba(23, 23, 31, 0.3)' }}
                      >
                        {TOPICS.map((topic) => (
                          <li key={topic} role="option" aria-selected={topic === form.topic}>
                            <button
                              type="button"
                              onClick={() => {
                                set('topic')(topic);
                                setTopicOpen(false);
                              }}
                              className="flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-accent-light)]"
                              style={{
                                color: topic === form.topic ? 'var(--color-accent-text)' : 'var(--color-text-primary)',
                                backgroundColor: topic === form.topic ? 'var(--color-accent-light)' : 'transparent',
                              }}
                            >
                              {topic}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Field>

                <Field label="Message" className="mt-5" error={errors.message}>
                  <textarea
                    className={cn('input-base min-h-[140px] resize-y', errors.message && 'input-error')}
                    placeholder="Tell us what's on your mind..."
                    value={form.message}
                    onChange={(e) => set('message')(e.target.value)}
                    aria-invalid={!!errors.message}
                  />
                </Field>

                {submitError && (
                  <p
                    className="mt-4 rounded-lg px-3 py-2 text-sm font-medium"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-error)' }}
                    data-testid="contact-error"
                  >
                    {submitError}
                  </p>
                )}

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)', boxShadow: '0 8px 22px -6px rgba(67, 97, 238, 0.45)' }}
                    data-testid="contact-submit"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="rounded-xl border px-6 py-3 text-sm font-semibold transition-colors duration-150 hover:bg-[var(--color-accent-light)]"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    Clear Form
                  </button>
                </div>
              </form>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

function ContactItem({
  icon: Icon,
  title,
  href,
  testId,
  children,
}: {
  icon: LucideIcon;
  title: string;
  href?: string;
  testId: string;
  children: ReactNode;
}) {
  const card = (
    <div
      className="group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: '0 4px 14px -8px rgba(23, 23, 31, 0.18)' }}
      data-testid={testId}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)', color: '#4361EE' }}
      >
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
      <ArrowUpRight
        size={18}
        className="shrink-0 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        style={{ color: '#7C3AED' }}
      />
    </div>
  );

  if (href) {
    return href.startsWith('mailto:') ? (
      <a href={href} className="block">
        {card}
      </a>
    ) : (
      <Link to={href} className="block">
        {card}
      </Link>
    );
  }

  return card;
}