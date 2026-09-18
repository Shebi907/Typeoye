import { BookOpen, AlertCircle, Gamepad2, HelpCircle, Award, FileText, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const SUPPORT_CATEGORIES = [
  'Getting Started',
  'Account & Sign-in',
  'Test & Practice',
  'Learn Course',
  'Games & Leaderboard',
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
  'Games & Leaderboard': { icon: Gamepad2, bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
  'Certificates': { icon: Award, bg: 'rgba(236,72,153,0.1)', color: '#EC4899' },
  'Troubleshooting': { icon: Wrench, bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
};

export const SUPPORT_CATEGORY_COUNTS: Record<SupportCategory, number> = {
  'Getting Started': 1,
  'Account & Sign-in': 3,
  'Test & Practice': 4,
  'Learn Course': 1,
  'Games & Leaderboard': 2,
  'Certificates': 2,
  'Troubleshooting': 2,
};

export const SUPPORT_ARTICLES: SupportArticle[] = [
  {
    slug: 'create-account',
    title: 'How do I create an account?',
    description: 'Learn how to sign up for a free Typeoye account to save your progress, streaks, and appear on the leaderboard.',
    category: 'Getting Started',
    icon: BookOpen,
    readTime: 1,
    updatedAt: 'Sep 16, 2026',
    keywords: ['signup', 'sign up', 'register', 'account', 'email', 'create', 'get started'],
    body: [
      'Creating a Typeoye account is quick and free:',
      '1. Click **Get Started** in the top-right corner of the homepage (or go to the Sign Up page directly).',
      '2. Enter your **username** — 3 to 20 characters, using letters, numbers, and underscores.',
      '3. Enter your **email address**.',
      '4. Choose a **password** of at least 8 characters.',
      '5. Pick a **security question** from the list and type your answer. You will use this to recover your account if you ever forget your password.',
      '6. Click **Sign Up Free**. Your account is created right away — no confirmation email needed — and you are signed in immediately.',
      'You can now save your typing results, track your streaks, and appear on the leaderboard, all tied to your account.',
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
    description: 'Find out why a certificate test attempt didn\'t result in you earning a certificate.',
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
  {
    slug: 'change-email-address',
    title: 'How do I change the email address on my account?',
    description: 'If you signed up with the wrong email or want to update it, here is what to do.',
    category: 'Account & Sign-in',
    icon: HelpCircle,
    readTime: 1,
    updatedAt: 'Sep 18, 2026',
    keywords: ['email', 'change email', 'update email', 'account', 'sign in', 'email address'],
    body: [
      'There is currently **no in-app option to change your email address**. Your email is what you use to sign in, so we verify changes manually to keep your account safe.',
      '1. Email us at **contact.typeoye@gmail.com** from the email address currently on your account.',
      '2. Include your **username** and the **new email address** you want to use.',
      '3. We will confirm the change and let you know when it is done — after that, sign in with the new email.',
    ],
    notes: [
      'Typeoye does not send confirmation emails, so there is no link to click after signing up. If you simply used the wrong email when creating a brand-new account, the quickest fix is to create a fresh account with the correct email.',
    ],
  },
  {
    slug: 'delete-my-account',
    title: 'How do I delete my account and data?',
    description: 'Learn what deleting your Typeoye account means and how to request it.',
    category: 'Account & Sign-in',
    icon: HelpCircle,
    readTime: 1,
    updatedAt: 'Sep 18, 2026',
    keywords: ['delete account', 'remove account', 'delete data', 'privacy', 'close account'],
    body: [
      'There is currently **no self-service delete button** in Typeoye.',
      '1. To delete your account, email **contact.typeoye@gmail.com** from the email address on the account and include your **username**.',
      '2. We will confirm your request and then permanently remove your account along with your saved results, progress, and streaks.',
      '3. You can keep using Typeoye as a guest at any time — results during guest sessions are not saved.',
    ],
    notes: [
      'Account deletion is permanent and cannot be undone. If you are unsure, you can simply stop signing in instead — unused accounts are never billed or penalized, and you can return to them anytime.',
    ],
  },
  {
    slug: 'change-test-duration-difficulty',
    title: 'How do I change the test duration or difficulty?',
    description: 'Pick a time limit from 1 to 15 minutes and the difficulty level for your typing test.',
    category: 'Test & Practice',
    icon: FileText,
    readTime: 1,
    updatedAt: 'Sep 18, 2026',
    keywords: ['duration', 'difficulty', 'time limit', 'minutes', 'easy', 'medium', 'hard', 'test settings'],
    body: [
      '1. Go to the **Typing Test** page (the main test screen).',
      '2. Choose a **time limit**: **1, 2, 5, 10, or 15 minutes**. This is how long the test runs.',
      '3. Pick a **difficulty**: **Easy, Medium, or Hard**. Higher difficulty uses longer, more complex words that are harder to type accurately.',
      '4. If you are signed in and want more of a challenge, toggle on **numbers** or **punctuation** from the settings on the test screen — these add extra characters to the text.',
      '5. Click **Start** when you are ready. Longer tests give a steadier (and usually more accurate) speed estimate, while 1-minute tests split the difference between warm-up and finish.',
    ],
    notes: [
      'Your difficulty and duration choice is remembered for the session but the words are always freshly generated for each run.',
    ],
  },
  {
    slug: 'why-wpm-lower-than-expected',
    title: 'Why is my WPM lower than I expected?',
    description: 'How Typeoye calculates words per minute and why your result may look different from other sites.',
    category: 'Test & Practice',
    icon: FileText,
    readTime: 2,
    updatedAt: 'Sep 18, 2026',
    keywords: ['wpm', 'speed', 'low wpm', 'score', 'calculate', 'words per minute', 'accuracy'],
    body: [
      'Typeoye counts only **words you finish completely and correctly**. Every correctly typed word counts as exactly **1 word** — a short word like "to" and a long word like "keyboard" count the same.',
      '1. **Words with a mistake are not counted at all.** Even one wrong character means that word earns 0, and your WPM is `correct words \u00f7 minutes`. A few slipped words can pull the number down noticeably.',
      '2. **Long words lower your WPM.** Because each word is counted as 1 regardless of length, a passage of long words produces a lower WPM than short words at the same real typing speed.',
      '3. **Numbers and punctuation add keystrokes.** With these toggled on, every symbol is extra work that takes time without adding extra "words."',
      '4. **A higher difficulty means harder words**, which almost always reduces both speed and accuracy until you are comfortable with them.',
      '5. **Short tests are noisier.** Backspacing, warming up, and the final rush are a bigger share of a 1-minute test than a 10-minute one.',
    ],
    notes: [
      'Typeoye does **not** use the older "one word = 5 characters" convention that many other sites use. It counts real words typed correctly, which often shows slightly lower WPM than converters that reward raw keystroke speed. Your accuracy is measured the same way: correct words \u00f7 attempted words \u00d7 100.',
    ],
  },
  {
    slug: 'difference-practice-and-learn',
    title: 'What is the difference between Practice and the Learn course?',
    description: 'Understand how free-form drills in Practice compare to the structured 16-lesson Learn course.',
    category: 'Test & Practice',
    icon: FileText,
    readTime: 2,
    updatedAt: 'Sep 18, 2026',
    keywords: ['practice', 'learn', 'lesson', 'drills', 'course', 'difference', 'unlock'],
    body: [
      '1. **Practice** gives you free-form typing drills you can run anytime. Choose from **character, combination, word, sentence, paragraph, or quick** drills, plus paste-your-own **custom text**, pick a difficulty and duration, and type.',
      '2. **Learn** is a structured course with **16 lessons across 4 stages** — Foundation, Building Blocks, Flow & Rhythm, and Advanced.',
      '3. Lessons **unlock one at a time**: you must complete a lesson (including its exercises at the required accuracy) before the next one opens. Practice has no such requirement.',
      '4. **Practice is for drilling specific problem areas** — a particular row, letter combo, or your own text. **Learn is for building proper technique from the ground up**.',
      '5. Both save your results when you are signed in, and both build typing speed and accuracy. Neither grants leaderboard placement — only completed timed tests and games do.',
    ],
    notes: [
      'If you are new to touch typing, the Learn course is the strongest starting point; use Practice drills between lessons to reinforce what you just learned. Signing in lets you save and review your practice history.',
    ],
  },
  {
    slug: 'how-to-appear-on-leaderboard',
    title: 'How do I appear on the leaderboard?',
    description: 'What it takes to rank on the Typeoye leaderboard.',
    category: 'Games & Leaderboard',
    icon: Gamepad2,
    readTime: 1,
    updatedAt: 'Sep 18, 2026',
    keywords: ['leaderboard', 'rank', 'ranking', 'score', 'compete', 'top'],
    body: [
      '1. **Sign in first.** Guest sessions are never saved, so guests can\'t rank.',
      '2. Complete a **timed typing test** **or** finish a **game** — both count toward the leaderboard.',
      '3. Hit at least **90% accuracy** on that run. Only runs at or above this threshold qualify.',
      '4. Your position is based on your **best WPM** among your qualifying runs in the selected period.',
      '5. Pick a period at the top of the leaderboard: **Today, This Week, This Month, or All Time**.',
      '6. Your rank and display name appear in the Top 3 or in the ranked list — and your personal position is always shown at the bottom of the board.',
    ],
    notes: [
      'Minimum accuracy is normally 90%, but an administrator can adjust it. If you qualify, your best qualifying run is what counts — improving it later moves you up.',
    ],
  },
  {
    slug: 'not-on-leaderboard',
    title: "Why isn't my score showing on the leaderboard?",
    description: 'Common reasons a qualifying score doesn\'t appear and how to check.',
    category: 'Games & Leaderboard',
    icon: Gamepad2,
    readTime: 2,
    updatedAt: 'Sep 18, 2026',
    keywords: ['leaderboard', 'score', 'missing', 'not showing', 'rank', 'not saved'],
    body: [
      '1. **Check you are signed in.** If you were a guest, nothing was saved at all — redo the run while signed in.',
      '2. **Check your accuracy.** A run below **90%** accuracy doesn\'t qualify, no matter how fast it was. Your results screen shows the exact accuracy of each run.',
      '3. **Only timed tests and games rank.** Practice drills and Learn lessons save to your stats but never place on the leaderboard.',
      '4. **Check the period tab.** A run from earlier might only show under **This Week, This Month, or All Time** — not **Today**.',
      '5. **Make sure the run completed.** If you left the page or closed the tab before the timer ended, the result was not saved.',
      '6. **Give it a moment.** The board refreshes after a completed save; reload the page if your newest result is missing.',
    ],
    notes: [
      'Your personal slot is always shown at the bottom of the leaderboard once you have at least one qualifying run — even if you\'re outside the Top 50 — so if there is no "you" row at all, the run didn\'t qualify or didn\'t save.',
    ],
  },
  {
    slug: 'retake-certificate-test',
    title: 'Can I retake the certificate test for a better score?',
    description: 'Yes — you can retry as many times as you like to improve your certificate.',
    category: 'Certificates',
    icon: Award,
    readTime: 1,
    updatedAt: 'Sep 18, 2026',
    keywords: ['certificate', 'retake', 'retry', 'better score', 'redo', '30 wpm'],
    body: [
      '1. Go to the **Certificate** page and enter the name for your certificate.',
      '2. Click **Start Test** to begin a fresh certificate test. Each attempt generates new text, so you can\'t memorize answers.',
      '3. Meet **both requirements in the same run** to earn the certificate: **at least 30 WPM** and **90% accuracy or higher**.',
      '4. When you qualify, the certificate page lets you **download your PDF** — named `Typeoye-Typing-Certificate-<your-name>.pdf`.',
      '5. Repeat as often as you like. Every attempt is independent — one weak run does not block or excuse a later one.',
    ],
    notes: [
      'A certificate is issued per qualifying run, not per account, and the certificate test uses the same speed and accuracy scoring as regular tests. Signing in makes tracking easier and lets you practice between attempts.',
    ],
  },
  {
    slug: 'test-not-detecting-keystrokes',
    title: "My typing test isn't detecting my keystrokes.",
    description: 'Fix common causes of keys not registering during a test.',
    category: 'Troubleshooting',
    icon: Wrench,
    readTime: 2,
    updatedAt: 'Sep 18, 2026',
    keywords: ['keystrokes', 'keys', 'not working', 'not detecting', 'input', 'keyboard', 'registering'],
    body: [
      '1. **Click the typing area first.** Typeoye detects keys on the page — if focus is in the browser address bar, another tab, a pop-up, or a search box, nothing registers. Click the highlighted word and try again.',
      '2. **Test your keyboard outside the site.** Open any text box (even the browser\'s) and type. If nothing appears, check your keyboard: USB or unified receiver seating, Bluetooth pairing, **batteries**, or a stuck key.',
      '3. **Check your keyboard layout.** If your device is set to a different language layout than the keycaps you use, characters won\'t match what you press.',
      '4. **Make sure a modifier key isn\'t stuck.** Ctrl, Alt, and Cmd are intentionally ignored while typing — if one is physically stuck down, letter keys may stop registering at all.',
      '5. **A character typed into a text field on the page can count before the test expects it.** Avoid typing while an input box inside the app is focused.',
      '6. **Try a different browser** or a hard refresh (Ctrl + Shift + R / Cmd + Shift + R), and temporarily disable extensions that modify keyboard input.',
    ],
    notes: [
      'If specific keys fail only during the test but work everywhere else, contact support with your operating system, browser, and which keys fail — we will help you sort it out.',
    ],
  },
];
