import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; hint?: string; prefixIcon?: React.ReactNode; suffixIcon?: React.ReactNode; }
export function Input({ label, error, hint, prefixIcon, suffixIcon, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return <div className="w-full">{label && <label htmlFor={inputId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>{label}</label>}<div className="relative">{prefixIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>{prefixIcon}</span>}<input id={inputId} className={cn('input-base', error && 'input-error', className)} style={{ paddingLeft: prefixIcon ? '3rem' : undefined, paddingRight: suffixIcon ? '3rem' : undefined }} {...props}/>{suffixIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>{suffixIcon}</span>}</div>{error && <p className="mt-1.5 text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>}{hint && !error && <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}</div>;
}