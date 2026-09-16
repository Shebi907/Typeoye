import { BookOpen, AlertCircle, HelpCircle, Award, FileText, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const SUPPORT_CATEGORIES = [
  'Getting Started',
  'Account & Sign-in',
  'Test & Practice',
  'Learn Course',
  'Certificates',
  'Troubleshooting',
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export interface SupportArticle {
  slug: string;
  title: string;
  description: string;
  category: SupportCategory;
  icon: LucideIcon;
  readTime: number;
  updatedAt: string;
  /** Body copy. Lines starting with "1. " become numbered steps and lines
   *  starting with "- " become bullet lists; `**bold**` is supported inline. */
  body: string[];
  /** Supplementary important notes (time limits, attempt limits, fallbacks)
   *  rendered as amber warning callouts instead of plain paragraphs. */
  notes?: string[];
  keywords?: string[];
}

export const SUPPORT_CATEGORY_META: Record<SupportCategory, { icon: LucideIcon; bg: string; color: string }> = {
  'Getting Started': { icon: BookOpen, bg: 'rgba(67,97,238,0.1)', color: '#4361EE' },
  'Account & Sign-in': { icon: HelpCircle, bg: 'rgba(124,58,237,0.1)', color: '#7C3AED' },
  'Test & Practice': { icon: FileText, bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
  'Learn Course': { icon: AlertCircle, bg: 'rgba(245,166,11,0.1)', color: '#F5A623' },
  'Certificates': { icon: Award, bg: 'rgba(236,72,153,0.1)', color: '#EC4899' },
  'Troubleshooting': { icon: Wrench, bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
};

export const SUPPORT_CATEGORY_COUNTS: Record<SupportCategory, number> = {
  'Getting Started': 1,
  'Account & Sign-in': 1,
  'Test & Practice': 1,
  'Learn Course': 1,
  'Certificates': 1,
  'Troubleshooting': 1,
};

export const SUPPORT_ARTICLES: SupportArticle[] = [
  {
    slug: 'create-account',
    title: 'How do I create an account?',
    description: 'Learn how to sign up for a free Typeoye account to save your progress, streaks, and appear on the leaderboard.',
    category: 'Getting Started',
    icon: BookOpen,
    readTime: 1,
    updatedAt: 'Aug 25, 2026',
    keywords: ['signup', 'sign up', 'register', 'account', 'email', 'create', 'get started'],
    body: [
      'Creating a Typeoye account is quick and free:',
      '1. Click the **Sign Up** button in the top-right corner of the homepage.',
      '2. Enter your email address and choose a password.',
      '3. Click **Create Account** — you will receive a confirmation email.',
      '4. Verify your email by clicking the link in the confirmation email.',
      'Once verified, you can sign in to save your typing results, track your streaks, and appear on the leaderboard.',
    ],
  },
  {
    slug: 'reset-password',
    title: 'How do I reset my password?',
    description: 'Forgot your password? Here is how to reset it and get back into your Typeoye account.',
    category: 'Account & Sign-in',
    icon: HelpCircle,
    readTime: 1,
    updatedAt: 'Sep 16, 2026',
    keywords: ['password', 'reset', 'forgot', 'sign in', 'login', 'account', 'recover'],
    body: [
      'If you have forgotten your password, you can reset it by answering the security question you chose when creating your account:',
      '1. Go to the **Sign In** page and click **Forgot Password?** below the sign-in button.',
      '2. Enter the email address or username linked to your account, then click **Continue**.',
      '3. Read the **security question** shown and type your answer, then click **Verify Answer**.',
      '4. Enter a new password (at least 8 characters) and confirm it, then click **Reset Password**.',
      '5. Sign in with your new password.',
    ],
    notes: [
      'Security answers are **not case-sensitive**, and leading or trailing spaces are ignored when checking your answer.',
      'After **5 incorrect answers**, password recovery is temporarily locked for **30 minutes**. You can try again once the lock expires.',
      'Once you answer the security question correctly, you have **10 minutes** to set your new password. If the session expires, simply start the recovery process again.',
      'If your account has no security question set up, the app will let you know — you can add one from your **Profile** page.',
    ],
  },
  {
    slug: 'typing-test-not-saving',
    title: "Why isn't my typing test saving?",
    description: 'Troubleshoot issues with typing test results not appearing in your progress.',
    category: 'Test & Practice',
    icon: FileText,
    readTime: 2,
    updatedAt: 'Aug 20, 2026',
    keywords: ['typing test', 'test', 'results', 'progress', 'save', 'saving', 'words per minute'],
    body: [
      'If your typing test results are not being saved, check the following:',
      '- **You are signed in.** Guest results are not saved to your account. Sign in before starting a test.',
      '- **The test completed normally.** If you closed the browser or navigated away before the timer ended, the result was not recorded.',
      '- **No network errors appeared.** A brief connection issue during save can prevent the result from reaching the server. Check your browser console for failed requests.',
    ],
    notes: [
      'If none of the above applies and results still are not saving, contact support with your email address and the approximate time of the test.',
    ],
  },
  {
    slug: 'skip-learn-course',
    title: 'Can I skip ahead in the Learn course?',
    description: 'Understand how lesson progression works in the Learn course and whether you can skip lessons.',
    category: 'Learn Course',
    icon: AlertCircle,
    readTime: 2,
    updatedAt: 'Aug 18, 2026',
    keywords: ['lessons', 'learn', 'skip', 'progression', 'course', 'accuracy', 'unlock', 'lesson'],
    body: [
      'Each lesson in the Learn course must be completed before the next one unlocks.',
      'To complete a lesson, you need to:',
      '- Finish all exercises in the lesson.',
      '- Achieve at least the required accuracy threshold (usually 90%).',
      'Focus on accuracy over speed — the exercises are designed to build proper muscle memory, and rushing them can form bad habits.',
    ],
    notes: [
      'There is no built-in skip button. However, if you already have strong typing skills, you can quickly pass each exercise to unlock the next one.',
    ],
  },
  {
    slug: 'certificate-not-earned',
    title: 'Why did I not earn a certificate?',
    description: 'Find out why a certificate test attempt did not result in a earned certificate.',
    category: 'Certificates',
    icon: Award,
    readTime: 1,
    updatedAt: 'Aug 15, 2026',
    keywords: ['certificate', 'wpm', 'accuracy', 'earn', 'requirements', '30 wpm'],
    body: [
      'To earn a Typeoye certificate, you must meet both requirements in a single certificate test:',
      '- **At least 30 WPM** typing speed.',
      '- **90% accuracy or higher**.',
      'If your result was below either threshold, the certificate will not be issued. Review your results screen to see exactly where you fell short.',
      'Tips for earning your certificate:',
      '- Pick a comfortable, distraction-free environment.',
      '- Focus on accuracy first — speed will follow naturally.',
    ],
    notes: [
      'You can retake the certificate test as many times as you want.',
    ],
  },
  {
    slug: 'site-not-loading',
    title: 'The site is not loading properly — what should I do?',
    description: 'Basic troubleshooting steps when Typeoye does not load or behaves unexpectedly in your browser.',
    category: 'Troubleshooting',
    icon: Wrench,
    readTime: 2,
    updatedAt: 'Aug 10, 2026',
    keywords: ['loading', 'not loading', 'browser', 'connection', 'troubleshoot', 'error', 'cache', 'site'],
    body: [
      'If Typeoye is not loading or behaves unexpectedly, try these steps:',
      '1. **Refresh the page.** A simple hard refresh (Ctrl + Shift + R on desktop) clears most temporary issues.',
      '2. **Clear your browser cache.** An outdated cached file can cause loading problems. Clear your browsing data for typeoye.com.',
      '3. **Try a different browser.** Typeoye works best on Chrome, Edge, Firefox, or Safari. If one browser has issues, try another.',
      '4. **Check your internet connection.** Ensure you have a stable connection — a weak or intermittent signal can prevent the app from loading.',
      '5. **Disable browser extensions.** Some ad-blockers or privacy extensions can interfere with the site. Try disabling them temporarily.',
    ],
    notes: [
      'If none of these steps help, reach out to our support team with your browser name, version, and a screenshot of the issue.',
    ],
  },
];
