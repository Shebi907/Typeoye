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
    title: 'Free Typing Test – Check Your WPM and Accuracy | Typeoye',
    description: 'Take a free typing test online and see your WPM and accuracy instantly. Choose a 1 to 15 minute test, then practise to type faster with Typeoye.',
  },
  '/certificate': {
    title: 'Typing Certificate – Test Your Speed & Accuracy | Typeoye',
    description: 'Take a timed typing test and earn a typing certificate based on your WPM and accuracy. See the requirements and get started with Typeoye.',
  },
  '/practice': {
    title: 'Free Typing Practice Online – Speed & Accuracy | Typeoye',
    description: 'Practise typing online for free with focused drills: characters, combinations, words, sentences, paragraphs, or your own text. Improve speed and accuracy.',
  },
  '/lessons': {
    title: 'Learn Touch Typing Online – Free Typing Lessons | Typeoye',
    description: 'Learn touch typing with free structured lessons from beginner to advanced. Build accuracy and speed across 16 levels with Typeoye.',
  },
  '/urdu-lessons': {
    title: 'Learn Urdu Typing Online – Urdu Typing Lessons | Typeoye',
    description: 'Learn Urdu typing online with 16 structured levels. Practise Urdu characters, words, and sentences on a phonetic keyboard with Typeoye.',
  },
  '/urdu-practice': {
    title: 'Urdu Typing Practice – Improve Urdu Speed | Typeoye',
    description: 'Practise Urdu typing free online. Drill Urdu characters, combinations, words, sentences, and paragraphs, or paste your own Urdu text.',
  },
  '/urdu-typing-test/setup': {
    title: 'Urdu Typing Test – Check Urdu Speed & Accuracy | Typeoye',
    description: 'Take a free Urdu typing test online. Choose 1, 2, or 5 minutes and an easy, medium, or hard passage, then check your Urdu WPM and accuracy.',
  },
  '/urdu-typing-test': {
    title: 'Urdu Typing Test – Measure Urdu WPM | Typeoye',
    description: 'Measure your Urdu typing speed and accuracy in words per minute using the Typeoye phonetic Urdu keyboard mapping.',
  },
  '/blog': {
    title: 'Typing Tips & Guides for Faster Typing | Typeoye',
    description: 'Practical typing tips and guides on touch typing, improving WPM, accuracy, practice routines, and typing tools, from the Typeoye team.',
  },
  '/how-it-works': {
    title: 'How It Works | Typeoye',
    description: 'Learn how Typeoye works - take a typing test, follow guided lessons, practice your weak keys, play typing games, and earn a typing certificate.',
  },
  '/faq': {
    title: 'Typing Test FAQ: WPM, Accuracy & Certificates | Typeoye',
    description: 'Answers to common questions about typing tests, WPM, accuracy, lessons, practice, certificates, leaderboards, and Typeoye accounts.',
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
    title: 'Free Typing Games Online to Type Faster | Typeoye',
    description: 'Play free typing games online and improve your typing speed and accuracy. Race, type falling words, and survive sudden-death sprints on Typeoye.',
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
    title: 'Typing Challenge Online – 1v1 Typing Speed Battle | Typeoye',
    description:
      'Challenge a friend to a real-time typing battle on Typeoye. Test your typing speed, compare WPM and accuracy, and see who wins the typing challenge.',
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
  '/practice/*': STATIC_ROUTES['/practice'],
  '/lessons/*': STATIC_ROUTES['/lessons'],
  '/urdu-practice/*': STATIC_ROUTES['/urdu-practice'],
  '/urdu-lessons/*': STATIC_ROUTES['/urdu-lessons'],
  /* '/challenge/*' is intentionally NOT a prefix fallback. Every
     /challenge/:code is a private match session identified by a share code, so
     falling back to the landing page's title/keywords would make every invite
     link a keyword-stuffed near-duplicate of /challenge. Those URLs are handled
     explicitly in index.html's inline SEO script instead: noindex, nofollow and
     a canonical pointing at the public landing page. */
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