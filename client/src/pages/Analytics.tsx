import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { WpmChart, AccuracyChart } from '../components/charts/WpmChart';
import { analyticsService } from '../services/analytics.service';
import type { AnalyticsTrend, WeakKey } from '../types';
import { SkeletonCard } from '../components/ui/Skeleton';
import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  const [wpmTrend, setWpmTrend] = useState<AnalyticsTrend[]>([]);
  const [accTrend, setAccTrend] = useState<AnalyticsTrend[]>([]);
  const [weakKeys, setWeakKeys] = useState<WeakKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getWpmTrend(),
      analyticsService.getAccuracyTrend(),
      analyticsService.getWeakKeys(),
    ])
      .then(([wpm, acc, weak]) => {
        setWpmTrend(wpm);
        setAccTrend(acc);
        setWeakKeys(weak);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PageWrapper title="Analytics" description="Track your typing progress over the last 30 days." icon={BarChart3} dotGrid>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>WPM Trend</h3>
          {loading ? <SkeletonCard /> : <WpmChart data={wpmTrend} />}
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Accuracy Trend</h3>
          {loading ? <SkeletonCard /> : <AccuracyChart data={accTrend} />}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Weakest Keys</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          Characters you miss most often. Practice these to improve accuracy.
        </p>

        {loading ? (
          <SkeletonCard />
        ) : weakKeys.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            No weak keys identified yet. Keep practicing!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {weakKeys.map((wk) => (
              <div key={wk.key} className="card p-4 flex flex-col items-center justify-center bg-[var(--color-page)] shadow-none border">
                <div className="text-2xl font-mono font-bold mb-2" style={{ color: 'var(--color-error)' }}>
                  {wk.key === ' ' ? 'Space' : wk.key.toUpperCase()}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {wk.errorRate}% error
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {wk.errorCount} misses
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
