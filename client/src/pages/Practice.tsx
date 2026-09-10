import { useEffect, useState } from 'react';
import { ArrowRight, Dumbbell, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { practiceService } from '../services/practice.service';
import { useAuthStore } from '../store/authStore';
import { PRACTICE_TYPES } from '../data/practiceTypes';
import type { PracticeRecommendation } from '../types';
import { useSeo } from '../hooks/useSeo';

/* ── Helpers used by the recommended-session band ───────────────────────── */

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} sec`;
  const minutes = Math.round(seconds / 60);
  return minutes === 1 ? '1 min' : `${minutes} min`;
}

const DIFF_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

/* ════════════════════════════════════════════════════════════════════════ */

export default function Practice() {
  useSeo({
    title: 'Typing Practice Online — Improve Speed & Accuracy',
    description: 'Practice typing online with focused drills, custom text, and real-time feedback to improve your typing speed and accuracy over time.',
    canonicalPath: '/practice',
  });
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<PracticeRecommendation | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    practiceService.getOverview()
      .then(({ recommendation: r }) => {
        setRecommendation(r);
      })
      .catch(() => undefined);
  }, [isAuthenticated]);

  const recommendedType = recommendation ? PRACTICE_TYPES.find((t) => t.slug === recommendation.type) : undefined;

  return (
    <PageWrapper title="Practice" description="Build your speed, accuracy, and confidence with focused practice." icon={Target} dotGrid fullWidth className="py-8">
      <div className="max-w-6xl mx-auto w-full">

        {/* ── Practice modes ───────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.14), rgba(139, 92, 246, 0.14))', color: 'var(--color-accent)' }}>
              <Dumbbell size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Choose your drill</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Pick a skill to focus on, repeat it freely, or let recent performance guide the session.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRACTICE_TYPES.map(({ key, slug, label, desc, icon: Icon, badge }) => {
              return (
                <button
                  key={key}
                  onClick={() => navigate(`/practice/${slug}`)}
                  className="tt-practice-card group relative flex items-center gap-3 p-4 rounded-xl text-left border border-[var(--color-border)]"
                >
                  <span
                    className="flex items-center justify-center rounded-lg shrink-0 transition-all duration-200 ease-out group-hover:bg-[linear-gradient(135deg,#4F46E5,#7C6EF2)]"
                    style={{ width: 40, height: 40, backgroundColor: 'var(--color-accent-light)' }}
                  >
                    <Icon size={18} className="transition-colors duration-200 text-[var(--color-accent-text)] group-hover:text-white" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold leading-tight transition-colors duration-200 text-[var(--color-text-primary)] group-hover:text-[#4F46E5] dark:group-hover:text-[#A5B4FF]">{label}</p>
                      {badge && (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                            badge === 'Smart'
                              ? 'bg-[#dbeafe] text-[#2563eb] dark:bg-blue-950 dark:text-blue-200'
                              : 'bg-[#ede9fe] text-[#7c3aed] dark:bg-purple-950 dark:text-purple-200'
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-text-secondary)' }}>{desc}</p>
                  </div>
                  <ArrowRight
                    size={15}
                    className="shrink-0 transition-all duration-200 text-[var(--color-text-muted)] group-hover:text-[#4F46E5] dark:group-hover:text-[#A5B4FF] group-hover:translate-x-[3px]"
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Recommended session / continue practicing ────────────────── */}
        {isAuthenticated && recommendation && recommendedType && (
          <section
            className="rounded-2xl p-5 sm:p-6 relative overflow-hidden"
            style={{ border: '1px solid rgba(67, 97, 238, 0.25)', boxShadow: '0 16px 36px -18px rgba(67, 97, 238, 0.55)' }}
            data-testid="recommended-session"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]" aria-hidden="true">
              <span className="navbar-gradient-circle w-48 h-48 -right-16 -top-24" />
              <span className="navbar-gradient-circle w-36 h-36 -left-12 -bottom-20" style={{ opacity: 0.5 }} />
            </div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-none"
                style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 8px 18px -8px rgba(99, 102, 241, 0.8)' }}
              >
                <recommendedType.icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#A5B4FF' }}>Continue practicing</p>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  {recommendedType.label}
                </h3>
                <p className="text-sm text-white/80 mt-0.5">
                  {DIFF_LABEL[recommendation.difficulty] ?? 'Adaptive'} · {formatDuration(recommendation.duration)}
                  {recommendation.focusKeys.length > 0 && (
                    <span className="ml-1">· focus {recommendation.focusKeys.slice(0, 4).map((k) => k.toUpperCase()).join(' ')}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => navigate(`/practice/${recommendation.type}`)}
                className="flex-none btn px-5 py-2.5 rounded-full text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #4361EE, #8B5CF6)', color: '#fff', boxShadow: '0 6px 18px rgba(67, 97, 238, 0.4)' }}
              >
                Start practice <ArrowRight size={15} className="inline-block ml-1" />
              </button>
            </div>
          </section>
        )}
      </div>
    </PageWrapper>
  );
}