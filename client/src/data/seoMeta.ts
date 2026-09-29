import { POSTS } from './blog';

export interface RouteSeoMeta {
  title: string;
  description: string;
}

const STATIC_ROUTES: Record<string, RouteSeoMeta> = {
  '/': {
    title: 'Free Typing Test – Check Your Typing Speed & Accuracy | Typeoye',
    description: 'Take a free typing test online with Typeoye. Check your typing speed, WPM and accuracy, then practice to improve your typing skills.',
  },
  '/test': {
    title: 'Typing Test Online - Test Your Typing Speed | Typeoye',
    description: 'Take an online typing test to measure your WPM and accuracy. Test your typing speed with different durations and improve your typing skills with Typeoye.',
  },
  '/certificate': {
    title: 'Typing Certificate - Get Your Typing Test Certificate | Typeoye',
    description: 'Take a typing test and get a typing certificate based on your typing speed and accuracy with Typeoye.',
  },
  '/practice': {
    title: 'Free Typing Practice Online - Improve Your Typing Speed | Typeoye',
    description: 'Practice typing online for free with Typeoye. Improve typing speed, accuracy, and touch typing skills with focused typing practice.',
  },
  '/lessons': {
    title: 'Learn Touch Typing Online - Typing Lessons | Typeoye',
    description: 'Learn touch typing online with structured lessons and practice. Build typing accuracy, improve speed, and develop better keyboard skills with Typeoye.',
  },
  '/blog': {
    title: 'Typing Tips & Guides - Improve Your Typing Speed | Typeoye',
    description: 'Learn typing tips, improve your typing speed and accuracy, and discover useful touch typing guides and techniques on the Typeoye blog.',
  },
  '/how-it-works': {
    title: 'How It Works | Typeoye',
    description: 'Learn how Typeoye works - take a typing test, follow guided lessons, practice your weak keys, play typing games, and earn a typing certificate.',
  },
  '/faq': {
    title: 'Typing FAQ | Typeoye',
    description: 'Answers to common questions about Typeoye typing tests, lessons, practice drills, WPM and accuracy, certificates, and account management.',
  },
  '/support': {
    title: 'Help Center & Support | Typeoye',
    description: 'Get help with Typeoye - account setup, typing test and practice questions, Learn course, certificates, and troubleshooting guides.',
  },
  '/about': {
    title: 'About Typeoye | Online Typing Platform',
    description: 'Typeoye is a free online typing platform with typing tests, guided lessons, practice drills, and games to help you type faster and more accurately.',
  },
  '/contact': {
    title: 'Contact Typeoye',
    description: 'Questions about Typeoye? Get in touch with our team for support, feedback, or feature requests about typing tests, lessons, and practice.',
  },
  '/leaderboard': {
    title: 'Typing Speed Leaderboard - Fastest Typists | Typeoye',
    description: 'Compare your typing speed against the fastest typists on Typeoye. Explore daily, weekly, monthly, and all-time typing leaderboards.',
  },
  '/games': {
    title: 'Typing Games Online - Improve Your Typing Speed | Typeoye',
    description: 'Play free typing games online and improve your typing speed, accuracy, and keyboard skills while having fun with Typeoye.',
  },
  '/privacy': {
    title: 'Privacy Policy | Typeoye',
    description: 'Read the Typeoye privacy policy to learn how your typing test results, progress, and personal information are collected, used, and protected.',
  },
  '/terms': {
    title: 'Terms and Conditions | Typeoye',
    description: 'Read the Typeoye terms and conditions covering your use of the typing test, lessons, practice tools, games, and leaderboard.',
  },
  '/challenge': {
    title: 'Typing Challenge - Race a Friend in Real-Time | Typeoye',
    description: 'Create a typing challenge, share your code, and race a friend in a real-time one-minute typing battle. Compare WPM and accuracy live on Typeoye.',
  },
  '/login': {
    title: 'Login | Typeoye',
    description: 'Log in to your Typeoye account to save your typing progress, streaks, and results.',
  },
  '/register': {
    title: 'Create an Account | Typeoye',
    description: 'Create a free Typeoye account to track your typing speed, practice progress, and leaderboard rank.',
  },
  '/forgot-password': {
    title: 'Forgot Password | Typeoye',
    description: 'Reset your Typeoye account password and get back to typing tests, practice, and lessons.',
  },
  '/verify-email': {
    title: 'Verify Your Account | Typeoye',
    description: 'Verify your Typeoye email to finish setting up your account and start tracking your typing results.',
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
    title: 'How do I create an account? | Typeoye Support',
    description: 'Learn how to sign up for a free Typeoye account to save your progress, streaks, and appear on the leaderboard.',
  },
  '/support/reset-password': {
    title: 'How do I reset my password? | Typeoye Support',
    description: 'Forgot your password? Here is how to reset it and get back into your Typeoye account.',
  },
  '/support/typing-test-not-saving': {
    title: "Why isn't my typing test saving? | Typeoye Support",
    description: 'Troubleshoot issues with typing test results not appearing in your progress.',
  },
  '/support/skip-learn-course': {
    title: 'Can I skip ahead in the Learn course? | Typeoye Support',
    description: 'Understand how lesson progression works in the Learn course and whether you can skip lessons.',
  },
  '/support/certificate-not-earned': {
    title: 'Why did I not earn a certificate? | Typeoye Support',
    description: 'Find out why a certificate test attempt didn\'t result in you earning a certificate.',
  },
  '/support/site-not-loading': {
    title: 'The site is not loading properly - what should I do? | Typeoye Support',
    description: 'Basic troubleshooting steps when Typeoye does not load or behaves unexpectedly in your browser.',
  },
  '/support/change-email-address': {
    title: 'How do I change the email address on my account? | Typeoye Support',
    description: 'If you signed up with the wrong email or want to update it, here is what to do.',
  },
  '/support/delete-my-account': {
    title: 'How do I delete my account and data? | Typeoye Support',
    description: 'Learn what deleting your Typeoye account means and how to request it.',
  },
  '/support/change-test-duration-difficulty': {
    title: 'How do I change the test duration or difficulty? | Typeoye Support',
    description: 'Pick a time limit from 1 to 15 minutes and the difficulty level for your typing test.',
  },
  '/support/why-wpm-lower-than-expected': {
    title: 'Why is my WPM lower than I expected? | Typeoye Support',
    description: 'How Typeoye calculates words per minute and why your result may look different from other sites.',
  },
  '/support/difference-practice-and-learn': {
    title: 'What is the difference between Practice and the Learn course? | Typeoye Support',
    description: 'Understand how free-form drills in Practice compare to the structured 16-lesson Learn course.',
  },
  '/support/how-to-appear-on-leaderboard': {
    title: 'How do I appear on the leaderboard? | Typeoye Support',
    description: 'What it takes to rank on the Typeoye leaderboard.',
  },
  '/support/not-on-leaderboard': {
    title: "Why isn't my score showing on the leaderboard? | Typeoye Support",
    description: 'Common reasons a qualifying score doesn\'t appear and how to check.',
  },
  '/support/retake-certificate-test': {
    title: 'Can I retake the certificate test for a better score? | Typeoye Support',
    description: 'Yes — you can retry as many times as you like to improve your certificate.',
  },
  '/support/test-not-detecting-keystrokes': {
    title: "My typing test isn't detecting my keystrokes. | Typeoye Support",
    description: 'Fix common causes of keys not registering during a test.',
  },
};

const BLOG_POST_ROUTES: Record<string, RouteSeoMeta> = POSTS.reduce(
  (acc, post) => {
    acc[`/blog/${post.slug}`] = {
      title: post.metaTitle ?? `${post.title} | Typeoye Blog`,
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