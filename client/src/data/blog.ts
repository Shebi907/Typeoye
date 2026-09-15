export type BlogCategory = 'Typing Tips' | 'Guides' | 'Practice' | 'Productivity' | 'News & Updates';
export type BlogSort = 'latest' | 'oldest' | 'popular';

export interface BlogSection {
  heading: string;
  body: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  category: BlogCategory;
  /** Visible one-liner shown on cards and as the intro snippet. */
  description: string;
  /** SEO <title> for the article — falls back to `${title}` when omitted. */
  metaTitle?: string;
  /** SEO meta description — falls back to `description` when omitted. */
  metaDescription?: string;
  intro: string;
  readTime: number;
  publishedAt: string;
  popular: boolean;
  image: string;
  imageAlt: string;
  content: BlogSection[];
}

export const CATEGORIES: ReadonlyArray<'All Posts' | BlogCategory> = [
  'All Posts',
  'Typing Tips',
  'Guides',
  'Practice',
  'Productivity',
  'News & Updates',
];

/** Literal Tailwind classes (scanned by the build) — a soft tinted badge per category. */
export const CATEGORY_BADGE: Record<BlogCategory, string> = {
  'Typing Tips': 'bg-[#4361ee]/10 text-[#4361ee]',
  'Guides': 'bg-[#8b5cf6]/10 text-[#8b5cf6]',
  'Practice': 'bg-[#0ea5e9]/10 text-[#0ea5e9]',
  'Productivity': 'bg-[#6366f1]/10 text-[#6366f1]',
  'News & Updates': 'bg-[#c026d3]/10 text-[#a855f7]',
};

/** Sidebar category post counts (subscription/future-post totals). */
export const CATEGORY_COUNTS: Record<BlogCategory, number> = {
  'Typing Tips': 12,
  'Guides': 8,
  'Practice': 10,
  'Productivity': 6,
  'News & Updates': 5,
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const POSTS: BlogPost[] = [
  {
    slug: 'typing-speed-tips',
    title: '10 Proven Tips to Increase Your Typing Speed',
    category: 'Typing Tips',
    description:
      'Discover practical techniques that can help you type faster while maintaining accuracy.',
    metaTitle: 'How to Increase Typing Speed – 10 Proven Tips | TypeOye',
    metaDescription:
      'Learn how to increase typing speed with 10 practical typing speed tips. Discover how to type faster while keeping your typing accuracy high, with free practice.',
    intro:
      'Typing faster is less about willpower and more about technique. Small, consistent changes to how you sit, move, and practice add up quickly — here are ten proven ways to raise your WPM without sacrificing accuracy.',
    readTime: 5,
    publishedAt: '2026-08-28',
    popular: true,
    image: '/assets/blog/typing-speed-tips.jpg',
    imageAlt: 'Typing speed practice',
    content: [
      {
        heading: '1. Learn Proper Finger Placement',
        body: 'Every finger has a designated row of keys, and starting position matters more than anything else. Rest your fingers on the home row — A S D F and J K L ; — and reach outward from there. This creates a reliable map of the keyboard that your hands can follow without thinking.',
      },
      {
        heading: '2. Practice Touch Typing',
        body: 'Touch typing means letting your fingers find the keys through muscle memory instead of your eyes. Start slowly, using all ten digits, and resist the urge to hunt and peck. The extra effort pays off within a few weeks with noticeably smoother, faster typing.',
      },
      {
        heading: '3. Focus on Accuracy First',
        body: 'Speed without accuracy is just fast retyping. When you correct every mistake and type carefully from the start, your brain learns the correct movement pattern. Accuracy-first practice builds a foundation that makes speed much easier to grow later.',
      },
      {
        heading: '4. Practice Regularly',
        body: 'Fifteen focused minutes a day beats a two-hour marathon once a week. Short, regular sessions keep your muscle memory warm and turn typing improvements into a habit. Consistency is the single biggest predictor of long-term speed gains.',
      },
      {
        heading: '5. Use Typing Tests',
        body: 'A typing test gives you concrete, repeatable numbers to train against — WPM, accuracy, and weak keys. Run a timed test at the start of each session, note your score, and watch the trend line move. What gets measured gets improved.',
      },
      {
        heading: '6. Learn Common Keyboard Patterns',
        body: 'English words are built from a small set of repeating letter combinations. Practice common prefixes, suffixes, and the words you type most at work or school. Your fingers learn these patterns as chunks, so your brain stops processing letter by letter.',
      },
      {
        heading: '7. Keep Your Hands Relaxed',
        body: 'Tension is the enemy of speed. When your wrists, fingers, and shoulders are tense, every keystroke is slower and less accurate. Sit upright, let your arms float gently over the keys, and type with light, relaxed taps rather than hard presses.',
      },
      {
        heading: '8. Avoid Looking at the Keyboard',
        body: 'Every glance at the keyboard breaks your rhythm and teaches your eyes to do your fingers’ job. Cover the keys with a light towel, or simply commit to keeping your gaze on the screen for one full session. Touch typing speed follows once your hands trust themselves.',
      },
      {
        heading: '9. Track Your Progress',
        body: 'Keep a log of your WPM and accuracy across sessions, and review the overall picture instead of any single test. Progress rarely moves in a straight line, so trends matter more than daily fluctuations. Seeing improvement over weeks is the best motivation there is.',
      },
      {
        heading: '10. Set Realistic Goals',
        body: 'Aim to add a few WPM per week rather than jumping straight from 40 to 90. Set a goal, break it into weekly milestones, and adjust as you go. Small, achievable wins keep you motivated and compound into serious speed over a few months.',
      },
    ],
  },
  {
    slug: 'home-row-technique',
    title: 'Home Row Technique: The Foundation of Fast Typing',
    category: 'Guides',
    description:
      'Learn why the home row is important and how mastering it can improve your typing skills.',
    metaTitle: 'Home Row Technique – The Foundation of Touch Typing | TypeOye',
    metaDescription:
      'Master the home row technique to type faster without looking at the keyboard. A practical touch typing guide covering finger placement, drills, and common mistakes.',
    intro:
      'Every fast typist shares one fundamental habit: the home row. This short guide explains what it is, why it matters, and how to build the muscle memory that makes effortless speed possible.',
    readTime: 6,
    publishedAt: '2026-08-25',
    popular: false,
    image: '/assets/blog/home-row-technique.jpg',
    imageAlt: 'Home row typing technique',
    content: [
      {
        heading: 'What Is the Home Row?',
        body: 'The home row is the middle band of letter keys — A S D F on the left and J K L ; on the right. It is called “home” because it is where your fingers rest at rest, and where they return after typing any key above or below. Tiny raised bumps on F and J let you find it by feel alone.',
      },
      {
        heading: 'Why the Home Row Matters',
        body: 'Typing speed is ultimately about minimizing finger travel. When every finger starts from a fixed position, reaching any key is a short, predictable movement. Without a home row, your hands drift, repeat themselves, and constantly re-map the keyboard — the main reason slow typists stay slow.',
      },
      {
        heading: 'Master the Correct Fingering',
        body: 'Each finger owns a slice of the keyboard. Index fingers handle the middle columns and reach the side keys; pinkies own the edges; thumbs rest on the spacebar. Learn which finger types which key and stick to it — even when a key feels slightly easier with a different finger.',
      },
      {
        heading: 'Drills to Lock In the Home Row',
        body: 'Begin with the eight home-row letters themselves, typing words like “has,” “lad,” and “fall” with your eyes on the screen. Then add a top-row key at a time — Q W E R T on the left, Y U I O P on the right — before introducing the bottom row. Slow and accurate is the goal; speed arrives on its own.',
      },
      {
        heading: 'Common Mistakes to Avoid',
        body: 'Watch out for returning to the wrong home position, using the index finger for keys the ring finger should own, and resting your wrists on the desk while typing. Keep your wrists floating, your fingertips light, and reset to the home row after every word you type.',
      },
    ],
  },
  {
    slug: 'typing-accuracy-exercises',
    title: 'Best Typing Exercises to Improve Accuracy',
    category: 'Practice',
    description: 'Improve your accuracy with simple and effective typing exercises.',
    metaTitle: 'Typing Exercises to Improve Your Accuracy | TypeOye',
    metaDescription:
      'Improve typing accuracy with simple typing exercises and targeted drills. Practice the skills that help you type faster and more accurately.',
    intro:
      'Accuracy is the multiplier that makes speed useful. These exercises train precise finger movement, eliminate habitual mistakes, and turn careful typing into automatic muscle memory.',
    readTime: 7,
    publishedAt: '2026-08-22',
    popular: false,
    image: '/assets/blog/typing-accuracy.jpg',
    imageAlt: 'Typing accuracy practice',
    content: [
      {
        heading: 'Why Accuracy Comes First',
        body: 'Every typo you fix adds a detour to your rhythm. Typists who focus on accuracy from the start build cleaner movement patterns, which makes later speed gains faster and more stable. Aim for accuracy above 97% before you try to chase your personal-best WPM.',
      },
      {
        heading: 'Slow Down to Speed Up',
        body: 'There is a comfortable pace where your accuracy peaks — find it and type there for a few sessions. Repeating a passage at a controlled tempo teaches your fingers the correct keystroke sequence. Once a passage is nailed at slow speed, gradually push the tempo up.',
      },
      {
        heading: 'Targeted Finger Drills',
        body: 'Run short drills that isolate specific fingers and transitions, like alternating left- and right-hand keys or practicing awkward combinations such as “qe,” “za,” and “io.” Trouble with a particular letter or roll is a signal to drill that movement a dozen times deliberately.',
      },
      {
        heading: 'Common Word and Phrase Drills',
        body: 'Typing real words is better practice than random keys because you internalize the finger sequence for whole words. Practice punctuation, capitalization, and your industry’s vocabulary. Repeating common words until they blur into single smooth movements dramatically raises a skill called fluency.',
      },
      {
        heading: 'Turn Every Test Into a Drill',
        body: 'When a typing test shows a dip in accuracy, resist repeating it immediately. Instead, slow down, retype only the passages where you stumbled, and return to the test once your weak spots are clean. Tests are diagnostics — drills are the treatment.',
      },
    ],
  },
  {
    slug: 'typing-productivity',
    title: 'How Good Typing Skills Boost Your Productivity',
    category: 'Productivity',
    description:
      'Learn how faster and more accurate typing can save time and improve your daily productivity.',
    metaTitle: 'How Good Typing Skills Boost Your Productivity | TypeOye',
    metaDescription:
      'Faster, more accurate typing saves hours every week. Learn how improving your typing speed and accuracy can boost your daily productivity.',
    intro:
      'Typing speed feels like a small metric, but it compounds across every email, document, and line of code you write. Here is what improving it actually does for your daily output.',
    readTime: 4,
    publishedAt: '2026-08-19',
    popular: true,
    image: '/assets/blog/typing-productivity.jpg',
    imageAlt: 'Typing productivity',
    content: [
      {
        heading: 'Save Hours Every Week',
        body: 'An average office worker types a few thousand words a day. Moving from 40 to 70 WPM roughly halves the time you spend on text entry — that quickly turns into hours every week that you can reinvest in thinking, planning, or simply finishing earlier.',
      },
      {
        heading: 'Keep Your Focus Longer',
        body: 'Slow, conscious typing hijacks your attention, leaving less mental room for the ideas you are trying to express. When typing becomes automatic, your working memory stays free for sentence structure, arguments, and decisions instead of key locations.',
      },
      {
        heading: 'Communicate Faster and Clearer',
        body: 'Speedy, accurate typing means you can reply while the conversation is still moving, capture notes without losing your train of thought, and ship documents without a second pass for typos. Fast typing is indistinguishable from slow, careful writing — accuracy keeps the quality.',
      },
      {
        heading: 'Reduce Errors and Rework',
        body: 'Accurate typing removes a whole class of small mistakes: transposed characters, dropped spaces, and autocorrect pandemonium. Every error avoided is a step of revision, readback, or embarrassed retrying that you never have to take.',
      },
      {
        heading: 'Small Investment, Big Return',
        body: 'Typing is the one skill almost every worker uses daily and almost no one formally trains. A few minutes of guided practice each day improves a tool you use for hours, which makes it one of the highest-leverage productivity upgrades available.',
      },
    ],
  },
  {
    slug: 'typeoye-updates',
    title: "What's New in Typeoye: Latest Updates",
    category: 'News & Updates',
    description:
      'Explore the latest improvements and features added to Typeoye to make your learning better than ever.',
    metaTitle: "What's New in TypeOye – Latest Updates | TypeOye",
    metaDescription:
      'Explore the latest TypeOye updates — new typing features, practice tools, and improvements that make learning to type faster and smarter.',
    intro:
      'Typeoye keeps improving the way you train. Here is everything we shipped recently to make practice smarter, tests fairer, and progress easier to understand.',
    readTime: 3,
    publishedAt: '2026-08-15',
    popular: false,
    image: '/assets/blog/typeoye-updates.jpg',
    imageAlt: 'Typeoye latest updates',
    content: [
      {
        heading: 'Reimagined Progress Tracking',
        body: 'My Progress now brings your overview, test results, practice history, and lessons together in one place, with cleaner charts and a dedicated Achievement center that shows exactly what to unlock next.',
      },
      {
        heading: 'Fresh Practice and Test Experiences',
        body: 'We refined the practice catalog so each drill targets a specific skill, and retuned the timed test screens for clearer guidance and less clutter. Results now break down your weak keys so you know precisely what to work on next.',
      },
      {
        heading: 'Better Performance Everywhere',
        body: 'Behind the scenes we trimmed load times across the app, improved the typing engine’s responsiveness for high-accuracy sessions, and polished the experience in both light and dark themes.',
      },
      {
        heading: "What's Next",
        body: 'Bigger lesson library, more games, and deeper analytics are on the way. Follow the Blog and your in-app roadmap to stay in the loop — and keep practicing.',
      },
    ],
  },
];