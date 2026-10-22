import { ArrowRight, Dumbbell, Languages, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { ProseSection } from '../components/content/ProseSection';
import { URDU_PRACTICE_CATEGORIES } from '../data/urduPracticeTypes';
import { useSeo } from '../hooks/useSeo';

export default function UrduPractice() {
  useSeo({
    title: 'Urdu Typing Practice – Improve Your Urdu Typing Speed | Typeoye',
    description: 'Practice Urdu typing online for free with Typeoye. Drill Urdu characters, combinations, words, sentences and paragraphs, or paste your own text.',
    canonicalPath: '/urdu-practice',
  });
  const navigate = useNavigate();

  return (
    <PageWrapper
      title="Urdu Typing Practice"
      titleUrdu="اردو ٹائپنگ پریکٹس"
      description="Choose what to practise, then pick a duration and difficulty. Content is drawn fresh each session."
      icon={Target}
      dotGrid
      fullWidth
      descriptionAlignLeft
      className="py-10"
    >
      <div className="max-w-[106.25rem] mx-auto w-full">
        {/* ── Urdu categories ───────────────────────────────────────────── */}
        <section className="mb-8" data-testid="urdu-practice-categories">
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.14), rgba(139, 92, 246, 0.14))', color: 'var(--color-accent)' }}
            >
              <Languages size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Choose your drill</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Choose a practice mode to improve your Urdu typing speed and accuracy.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {URDU_PRACTICE_CATEGORIES.map(({ key, slug, labelUr, labelEn, desc, icon: Icon }) => (
              <button
                key={key}
                type="button"
                data-testid={`urdu-practice-category-${slug}`}
                onClick={() => navigate(`/urdu-practice/${slug}`)}
                className="tt-practice-card group relative flex items-center gap-3 p-4 rounded-xl text-left border border-[var(--color-border)]"
              >
                <span
                  className="flex items-center justify-center rounded-lg shrink-0 transition-all duration-200 ease-out group-hover:bg-[linear-gradient(135deg,#4F46E5,#7C6EF2)]"
                  style={{ width: '2.5rem', height: '2.5rem', backgroundColor: 'var(--color-accent-light)' }}
                >
                  <Icon size={18} className="transition-colors duration-200 text-[var(--color-accent-text)] group-hover:text-white" />
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    dir="rtl"
                    lang="ur"
                    className="font-urdu text-base leading-[2] transition-colors duration-200 text-[var(--color-text-primary)] group-hover:text-[#4F46E5] dark:group-hover:text-[#A5B4FF]"
                    style={{ fontWeight: 700 }}
                  >
                    {labelUr}
                  </p>
                  <p className="text-[0.6875rem] mt-0.5 leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>{labelEn}</span> · {desc}
                  </p>
                </div>
                <ArrowRight
                  size={15}
                  className="shrink-0 transition-all duration-200 text-[var(--color-text-muted)] group-hover:text-[#4F46E5] dark:group-hover:text-[#A5B4FF] group-hover:translate-x-[0.1875rem]"
                />
              </button>
            ))}
          </div>
        </section>

        <ProseSection title="About Urdu practice" learnMoreLabel="Learn more about Urdu practice" icon={Dumbbell}>
          <p>
            Urdu practice focuses on a single skill at a time, in Urdu-only content. Characters drills the
            individual letters; Combinations works the everyday letter pairs and the two-part aspirated
            letters that make Urdu joins tricky; Words builds speed on common vocabulary; Sentences uses real
            sentences for natural rhythm; Paragraphs pushes stamina with longer prose; and Custom Text lets
            you paste anything you want to type faster.
          </p>
          <p>
            Every session uses the on-screen Urdu phonetic keyboard: type on your normal English keyboard and
            the matching Urdu letter appears, so you never need a Pakistani keyboard layout. Each session draws
            fresh content for the duration and difficulty you choose, and remembers what it has shown so
            repeats are kept to a minimum.
          </p>
          <p>
            Pick a duration of one, two or four minutes and a difficulty, then start typing. Results are shown
            at the end of every session — sign in to keep practising and track your improvement over time.
          </p>
        </ProseSection>
      </div>
    </PageWrapper>
  );
}
