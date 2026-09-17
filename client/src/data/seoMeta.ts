import { POSTS } from './blog';

export interface RouteSeoMeta {
  title: string;
  description: string;
}

const STATIC_ROUTES: Record<string, RouteSeoMeta> = {
  '/': {
    title: 'Free Typing Test Online - Check Your WPM & Accuracy | TypeOye',
    description: 'Take a free typing test online and check your typing speed, WPM, and accuracy. Practice touch typing, improve your speed, and learn with TypeOye.',
  },
  '/test': {
    title: 'Typing Test Online - Test Your Typing Speed | TypeOye',
    description: 'Take an online typing test to measure your WPM and accuracy. Test your typing speed with different durations and improve your typing skills with TypeOye.',
  },
  '/certificate': {
    title: 'Typing Certificate - Get Your Typing Test Certificate | TypeOye',
    description: 'Take a typing test and get a typing certificate based on your typing speed and accuracy with TypeOye.',
  },
  '/practice': {
    title: 'Free Typing Practice Online - Improve Your Typing Speed | TypeOye',
    description: 'Practice typing online for free with TypeOye. Improve typing speed, accuracy, and touch typing skills with focused typing practice.',
  },
  '/lessons': {
    title: 'Learn Touch Typing Online - Typing Lessons | TypeOye',
    description: 'Learn touch typing online with structured lessons and practice. Build typing accuracy, improve speed, and develop better keyboard skills with TypeOye.',
  },
  '/blog': {
    title: 'Typing Tips & Guides - Improve Your Typing Speed | TypeOye',
    description: 'Learn typing tips, improve your typing speed and accuracy, and discover useful touch typing guides and techniques on the TypeOye blog.',
  },
  '/how-it-works': {
    title: 'How It Works | TypeOye',
    description: 'Learn how TypeOye works - take a typing test, follow guided lessons, practice your weak keys, play typing games, and earn a typing certificate.',
  },
  '/faq': {
    title: 'Typing FAQ | TypeOye',
    description: 'Answers to common questions about TypeOye typing tests, lessons, practice drills, WPM and accuracy, certificates, and account management.',
  },
  '/support': {
    title: 'Help Center & Support | TypeOye',
    description: 'Get help with TypeOye - account setup, typing test and practice questions, Learn course, certificates, and troubleshooting guides.',
  },
  '/about': {
    title: 'About TypeOye | Online Typing Platform',
    description: 'TypeOye is a free online typing platform with typing tests, guided lessons, practice drills, and games to help you type faster and more accurately.',
  },
  '/contact': {
    title: 'Contact TypeOye',
    description: 'Questions about TypeOye? Get in touch with our team for support, feedback, or feature requests about typing tests, lessons, and practice.',
  },
  '/leaderboard': {
    title: 'Typing Speed Leaderboard - Fastest Typists | Typeoye',
    description: 'Compare your typing speed against the fastest typists on Typeoye. Explore daily, weekly, monthly, and all-time typing leaderboards.',
  },
  '/games': {
    title: 'Typing Games Online - Improve Your Typing Speed | TypeOye',
    description: 'Play free typing games online and improve your typing speed, accuracy, and keyboard skills while having fun with TypeOye.',
  },
  '/privacy': {
    title: 'Privacy Policy | TypeOye',
    description: 'Read the TypeOye privacy policy to learn how your typing test results, progress, and personal information are collected, used, and protected.',
  },
  '/terms': {
    title: 'Terms and Conditions | TypeOye',
    description: 'Read the TypeOye terms and conditions covering your use of the typing test, lessons, practice tools, games, and leaderboard.',
  },
  '/challenge': {
    title: 'Typing Challenge - Race a Friend in Real-Time | TypeOye',
    description: 'Create a typing challenge, share your code, and race a friend in a real-time one-minute typing battle. Compare WPM and accuracy live on TypeOye.',
  },
  '/login': {
    title: 'Login | TypeOye',
    description: 'Log in to your TypeOye account to save your typing progress, streaks, and results.',
  },
  '/register': {
    title: 'Create an Account | TypeOye',
    description: 'Create a free TypeOye account to track your typing speed, practice progress, and leaderboard rank.',
  },
  '/forgot-password': {
    title: 'Forgot Password | TypeOye',
    description: 'Reset your TypeOye account password and get back to typing tests, practice, and lessons.',
  },
  '/verify-email': {
    title: 'Verify Your Account | TypeOye',
    description: 'Verify your TypeOye email to finish setting up your account and start tracking your typing results.',
  },
};

const PREFIX_FALLBACKS: Record<string, RouteSeoMeta> = {
  '/blog/*': STATIC_ROUTES['/blog'],
  '/support/*': STATIC_ROUTES['/support'],
  '/challenge/*': STATIC_ROUTES['/challenge'],
  '/practice/*': STATIC_ROUTES['/practice'],
  '/lessons/*': STATIC_ROUTES['/lessons'],
};

const SUPPORT_ARTICLE_ROUTES: Record<string, RouteSeoMeta> = {
  '/support/create-account': {
    title: 'How do I create an account? | TypeOye Support',
    description: 'Learn how to sign up for a free Typeoye account to save your progress, streaks, and appear on the leaderboard.',
  },
  '/support/reset-password': {
    title: 'How do I reset my password? | TypeOye Support',
    description: 'Forgot your password? Here is how to reset it and get back into your Typeoye account.',
  },
  '/support/typing-test-not-saving': {
    title: "Why isn't my typing test saving? | TypeOye Support",
    description: 'Troubleshoot issues with typing test results not appearing in your progress.',
  },
  '/support/skip-learn-course': {
    title: 'Can I skip ahead in the Learn course? | TypeOye Support',
    description: 'Understand how lesson progression works in the Learn course and whether you can skip lessons.',
  },
  '/support/certificate-not-earned': {
    title: 'Why did I not earn a certificate? | TypeOye Support',
    description: 'Find out why a certificate test attempt didn\'t result in you earning a certificate.',
  },
  '/support/site-not-loading': {
    title: 'The site is not loading properly - what should I do? | TypeOye Support',
    description: 'Basic troubleshooting steps when Typeoye does not load or behaves unexpectedly in your browser.',
  },
};

const BLOG_POST_ROUTES: Record<string, RouteSeoMeta> = POSTS.reduce(
  (acc, post) => {
    acc[`/blog/${post.slug}`] = {
      title: post.metaTitle ?? `${post.title} | TypeOye Blog`,
      description: post.metaDescription ?? post.description,
    };
    return acc;
  },
  {} as Record<string, RouteSeoMeta>,
);

export const SEO_META: Record<string, RouteSeoMeta> = {
  ...STATIC_ROUTES,
  ...PREFIX_FALLBACKS,
  ...SUPPORT_ARTICLE_ROUTES,
  ...BLOG_POST_ROUTES,
};