import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface UrduSetupSelectOption {
  value: string | number;
  label: string;
}

/**
 * Mirrors the native `<select class="input-base">` control used on the English
 * setup pages (TestMode / PracticeSetup).
 *
 * - `test` variant: label sits above the select as a sibling.
 * - `practice` variant: label wraps the select (identical rendering).
 */
export function UrduSetupSelect({
  id,
  testid,
  label,
  value,
  options,
  onChange,
  wrapperClassName = '',
  labelClassName = 'block text-sm font-bold mb-2',
  selectClassName = 'input-base block w-full',
  wrapInLabel = false,
  selectStyle,
}: {
  id: string;
  testid: string;
  label: string;
  value: string | number;
  options: UrduSetupSelectOption[];
  onChange: (value: string) => void;
  wrapperClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  wrapInLabel?: boolean;
  /** Extra inline styles merged over the default control sizing. */
  selectStyle?: CSSProperties;
}) {
  const select = (
    <select
      id={id}
      data-testid={testid}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={selectClassName}
      style={{ padding: '0.8125rem 0.875rem', ...selectStyle }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  if (wrapInLabel) {
    return (
      <label className={labelClassName} htmlFor={id}>
        {label}
        {select}
      </label>
    );
  }

  return (
    <div className={wrapperClassName}>
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>
      {select}
    </div>
  );
}

/** Full-width gradient start button matching the English `.tt-start-btn` button. */
export function UrduSetupStartButton({
  label,
  onClick,
  testid,
  className = 'btn tt-start-btn w-full justify-center px-6 py-4 rounded-full text-base mt-8',
  arrowSize = 18,
  disabled = false,
  style,
}: {
  label: string;
  onClick: () => void;
  testid: string;
  className?: string;
  arrowSize?: number;
  disabled?: boolean;
  /** Extra inline styles merged over the default label styling. */
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{ fontSize: 15, fontWeight: 700, color: '#fff', opacity: disabled ? 0.75 : 1, ...style }}
    >
      {label} <ArrowRight size={arrowSize} />
    </button>
  );
}

/** Info / highlight card matching the English setup aside cards (`card p-5 flex-1`). */
export function UrduSetupInfoCard({
  icon: Icon,
  title,
  children,
  tone = { backgroundColor: 'rgba(139, 92, 246, 0.14)', color: '#7c3aed' },
  className = 'card p-5 flex-1',
  iconClassName = 'w-11 h-11 rounded-xl',
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  tone?: CSSProperties;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-2.5">
        <div
          className={`${iconClassName} flex items-center justify-center flex-shrink-0`}
          style={tone}
        >
          <Icon size={20} />
        </div>
        <b className="block text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </b>
      </div>
      {children}
    </div>
  );
}
