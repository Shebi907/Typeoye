import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { RequireAuth } from './components/auth/RequireAuth';
import { ensureUrduContentLoaded } from './utils/urduContentSync';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import OAuthCallback from './pages/OAuthCallback';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import TestMode from './pages/TestMode';
import Practice from './pages/Practice';
import PracticeSetup from './pages/PracticeSetup';
import PracticeSession from './pages/PracticeSession';
import Analytics from './pages/Analytics';
import Leaderboard from './pages/Leaderboard';
import Games from './pages/Games';
import Challenge from './pages/Challenge';
import UrduTypingTestSetup from './pages/UrduTypingTestSetup';
import UrduTypingTest from './pages/UrduTypingTest';
import UrduPractice from './pages/UrduPractice';
import UrduPracticeSetup from './pages/UrduPracticeSetup';
import UrduPracticeSession from './pages/UrduPracticeSession';

import Learn from './pages/Learn';
import LessonPlayer from './pages/LessonPlayer';
import UrduLearn from './pages/UrduLearn';
import UrduLessonPlayer from './pages/UrduLessonPlayer';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import HowItWorks from './pages/HowItWorks';
import Faq from './pages/Faq';
import SupportCenter from './pages/SupportCenter';
import SupportArticle from './pages/SupportArticle';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import ProgressPage from './pages/Progress';
import UrduProgressPage from './pages/UrduProgress';
import AchievementsPage from './pages/AchievementsPage';
import CertificatePage from './pages/CertificatePage';
import Settings from './pages/Settings';
import MyCertificates from './pages/MyCertificates';
import ProfilePage from './pages/Profile';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLessons from './pages/admin/AdminLessons';
import AdminContent from './pages/admin/AdminContent';
import AdminAchievements from './pages/admin/AdminAchievements';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCertificateParagraphs from './pages/admin/AdminCertificateParagraphs';
import AdminUrduContent from './pages/admin/AdminUrduContent';
import AdminUrduLessons from './pages/admin/AdminUrduLessons';

/**
 * The Test page doubles as the certificate timed-test flow, distinguished only
 * by `?cert=1` in the URL. React Router matches both to the same route element
 * and does NOT remount it when only the search params change, so a finished
 * engine + result modal would leak from one flow into the other. Keying the
 * component on the search string forces a fresh mount whenever the flow flips.
 */
function TestRoute() {
  const { search } = useLocation();
  return <TestMode key={search} />;
}

/**
 * The root "/" always shows the marketing landing page (the intended Home),
 * regardless of sign-in state. Signed-in users' personalized home is the
 * Progress page (/progress), which the navbar links to for them ΓÇö so the old
 * signed-in dashboard is NOT rendered at "/". It lives INSIDE the shared
 * <AppLayout /> route group (as an index route) so navigating away only swaps
 * this page's content ΓÇö never the whole shell (navbar, background sheet,
 * footer). A standalone route wrapper would remount the entire layout on
 * exit, which shows a full-screen flash when leaving Home.
 */
function Home() {
  return <Landing />;
}

export default function App() {
  // Hydrate the Urdu content registry once at startup so admin-published
  // passages/practice items are present for the first Urdu session. Never blocks
  // render — the bundled content is used until (and unless) this resolves.
  useEffect(() => {
    void ensureUrduContentLoaded();
  }, []);

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* Google OAuth round-trip ΓÇö standalone (no login layout, no app shell). */}
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* Website shell ΓÇö ONE persistent AppLayout for the entire app (navbar,
          background sheet, footer). Sign-in-independent pages live directly in
          it; account pages are nested behind the <RequireAuth /> guard.

          Because there is a single shell instance, React Router NEVER unmounts
          the navbar/sheet/footer when moving between pages (e.g. Test ΓåÆ My
          Profile) ΓÇö it only swaps the <Outlet /> content. That is what prevents
          a full-screen white flash: no layout teardown + instant data. */}
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="/test" element={<TestRoute />} />
          <Route path='/urdu-typing-test/setup' element={<UrduTypingTestSetup />} />
          <Route path='/urdu-typing-test' element={<UrduTypingTest />} />
          <Route path='/urdu-practice' element={<UrduPractice />} />
          <Route path='/urdu-practice/:slug' element={<UrduPracticeSetup />} />
          <Route path='/urdu-practice/:slug/session' element={<UrduPracticeSession />} />
        <Route path="/certificate" element={<CertificatePage />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/practice/:slug" element={<PracticeSetup />} />
        <Route path="/practice/:slug/session" element={<PracticeSession />} />
        <Route path="/lessons" element={<Learn />} />
        <Route path="/lessons/:id" element={<LessonPlayer />} />
        <Route path="/urdu-lessons" element={<UrduLearn />} />
        <Route path="/urdu-lessons/:id" element={<UrduLessonPlayer />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/support" element={<SupportCenter />} />
        <Route path="/support/:slug" element={<SupportArticle />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/games" element={<Games />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Typing Challenge LANDING page ΓÇö deliberately public (outside the
            RequireAuth guard below) so search crawlers and guests can render
            and index it. It only markets the feature; actually creating or
            joining a challenge still requires an account, and ChallengeHome
            sends guests to /login before any write. The private match session
            (/challenge/:code) stays inside the guard below. */}
        <Route path="/challenge" element={<Challenge />} />

        {/* Account pages ΓÇö sign-in required. The guard is nested INSIDE the
            shared shell, so entering these routes (e.g. My Profile) swaps only
            the page content and never remounts the layout. */}
        <Route element={<RequireAuth />}>
          <Route path="/analytics" element={<Analytics />} />
          {/* Private match sessions: invite links, live lobbies, live stats and
              per-player results. Auth-gated and noindex. */}
          <Route path="/challenge/:code" element={<Challenge />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/progress/test" element={<ProgressPage />} />
          <Route path="/progress/practice" element={<ProgressPage />} />
          <Route path="/progress/learn" element={<ProgressPage />} />
          <Route path="/progress/achievements" element={<ProgressPage />} />
          {/* Urdu course progress — a fully separate page so English and Urdu
              stats, learn progress and achievements never mix. */}
          <Route path="/progress/urdu" element={<UrduProgressPage />} />
          <Route path="/progress/urdu/test" element={<UrduProgressPage />} />
          <Route path="/progress/urdu/practice" element={<UrduProgressPage />} />
          <Route path="/progress/urdu/learn" element={<UrduProgressPage />} />
          <Route path="/progress/urdu/achievements" element={<UrduProgressPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/certificates" element={<MyCertificates />} />
          <Route path="/profile/:id" element={<ProfilePage />} />

          {/* Admin Panel ΓÇö route is guarded inside AdminLayout (admin role only). */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="lessons" element={<AdminLessons />} />
            <Route path="urdu-lessons" element={<AdminUrduLessons />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="achievements" element={<AdminAchievements />} />
            <Route path="certificate-paragraphs" element={<AdminCertificateParagraphs />} />
            <Route path="urdu-content" element={<AdminUrduContent />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Redirect unknown protected paths to My Progress */}
          <Route path="*" element={<Navigate to="/progress" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}




