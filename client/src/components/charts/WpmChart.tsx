import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';
import type { AnalyticsTrend } from '../../types';
function Tip({ active, payload, label, unit = '' }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; unit?: string }) { if (!active || !payload?.length) return null; return <div className="card px-3 py-2 text-sm"><p className="text-muted">{label}</p><p className="font-bold text-[var(--color-accent-text)]">{payload[0].value}{unit}</p></div>; }
export function WpmChart({ data, unit = ' WPM', emptyMessage = 'No data yet — complete some tests to see your trend', withGradient = false }: { data: AnalyticsTrend[]; unit?: string; emptyMessage?: string; withGradient?: boolean }) {
  if (!data.length) return <div className="flex items-center justify-center h-48 text-muted">{emptyMessage}</div>;
  const margin = { top: 5, right: 10, left: -10, bottom: 5 } as const;
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />;
  const x = (
    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={(value: string) => { const date = new Date(value); return `${date.getMonth() + 1}/${date.getDate()}`; }} />
  );
  const y = <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} domain={['auto', 'auto']} />;
  const tooltip = <Tooltip content={<Tip unit={unit} />} />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      {withGradient ? (
        <AreaChart data={data} margin={margin}>
          <defs>
            <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4361ee" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          {grid}{x}{y}{tooltip}
          <Area type="monotone" dataKey="value" stroke="var(--color-accent-text)" strokeWidth={2.5} fill="url(#wpmGradient)" dot={{ fill: 'var(--color-accent)', r: 3 }} />
        </AreaChart>
      ) : (
        <LineChart data={data} margin={margin}>
          {grid}{x}{y}{tooltip}
          <Line type="monotone" dataKey="value" stroke="var(--color-accent-text)" strokeWidth={2.5} dot={{ fill: 'var(--color-accent)', r: 3 }} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
export function AccuracyChart({ data }: { data: AnalyticsTrend[] }) { if (!data.length) return <div className="flex items-center justify-center h-48 text-muted">No data yet — complete some tests to see your trend</div>; return <ResponsiveContainer width="100%" height={220}><AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}><defs><linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/><XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}/><YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} domain={[0,100]}/><Tooltip content={<Tip unit="%"/>}/><Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2.5} fill="url(#accuracyGradient)" dot={{ fill: '#22c55e', r: 3 }}/></AreaChart></ResponsiveContainer>; }